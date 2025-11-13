import { client, io , persistenceManager} from '../server.js';
import { v4 } from 'uuid';
const QUESTION_API_URL = 'https://peerprep-question-service-354103976519.asia-southeast1.run.app/api/';


function convertDifficultyToString(difficulty) {
  switch (difficulty) {
    case '0':
      return 'EASY';
    case '1':
      return 'MEDIUM';
    case '2':
      return 'HARD';
    default:
      throw new Error('Invalid difficulty level');
  }
}

export async function createRoom(req, res) {
  try {
    const { topic, difficulty, userId1, userId2 } = req.body;
    let difficultyStr;
    try {
        difficultyStr = convertDifficultyToString(difficulty);
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
    let roomId;
    let success = false;




    while (!success) {
        roomId = `${topic}-${difficulty}-${v4()}`;
        const key = `room:${roomId}:info`;
        // create hash set with key as `room:${roomId}:info` only if it does not already exist
        const iso = new Date().toISOString();
        success = await client.hSetNX(key, 'created', iso);
    }

    // initialise room info entry in redis
    await client.hSet(`room:${roomId}:info`, {
        usernames: JSON.stringify([]),
    })

    // add question to room info
    // get the question from question service
    const getRequestString = `${QUESTION_API_URL}questions?difficulty=${difficultyStr}&limit=1&topic=${topic.toUpperCase()}`;
    console.log(getRequestString);
    // /api/questions?difficulty=EASY&limit=1&topic=HASHING
    const questionResponse = await fetch(getRequestString);
    if (!questionResponse.ok) {
        throw new Error(`Failed to fetch question from question service: ${questionResponse.statusText}`);
    } 
    else{

        const qnToStore = await questionResponse.json();
        const questionData = Array.isArray(qnToStore) ? qnToStore[0] : qnToStore;
        console.log(`Fetched question for topic ${topic} at difficulty ${difficulty}: ${JSON.stringify(questionData)}`);
        for (const [key, value] of Object.entries(questionData)) {
            console.log(`Question Data - ${key}: ${value}`);
        }
        await client.hSet(`room:${roomId}:info`, {
            question: JSON.stringify(questionData),
        }).catch((error) => {
            console.error(`Error setting question data in Redis for room ${roomId}: ${error.message}`);
            throw error;
        });
    }

    
    console.log(`Created room ${roomId} for topic ${topic} at difficulty ${difficulty}`);

    // add persistence entry
    await persistenceManager.getOrCreateDoc(roomId);

    console.log(`Initialized persistence for room ${roomId}`);

    const socketId1 = await client.hGet(`userMaps:${userId1}`, 'socketId');
    console.log(`Fetched socket ID for user ${userId1}: ${socketId1}`);
    const socketId2 = await client.hGet(`userMaps:${userId2}`, 'socketId');
    console.log(`Fetched socket ID for user ${userId2}: ${socketId2}`);
    
    if (socketId1) {
        io.to(socketId1).emit("roomCreated", { roomId: roomId });
        console.log(`Emitted roomCreated to socket ${socketId1} for user ${userId1}`);
    }
    if (socketId2) {
        io.to(socketId2).emit("roomCreated", { roomId: roomId });
        console.log(`Emitted roomCreated to socket ${socketId2} for user ${userId2}`);
    }


    return [res.status(200).json({ message: "Success" })]

  } catch (error) {
        console.error(`[500] /create-room -> ${error?.message || "Unknown error when creating room!"}`);
        return res.status(500).json({ message: error.message || "Unknown error when creating room!" });
  }
}