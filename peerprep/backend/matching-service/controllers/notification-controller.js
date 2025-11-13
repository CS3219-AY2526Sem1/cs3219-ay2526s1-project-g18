//AI Assistance Disclosure:
//Tool: Copilot (model: GPT-5 Mini), date: 2025-10-26
//Scope: Generated register client, generic send notification function, safeWrite function and
//closeSSEConnection function, in addition to the sseClients hashmap.

//Author review: I validated correctness and added more functions based on the generic one.
//Adjusted parameters to suit the user idKey, formating of values passed by the notifications,
//edited functions to be suit the specific event type.

import { CLOSE_EVENT, ERROR_EVENT, JOIN_GENERAL_QUEUE_EVENT, JOIN_NO_DIFFICULTY_QUEUE_EVENT, MATCH_EVENT, TIMEOUT_EVENT } from '../util/sse-event-names.js';
import { leaveQueues } from './queue-controller.js';

const sseClients = new Map(); // key: idKey (users:{id}), value: res object

export function registerSSEClient(req, res) {
    const userId = req.query.userId;
    if (!userId) {
        res.status(400).send('userId is required');
        return;
    }

    const idKey = `users:${userId}`;

    if (sseClients.has(idKey)) {
        // Close existing connection
        closeSSEConnection(idKey);
    }

    // Setup SSE headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    // Send initial connection message
    safeWrite(res, `data: ${JSON.stringify({ type: 'connected' })}\n\n`);

    // Store the connection
    sseClients.set(idKey, res);

    // Remove connection when client disconnects
    req.on(CLOSE_EVENT, () => {
        closeSSEConnection(idKey);
        sseClients.delete(idKey);
    });
}

export async function sendMatchNotification(idKey, dataPayload) {
    try {
        const clientRes = sseClients.get(idKey);
        if (clientRes) {
            safeWrite(clientRes, `event: ${MATCH_EVENT}\ndata: ${JSON.stringify(dataPayload)}\n\n`);
            closeSSEConnection(idKey);
        } else {
            console.error("No SSE client found for user:", idKey);
        }
    } catch (err) {
        console.error("Error sending match notification:", err);
    }
}

export async function sendTimeoutNotification(idKey) {
    try {
        const clientRes = sseClients.get(idKey);
        if (clientRes) {
            safeWrite(clientRes, `event: ${TIMEOUT_EVENT}\ndata: \n\n`);
            closeSSEConnection(idKey);
        } else {
            console.error("No SSE client found for user:", idKey);
        }
    } catch (err) {
        console.error("Error sending timeout notification for user:", idKey, err);
    }
}

export async function sendJoinNoDifficultyNotification(idKey) {
    try {
        const clientRes = sseClients.get(idKey);
        if (clientRes) {
            safeWrite(clientRes, `event: ${JOIN_NO_DIFFICULTY_QUEUE_EVENT}\ndata: \n\n`);
        } else {
            console.error("No SSE client found for user:", idKey);
        }
    } catch (err) {
        console.error("Error sending timeout notification for user:", idKey, err);
    }
}

export async function sendJoinGeneralNotification(idKey) {
    try {
        const clientRes = sseClients.get(idKey);
        if (clientRes) {
            safeWrite(clientRes, `event: ${JOIN_GENERAL_QUEUE_EVENT}\ndata: \n\n`);
        } else {
            console.error("No SSE client found for user:", idKey);
        }
    } catch (err) {
        console.error("Error sending timeout notification for user:", idKey, err);
    }
}


export async function sendErrorNotification(idKey, errorPayload) {
    try {
        const clientRes = sseClients.get(idKey);
        if (clientRes) {
            safeWrite(clientRes, `event: ${ERROR_EVENT}\ndata: ${JSON.stringify(errorPayload)}\n\n`);
            closeSSEConnection(idKey);
        } else {
            console.error("No SSE client found for user:", idKey);
        }
    } catch (err) {
        console.error("Error sending error notification:", err);
    }
}

export function closeSSEConnection(idKey) {
    try {
        const clientRes = sseClients.get(idKey);
        if (clientRes) {
            clientRes.write(`event: ${CLOSE_EVENT}\ndata: \n\n`);
            clientRes.end();
            sseClients.delete(idKey);
        }
    } catch (err) {
        console.error("Error closing SSE connection for user:", idKey, err);
    }
}

function safeWrite(res, data) {
    try {
        if (res.writableEnded || res.destroyed) {
            return false;
        }
        res.write(data);
        return true;
    } catch (err) {
        console.error("Error writing to SSE response:", err);
        return false;
    }   
}