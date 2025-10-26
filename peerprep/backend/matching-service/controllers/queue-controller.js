import client from "../cloud-services/redis.js";
import fs from "fs";
import { sendToColloboration } from "../cloud-services/amqp.js";
import { sendMatchNotification, sendTimeoutNotification, sendErrorNotification, registerSSEClient } from "./notification-controller.js";

// Insert user id and question criteria into queue, register SSE connection
export async function joinQueue(req, res) {
    try {
        if (req.body === null || typeof req.body === 'undefined' || Object.keys(req.body).length === 0) {
            console.error("Request body is undefined");
            return res.status(400).json({ message: "Request body is undefined" });
        }

        if (req.body.id === null || typeof req.body.id === "undefined") {
            console.error("User id is undefined");
            return res.status(400).json({ message: "User id is undefined" });
        }

        if (req.body.topic === null || typeof req.body.topic === "undefined") {
            console.error("Question topic is undefined");
            return res.status(400).json({ message: "Question topic is undefined" });
        }

        if (req.body.difficulty === null || typeof req.body.difficulty === "undefined") {
            console.error("Question difficulty is undefined");
            return res.status(400).json({ message: "Question difficulty is undefined" });
        } else {       
            const difficulty = Number(req.body.difficulty);
            if (!Number.isInteger(difficulty)) {
                console.error("Question difficulty is not an integer");
                return res.status(400).json({ message: "Question difficulty is not an integer" });
            }
        } 

        // Retrieve user id and question criteria  
        const idKey = "users:" + req.body.id;
        const queueCriteria = "queue:specific:" + req.body.topic + ":" + req.body.difficulty;

        // Use Lua script to atomically check if user is already in a queue and add them if not
        const lua = fs.readFileSync("./lua-scripts/join-queue.lua", "utf8");
        const added = await client.eval(lua, { keys: [idKey, queueCriteria], arguments: ["0", JSON.stringify([queueCriteria])] });

        if (added === 1) {
            return res.status(200).json({ message: "User added to queue" });
        } else {
            return res.status(400).json({ message: "user already in queue" });
        }

    } catch (err) { 
        console.error("Error joining queue: ", err);
        res.status(500).json({ message: "Redis server error" });
    }    
};

// Remove individual user from queues and database on manual leave
export async function manualLeaveQueues(req, res) {
    try {
        if (req.body === null || typeof req.body === 'undefined' || Object.keys(req.body).length === 0) {
            console.error("Request body is undefined");
            return res.status(400).json({ message: "Request body is undefined" });
        }

        if (req.body.id === null || typeof req.body.id === "undefined") {
            console.error("User id is undefined");
            return res.status(400).json({ message: "User id is undefined" });
        }

        // Retrieve user id and question criteria  
        const idKey = "users:" + req.body.id;

        const userExists = await client.exists(idKey);
        if (userExists === 0) {
            return res.status(404).json({ message: "User not in queue" });
        }

        await leaveQueues(idKey);
        // Close SSE connection
        closeSSEConnection(idKey);
        res.status(200).json({ message: "User removed from queue" });

    } catch (err) {
        res.status(500).json({ message: "Redis server error" });
    }
}

// Add user to queue with topic but no difficulty with their key
export async function joinNoDifficultyQueue(idKey) {
    try {
        const userExists = await client.exists(idKey);
        if (userExists === 0) {
            return console.error("User not in specific queue, cannot join no difficulty queue");
        }

        const topic = getRawTopicString((await getQueueList(idKey))[0]);
        const noDifficultyQueue = "queue:nodifficulty:" + topic;

        await client.lPush(noDifficultyQueue, idKey);

        var queueList = await getQueueList(idKey);
        queueList.push(noDifficultyQueue);
        await client.hSet(idKey, {queueList: JSON.stringify(queueList) });
    } catch (err) {
        console.error("Error joining no difficulty queue:", err);
    }
}

// Add user to general queue with their key
export async function joinGeneralQueue(idKey) {
    try {
        const userExists = await client.exists(idKey);
        if (userExists === 0) {
            return console.error("User not in specific queue, cannot join general queue");
        }

        await client.lPush("queue:general", idKey);

        var queueList = await getQueueList(idKey);
        queueList.push("queue:general");
        await client.hSet(idKey, {queueList: JSON.stringify(queueList) });

    } catch (err) {
        console.error("Error joining general queue:", err);
    }        
}

export async function leaveQueues(idKey) {
    try {
        const queueListString = await client.hGet(idKey, "queueList");
        var queueList = [];
        if (!queueListString) {
            console.error("No queueList found for user");
        } else {
            queueList = JSON.parse(queueListString);
            for (const queueCriteria of queueList) {
                await client.lRem(queueCriteria, 0, idKey);
            }   
        }
        await client.unlink(idKey);
    } catch (err) {
        console.error("Error leaving queues:", err);
    }
}            

export async function timeOutUser(idKey) {
    try {
        const userExists = await client.exists(idKey);
        if (userExists === 0) {
            return console.error("User not in queue, cannot timeout");
        }

        await leaveQueues(idKey);
        sendTimeoutNotification(idKey);
    } catch (err) {
        console.error("Error timing out user:", err);
    }
}        

// Match two users from queue and remove them from queue and database
export async function matchUsers(queueCriteria) {
    try {
        console.log("Matching users in queue:", queueCriteria);
        if (await client.lLen(queueCriteria) < 2) {
            return console.error("Not enough users in queue to match");
        }    

        // Pop two users from queue
        const idKey1 = await client.rPop(queueCriteria);
        const idKey2 = await client.rPop(queueCriteria);
        const id1 = getRawIdString(idKey1);
        const id2 = getRawIdString(idKey2);

        // Remove "queue:" prefix to get question criteria
        let queueType = getRawQueueTypeString(queueCriteria);
        let questionTopic = "";
        let difficulty = "";

        switch (queueType) {
            case "specific":
                questionTopic = getRawTopicString(queueCriteria);
                difficulty = getRawDifficultyString(queueCriteria);
                break;
            case "nodifficulty":
                questionTopic = getRawTopicString(queueCriteria);
                difficulty = await handleNoDifficultyQueueDifficulty(idKey1, idKey2);
                break;
            case "general":
                const generalCriteria = await handleGeneralQueueCriteria(idKey1, idKey2);
                questionTopic = generalCriteria.split(":")[0];
                difficulty = generalCriteria.split(":")[1];
                break;
            default:
                console.error("Unknown queue type:", queueType);
                return;
        }        
        await leaveQueues(idKey1);
        await leaveQueues(idKey2);

        // Publish matched users and info, await consumption by colloboration-service
        const collaborationMessage = JSON.stringify([ id1, id2, questionTopic, difficulty ]);
        sendToColloboration(collaborationMessage);
        sendMatchNotification(idKey1, { partnerId: id2, topic: questionTopic, difficulty: difficulty });
        sendMatchNotification(idKey2, { partnerId: id1, topic: questionTopic, difficulty: difficulty });
        console.log("Matched users:", id1, id2);

    } catch (err) {
        console.error("Error matching users:", err);
    }
}

// Handle getting question criteria for general queue match
export async function handleGeneralQueueCriteria(idKey1, idKey2) {
    try {
        // Get their question criteria
        const queueList1 = await getQueueList(idKey1);
        const queueList2 = await getQueueList(idKey2); 
        const specificCriteria1 = queueList1.filter(q => q.startsWith("queue:specific"))[0];
        const specificCriteria2 = queueList2.filter(q => q.startsWith("queue:specific"))[0];

        if (!specificCriteria1 || !specificCriteria2) {
            console.error("One or both users in general queue have no specific criteria");
        }

        // Take the easier difficulty
        const difficulty1 = parseInt(getRawDifficultyString(specificCriteria1));
        const difficulty2 = parseInt(getRawDifficultyString(specificCriteria2));
        const difficulty = Math.min(difficulty1, difficulty2);

        // Randomly choose one of the two topics
        let rngChoice = Math.random();
        let topic = "";
        if (rngChoice < 0.5) {
            topic = getRawTopicString(specificCriteria1);
        } else {
            topic = getRawTopicString(specificCriteria2);
        }
        const questionCriteriaSplit = topic + ":" + difficulty;
        return questionCriteriaSplit;
    } catch (err) {
        console.error("Error handling general queue criteria:", err);
    }    
}

// Handle getting difficulty for no difficulty queue match
export async function handleNoDifficultyQueueDifficulty(idKey1, idKey2) {
    try {
        // Get their question criteria
        const queueList1 = await getQueueList(idKey1);
        const queueList2 = await getQueueList(idKey2); 
        const specificCriteria1 = queueList1.filter(q => q.startsWith("queue:specific"))[0];
        const specificCriteria2 = queueList2.filter(q => q.startsWith("queue:specific"))[0];

        if (!specificCriteria1 || !specificCriteria2) {
            console.error("One or both users in no difficulty queue have no specific criteria");
        }

        // Take the easier difficulty
        const difficulty1 = parseInt(getRawDifficultyString(specificCriteria1));
        const difficulty2 = parseInt(getRawDifficultyString(specificCriteria2));
        const difficulty = Math.min(difficulty1, difficulty2);

        return difficulty;

    } catch (err) {
        console.error("Error handling no difficulty queue difficulty:", err);
    }  
}      

export async function isInNoDifficultyQueue(idKey) {
    const queueList = await getQueueList(idKey);
    return queueList.some(q => q.startsWith("queue:nodifficulty"));
}

export async function isInGeneralQueue(idKey) {
    const queueList = await getQueueList(idKey);   
    return queueList.includes("queue:general");
}

// Helper functions for parsing queueList in Redis
async function getQueueList(idKey) {
  try { 
    const queueListString = await client.hGet(idKey, "queueList");
    if (!queueListString) {
        console.error("No queueList found for user");
        return [];
    }
    return JSON.parse(queueListString);
  } catch (err) {
    console.error("Error parsing queueList:", err);
    return [];
  }
}

// Helper functions for formatting id, queue type and question criteria from Redis
function getRawIdString(idKey) {
    return idKey.split(":")[1];
}

function getRawQueueTypeString(queueCriteria) {
    return queueCriteria.split(":")[1];
}    

function getRawTopicString(queueCriteria) {
    return queueCriteria.split(":")[2];
}    

function getRawDifficultyString(queueCriteria) {
    return queueCriteria.split(":")[3];
}