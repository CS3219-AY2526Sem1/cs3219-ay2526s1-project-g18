import "dotenv/config";
import amqplib from 'amqplib';
import { COLLABORATION_QUEUE_NAME } from "../util/rabbitmq-queue-names";

export let amqpConnection, notificationChannel, collaborationChannel;
let amqpUri = process.env.ENV === "PROD"
    ? process.env.AMQP_CLOUD_URI
    : process.env.AMQP_LOCAL_URI


export async function connectRabbitMQ() {
    try {
        amqpConnection = await amqplib.connect(amqpUri);
        collaborationChannel = await amqpConnection.createChannel();

        const messageTTL = 600000; // 10 minutes in milliseconds

        await collaborationChannel.assertQueue(COLLABORATION_QUEUE_NAME, {
            durable: true, 
            arguments: {"x-message-ttl": messageTTL} 
        });

        console.log('Connected to RabbitMQ and asserted queues:', COLLABORATION_QUEUE_NAME);
    } catch (err) {
        console.error('Error connecting to RabbitMQ:', err);
        process.exit(1);
    }
}

export async function sendToColloboration(message) {
    if (!collaborationChannel) {
        throw new Error('RabbitMQ collaboration channel is not established.');
    }
    console.log('Sending message to collaboration queue:', message);
    collaborationChannel.sendToQueue(COLLABORATION_QUEUE_NAME, Buffer.from(JSON.stringify(message)), { persistent: true });
}
