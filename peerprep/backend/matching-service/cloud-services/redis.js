import "dotenv/config";
import redis from "redis";

let redisUri = process.env.ENV === "PROD"
    ? process.env.REDIS_CLOUD_URI
    : process.env.REDIS_LOCAL_URI
const client = redis.createClient({ url: redisUri });

// Determine Redis URI based on environment
export async function connectRedis() {
    try {
        await client.connect();
        console.log("Connected to Redis!");
    } catch (err) {
        console.error("Error connecting to Redis:", err);
        process.exit(1);
    }
}

export default client;