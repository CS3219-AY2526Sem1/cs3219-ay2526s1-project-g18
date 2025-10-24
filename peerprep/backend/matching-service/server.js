import http from "http";
import index from "./index.js";
import "dotenv/config";
import redis from "redis";

const port = process.env.PORT || 3002;

const server = http.createServer(index);

// Determine Redis URI based on environment
let redisUri =
  process.env.ENV === "PROD"
    ? process.env.REDIS_CLOUD_URI
    : process.env.REDIS_LOCAL_URI
const client = redis.createClient({ url: redisUri });

async function connectRedis() {
  try {
    await client.connect();
    console.log("Connected to Redis!");
  } catch (err) {
    console.error("Error connecting to Redis:", err);
    process.exit(1);
  }
}

await connectRedis();

server.listen(port);
console.log("Matching service server listening on http://localhost:" + port);

export default client;
