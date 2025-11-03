//AI Assistance Disclosure:
//Tool: ChatGPT (model: GPT-5 Thinking), date: 2025-11-02
//Scope: Generated initial implementation of PersistenceManager class, added later modifications myself

//Author review: I validated correctess and made minor modifications
// here is the data storage format I specified to chatGPT:
// The data must be stored to Redis in the form of a HashSet with the 
// key `room:${roomId}:data` (roomId will be passed into this PersistenceManager class).
// values:
// snapshot: current snapshot of yjs doc
// awareness: current snapshot of awareness
// updatedAt: dateTime string of when this was updated to the database

// Own modifications to AI code:
// I added a new function handleClientLeftRoom to work with Attempt History Service API
// I added the API call to Attempt History Service in closeRoom function
// Made some minor changes for consistency with server.js

import * as Y from 'yjs';
import * as awarenessProtocol from 'y-protocols/awareness';

/**
 * PersistenceManager: manages in-memory Y.Doc + Awareness per room
 * and persists Y state + encoded awareness (binary -> base64) to Redis.
 *
 * Redis schema:
 *   key = room:<roomId>:data
 *   fields: snapshot (base64), awareness (base64), updatedAt
 */
export default class PersistenceManager {
  constructor(redisClient, options = {}) {
    if (!redisClient) throw new Error('Redis client required');
    this.client = redisClient;
    this.docs = new Map(); // roomId -> { doc, awareness, interval }
    this.intervalMs = options.persistIntervalMs || 1000;
  }

  _redisKey(roomId) {
    return `room:${roomId}:data`;
  }

  /** Create or return an entry for roomId; restore from Redis if present */
  async getOrCreateDoc(roomId) {
    if (this.docs.has(roomId)) return this.docs.get(roomId);

    const doc = new Y.Doc();
    const awareness = new awarenessProtocol.Awareness(doc);

    // restore snapshot + awareness from redis (if available)
    try {
      const key = this._redisKey(roomId);
      const data = await this.client.hGetAll(key);
      if (data && data.snapshot) {
        const snapshotBuf = new Uint8Array(Buffer.from(data.snapshot, 'base64'));
        Y.applyUpdate(doc, snapshotBuf);
      }
      if (data && data.awareness) {
        const awBuf = new Uint8Array(Buffer.from(data.awareness, 'base64'));
        // apply saved awareness binary into the server-side Awareness instance
        awarenessProtocol.applyAwarenessUpdate(awareness, awBuf, /* origin */ null);
      }
    } catch (err) {
      console.error('PersistenceManager.restore error', err);
    }

    // persist on awareness changes quickly (non-blocking)
    const awarenessListener = ({ added, updated, removed }) => {
      // fire-and-forget a persistence; periodic persist also runs
      this.persistNow(roomId).catch(e => console.error('Persist on awareness change failed', e));
    };
    awareness.on('update', awarenessListener);

    // periodic persistence
    const interval = setInterval(() => {
      this._persistOnce(roomId).catch(err => {
        console.error(`Error persisting room ${roomId}:`, err);
      });
    }, this.intervalMs);

    const entry = { doc, awareness, interval, awarenessListener };
    this.docs.set(roomId, entry);
    return entry;
}

  /** internal single persist operation */
  async _persistOnce(roomId) {
    const entry = this.docs.get(roomId);
    if (!entry) return;
    const { doc, awareness } = entry;
    try {
      const update = Y.encodeStateAsUpdate(doc); // Uint8Array
      const snapshotBase64 = Buffer.from(update).toString('base64');

      // encode awareness full state (all client ids)
      const clientIds = Array.from(awareness.getStates().keys());
      const awEncoded = awarenessProtocol.encodeAwarenessUpdate(awareness, clientIds); // Uint8Array
      const awBase64 = Buffer.from(awEncoded).toString('base64');

      const payload = {
        snapshot: snapshotBase64,
        awareness: awBase64,
        updatedAt: Date.now().toString()
      };
      await this.client.hSet(this._redisKey(roomId), payload);
    } catch (err) {
      console.error(`PersistenceManager._persistOnce(${roomId}) error`, err);
      throw err;
    }
  }

  /** Force immediate persist for a single room */
  async persistNow(roomId) {
    return this._persistOnce(roomId);
  }

  /** Apply an incoming awareness update (Uint8Array or Buffer) from a client */
  async applyAwarenessUpdate(roomId, update) {
    const entry = await this.getOrCreateDoc(roomId);
    const { awareness } = entry;
    try {
      // ensure update is Uint8Array
      const buf = (update instanceof Uint8Array) ? update : new Uint8Array(Buffer.from(update));
      awarenessProtocol.applyAwarenessUpdate(awareness, buf, /* origin */ null);
      // persist immediately (fire-and-forget)
      this.persistNow(roomId).catch(e => console.error('persistNow failed after applyAwarenessUpdate', e));
    } catch (err) {
      console.error('applyAwarenessUpdate error', err);
      throw err;
    }
  }

  /** Encode and return the current awareness state as Uint8Array (ready to send to client) */
  async getEncodedAwarenessUpdate(roomId) {
    const entry = await this.getOrCreateDoc(roomId);
    const { awareness } = entry;
    const clientIds = Array.from(awareness.getStates().keys());
    return awarenessProtocol.encodeAwarenessUpdate(awareness, clientIds);
  }

  /** Update own and Attempt History Service when one client leaves the room */
  async handleClientLeftRoom(roomId, clientIdToLeave) {
    const entry = this.docs.get(roomId);
    if (!entry) return;
    const { awareness } = entry;
    try {
      awarenessProtocol.removeAwarenessStates(
      awareness,
      Array.from(awareness.getStates().keys())
        .filter(client => client !== clientIdToLeave),
      'connection closed')
    } catch (err) {
      console.error('Error removing awareness state for client leaving room', err);
    }
    
    await this._postAttemptToQuestionHistoryService(roomId, clientIdToLeave);
    
    // persist immediately
    this.persistNow(roomId).catch(e => console.error('persistNow failed after clientLeftRoom', e));

  }

  /** Helper function to get all fields from persistent storage to save to Attempt History Service
   * Returns a payload for the Attempt History Service
  */
  async _getRoomPersistentInfo(roomId) {
    // The in-memory map stores entries of the form { doc, awareness, interval, ... }
    const entry = this.docs.get(roomId);

    // room info in Redis (may return an object with fields as strings)
    const roomInfo = await this.client.hGetAll(`room:${roomId}:info`);
    const created = roomInfo?.created ?? null;
    const usernames = roomInfo?.usernames ?? null;
    const status = roomInfo?.status ?? null;

    // declare variables to hold the converted data
    let sharedCode = "NONE";
    let completedStatus = "DISCONNECTED";
    let connectedAtTime = null;
    let qnData = "hello"; // placeholder till qn api implemented
    let userNames = null;

    // If we have a loaded Y.Doc entry, extract the text from a Y.Text type.
    if (entry && entry.doc) {
      try {

        const ytext = entry.doc.getText();
        if (ytext) {
          sharedCode = ytext.toString();
        }
      } catch (err) {
        console.error("Error extracting text from Y.Doc for room", roomId, err);
      }
    }

    // Map room status to our completedStatus enum
    if (status) {
      switch (status) {
        case 'solved':
          completedStatus = "SOLVED";
          break;
        case 'time_ended':
          completedStatus = "OUT_OF_TIME";
          break;
        case 'disconnected':
          completedStatus = "DISCONNECTED";
          break;
        default:
          completedStatus = "DISCONNECTED";
      }
    }

    if (created) {
      connectedAtTime = created;
    }

    if (usernames) {
      // usernames may be stored as a JSON string or comma-separated; try to parse
      try {
        userNames = JSON.parse(usernames);
      } catch (_e) {
        userNames = usernames;
      }
    }

    return {
      sharedCode,
      completedStatus,
      connectedAtTime,
      qnData,
      userNames,
    };

  }

  /** Close room: persist once, stop interval and remove awareness listener */
async closeRoom(roomId, userId) {
  const entry = this.docs.get(roomId);
  if (!entry) return;

  // stop periodic persistence
  clearInterval(entry.interval);

  try {
    await this._persistOnce(roomId);
  } catch (err) {
    console.error('Error persisting on closeRoom', err);
  }

  // remove awareness states (if any)
  try {
    if (entry.awareness && typeof entry.awareness.getStates === 'function') {
      const clientIds = Array.from(entry.awareness.getStates().keys());
      if (clientIds.length) {
        awarenessProtocol.removeAwarenessStates(entry.awareness, clientIds, 'connection closed');
      }
    }
  } catch (e) {
    console.log('closeRoom - removeAwarenessStates error:', e.message);
  }

  // check if someone disconnected
  const discIdfetched = await this.client.hGet(`room:${roomId}:info`, 'disconnected');
  if (discIdfetched && discIdfetched === userId) {
    return; // user already disconnected, added to attempt history so skip
  }

  // notify Attempt History Service
  await this._postAttemptToQuestionHistoryService(roomId, userId);

  // finally remove entry from memory
  this.docs.delete(roomId);
}

  async _postAttemptToQuestionHistoryService(roomId, userId) {
    
    // read user progress state
    const userProgressState = await this.client.hGet(`room:${roomId}:info`, 'status');

    let payload;
    try {
      payload = await this._getRoomPersistentInfo(roomId, userId);
    } catch (err) {
      console.error('Error building persistent payload for Attempt History Service', err);
      payload = null;
    }

    const canNotify = payload &&
      (payload.sharedCode !== undefined && payload.sharedCode !== null) &&
      payload.completedStatus &&
      payload.connectedAtTime &&
      payload.qnData &&
      payload.userNames;

    if (userProgressState === 'solved') {
      console.log('User finished the room successfully');
      if (canNotify) {
        console.log(`Notifying Attempt History Service that room is ${payload.completedStatus} at ${payload.connectedAtTime}`);
        // TODO: call Attempt History Service here (await fetch/HTTP client)
      } else {
        console.error('Cannot notify Attempt History Service as some payload fields are null', payload);
      }
    } else {
      console.log('User did not finish the room in time');
      if (canNotify) {
        console.log(`Notifying Attempt History Service that room is ${payload.completedStatus} at ${payload.connectedAtTime}`);
        // TODO: call Attempt History Service here
      } else {
        console.error('Cannot notify Attempt History Service as some payload fields are null', payload);
      }
  }
}


/**

 * Restore all persisted rooms into memory.
 * Call this once at server startup to eagerly restore rooms that were
 * persisted before a crash / restart.
 *
 * Uses Redis keys of the form `room:<roomId>:data`. If your Redis client
 * does not support `keys` in production, replace with a SCAN-based iterator.
 */
async restoreAllRooms() {
    try {
      // Attempt to read keys like room:<roomId>:data
      if (typeof this.client.keys === 'function') {
        const keys = await this.client.keys('room:*:data');
        for (const key of keys) {
          const m = key.match(/^room:(.*):data$/);
          if (!m) continue;
          const roomId = m[1];
          // create & restore the doc into memory
          try {
            await this.getOrCreateDoc(roomId);
          } catch (err) {
            console.error(`Failed to restore room ${roomId}`, err);
          }
        }
      } else {
        // fallback: no keys support — nothing to eagerly restore
        console.warn('Redis client does not support keys(); skipping restoreAllRooms');
      }
    } catch (err) {
      console.error('restoreAllRooms error', err);
    }
  }
}
