import http from "http";
import index from "./index.js";
import { connectRedis } from "./cloud-services/redis.js";

const port = process.env.PORT || 3002;

const server = http.createServer(index);

await connectRedis();

server.listen(port);
console.log("Matching service server listening on http://localhost:" + port);
