import http from "http";
import index from "./index.js";
import "dotenv/config";
import redis from "redis";

const server = http.createServer(index);
const port = process.env.PORT || 3003;

// Determine Redis URI based on environment
let redisUri =
  process.env.ENV === "PROD"
    ? process.env.REDIS_CLOUD_URI
    : process.env.REDIS_LOCAL_URI
export const client = redis.createClient({ url: redisUri });

async function connectRedis() {
  try {
    await client.connect();
    console.log("Collaboration service connected to Redis!");
  } catch (err) {
    console.error("Error connecting collaboration service to Redis:", err);
    process.exit(1);
  }
}

await connectRedis();

server.listen(port);
console.log("Collaboration service server listening on http://localhost:" + port);

export default server;

