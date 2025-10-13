import client from "../server.js";

// Insert user id and question criteria into queue
export async function joinQueue(req, res) {
    try {
        // Retrieve user id and question criteria  
        const id = req.body.id;
        const topic = req.body.topic;
        const difficulty = req.body.difficulty;
        const questionCriteria = topic + ":" + difficulty;

        // Add user to Redis database if not already present
        const userExists = await client.exists(id);
        if (userExists === 0) {
            await client.hSet(id, { id: id, topic: topic, difficulty: difficulty });
        } else {
            return res.status(400).json({ message: "user already in queue" });
        }

        // Push user to Redis queue
        await client.lPush(questionCriteria, id);

        res.status(200).send("User added to queue");

    } catch (err) { 
        console.error("Error joining queue:", err);
        res.status(500).send("Redis server error");
    }    
};

// Remove individual user from queues and database on manual leave
export async function leaveQueue(req, res) {
    try {
        // Retrieve user id and question criteria  (API tbc)
        const id = req.body.id;
        const topic = req.body.topic;
        const difficulty = req.body.difficulty;
        const questionCriteria = topic + ":" + difficulty;

        // Remove user from Redis queue
        client.lRem(questionCriteria, 0, id);

        // Remove user from Redis database
        await client.unlink(id);

        res.status(200).send("User removed from queue");

    } catch (err) {
        console.error("Error leaving queue:", err);
        res.status(500).send("Redis server error");
    }
}

// Match two users from queue and remove them from queue and database
export async function matchUsers(req, res) {
    try {
        // Retrieve question criteria (API tbc)
        const topic = req.body.topic;
        const difficulty = req.body.difficulty;
        const questionCriteria = topic + ":" + difficulty;

        // Pop two users from Redis queue
        const id1 = await client.rPop(questionCriteria);
        const id2 = await client.rPop(questionCriteria);
        console.log("Matched users:", id1, id2);

        // Remove users from Redis database
        await client.unlink(id1);
        await client.unlink(id2);

        res.status(200).json({ id1, id2 });

    } catch (err) {
        console.error("Error matching users:", err);
        res.status(500).send("Redis server error");
    }
}