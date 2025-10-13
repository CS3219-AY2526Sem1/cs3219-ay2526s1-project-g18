import client from "../server.js";

// Insert user id and question criteria into queue
export async function joinQueue(req, res) {
    try {
        // Retrieve user id and question criteria  
        const idKey = "users:" + req.body.id;
        const queueCriteria = "queue:" + req.body.topic + ":" + req.body.difficulty;

        // Add user to Redis database if not already present
        const userExists = await client.exists(idKey);
        if (userExists === 0) {
            await client.hSet(idKey, {
                 time: JSON.stringify(0), 
                 queueList: JSON.stringify([ queueCriteria ]) 
            });
        } else {
            return res.status(400).json({ message: "user already in queue" });
        }

        // Push user to Redis queue
        await client.lPush(queueCriteria, idKey);

        res.status(200).send("User added to queue");

    } catch (err) { 
        console.error("Error joining queue:", err);
        res.status(500).send("Redis server error");
    }    
};

// Remove individual user from queues and database on manual leave
export async function manualLeaveQueues(req, res) {
    try {
        // Retrieve user id and question criteria  
        const idKey = "users:" + req.body.id;

        const userExists = await client.exists(idKey);
        if (userExists === 0) {
            return res.status(404).json({ message: "user not in queue" });
        }

        await leaveQueues(idKey);
        res.status(200).send("User removed from queue");

    } catch (err) {
        res.status(500).send("Redis server error");
    }
}

// Add user to general queue with their key
export async function joinGeneralQueue(idKey) {
    try {
        const userExists = await client.exists(idKey);
        if (userExists === 0) {
            return console.error("User not in specific queue, cannot join general queue");    ;
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
        }

        for (const queueCriteria of queueList) {
            await client.lRem(queueCriteria, 0, idKey);
        }    

        await client.unlink(idKey);
    } catch (err) {
        console.error("Error leaving queues:", err);
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
        let questionTopic = getRawTopicString(queueCriteria);
        let difficulty = "";

        if (questionTopic === "general") {
            // Determine question criteria to use
            const generalCriteria = await handleGeneralQueueCriteria(idKey1, idKey2);
            questionTopic = generalCriteria.split(":")[0];
            difficulty = generalCriteria.split(":")[1];

            // Remove both users from specific queue also
            await leaveQueues(idKey1);
            await leaveQueues(idKey2);
        } else {
            difficulty = getRawDifficultyString(queueCriteria);

            // Remove users from Redis database
            await client.unlink(idKey1);
            await client.unlink(idKey2);
        }

        console.log("Matched users:", id1, id2);
        return JSON.stringify([ id1, id2, questionTopic, difficulty ]);

    } catch (err) {
        console.error("Error matching users:", err);
    }
}

// Handle getting question criteria from general queue
export async function handleGeneralQueueCriteria(idKey1, idKey2) {
    try {
        // Get their question criteria
        const queueList1 = await getQueueList(idKey1);
        const queueList2 = await getQueueList(idKey2); 
        const specificCriteria1 = queueList1.filter(q => q !== "queue:general")[0];
        const specificCriteria2 = queueList2.filter(q => q !== "queue:general")[0];

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

// Helper functions for formatting id and question criteria from Redis
function getRawIdString(idKey) {
    return idKey.split(":")[1];
}

function getRawTopicString(queueCriteria) {
    return queueCriteria.split(":")[1];
}    

function getRawDifficultyString(queueCriteria) {
    return queueCriteria.split(":")[2];
}