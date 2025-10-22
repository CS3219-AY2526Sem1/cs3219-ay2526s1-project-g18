import client from './server.js';
import { joinNoDifficultyQueue, joinGeneralQueue, leaveQueues, matchUsers, isInNoDifficultyQueue, isInGeneralQueue } from './controllers/queue-controller.js';

const matchInterval = 1000; // in milliseconds

// Matchmaker function to run periodically
export function runMatchmaker() {
    setInterval(async () => {
        try {
            //console.log("Running matchmaker...");

            // Process queues in order from most specific to least
            const specificQueues = await client.keys("queue:specific:*");
            await processQueues(specificQueues);
            const noDifficultyQueues = await client.keys("queue:nodifficulty:*");
            await processQueues(noDifficultyQueues);
            const generalQueue = await client.keys("queue:general");
            await processQueues(generalQueue);

            // Increment time waited for all users left in queues and add to queues if needed
            const userIdKeys = await client.keys("users:*");
            await processUserTime(userIdKeys);
        } catch (err) {
            console.error("Error in matchmaker:", err);
        }
    }, matchInterval);
}        

//Process exiting queues, match users in each queue if size > 1, handle general queue
async function processQueues(queues) {
    try {
        for (const queueCriteria of queues) {
            let size = await client.lLen(queueCriteria);
            while (size > 1) {
                try {
                    const matchResults = await matchUsers(queueCriteria);
                    processMatchmakingResults(matchResults);
                    size = await client.lLen(queueCriteria);
                } catch (err) {
                    console.error("Error matching users in queue:", err);
                    break;
                }
            }
        }
    } catch (err) {
        console.error("Error processing queues:", err);
    }
}

// Handle incrementing time for users, removal and adding to general queue
async function processUserTime(userIdKeys) {
    try {
        // Times here are in seconds
        const noDifficultyQueueTime = 45;
        const generalQueueTime = 75;
        const maxQueueTime = 105;
        for (const idKey of userIdKeys) {
            const timeWaitedString = await client.hGet(idKey, "time");
            if (!timeWaitedString) {
                console.error("No time field for user:", idKey);
                continue;
            }
            const timeWaited = JSON.parse(timeWaitedString);
            
            if (timeWaited >= maxQueueTime) {
                console.log(`User waiting for more than %d seconds, removing from all queues`, maxQueueTime);
                await leaveQueues(idKey);
                continue;
            }

            if (timeWaited >= noDifficultyQueueTime && !(await isInNoDifficultyQueue(idKey))) {
                console.log(`User waiting for more than %d seconds, adding to no difficulty queue`, noDifficultyQueueTime);
                await joinNoDifficultyQueue(idKey);
            }

            if (timeWaited >= generalQueueTime && !(await isInGeneralQueue(idKey))) {
                console.log(`User waiting for more than %d, adding to general queue`, generalQueueTime);
                await joinGeneralQueue(idKey);
            }    

            await client.hSet(idKey, "time", JSON.stringify(timeWaited + matchInterval / 1000)); // Increment by matchInterval in seconds
        }
    } catch (err) {
        console.error("Error processing user times:", err);
    }        
}

function processMatchmakingResults(results) {
    // To be implemented: Send notifications to matched users
    // Retrieve question id from question service
    // Send user ids and question id to collaboration service
    console.log("Matched users:", results);
}