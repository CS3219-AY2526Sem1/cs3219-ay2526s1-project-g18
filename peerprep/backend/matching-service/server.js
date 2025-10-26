import http from "http";
import index from "./index.js";
import { connectRedis } from "./cloud-services/redis.js";
import { connectRabbitMQ } from "./cloud-services/amqp.js";

const port = process.env.PORT || 3002;

const server = http.createServer(index);

await connectRedis();
await connectRabbitMQ();

server.listen(port);
console.log("Matching service server listening on http://localhost:" + port);
