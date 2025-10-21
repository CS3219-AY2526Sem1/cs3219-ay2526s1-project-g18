import client from './server.js';
import { joinGeneralQueue, leaveQueues, matchUsers, isInGeneralQueue } from './controllers/queue-controller.js';

// Matchmaker function to run periodically
export function runMatchmaker() {
    setInterval(async () => {
        try {
            console.log("Running matchmaker...");
            const existingQueues = await client.keys("queue:*");
            await processQueues(existingQueues);

            // Increment time waited for all users left in queues by 5 seconds
            const userIdKeys = await client.keys("users:*");
            await processUserTime(userIdKeys);
        } catch (err) {
            console.error("Error in matchmaker:", err);
        }
    }, 5000); // Run every 5 seconds
}        

//Process exiting queues, match users in each queue if size > 1, handle general queue
async function processQueues(existingQueues) {
    try {
        for (const queueCriteria of existingQueues) {
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
        const generalQueueTime = 300; // 5 minutes
        const maxQueueTime = 600; // 10 minutes
        for (const idKey of userIdKeys) {
            const timeWaitedString = await client.hGet(idKey, "time");
            const timeWaited = JSON.parse(timeWaitedString);
            
            if (timeWaited < maxQueueTime) {
                if (timeWaited > generalQueueTime && !(await isInGeneralQueue(idKey))) {
                    // User has waited more than 5 minutes, add to general queue
                    console.log("User waiting for more than 5 minutes, adding to general queue");
                    await joinGeneralQueue(idKey);
                }
                await client.hSet(idKey, "time", JSON.stringify(timeWaited + 5));
            } else {
                // User has waited more than 10 minutes, remove from all queues
                console.log("User waiting for more than 10 minutes, removing from all queues");
                await leaveQueues(idKey);
            }
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