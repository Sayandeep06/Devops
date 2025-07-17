import express from "express";
import { createClient } from "redis";

const app = express();
app.use(express.json());

const client = createClient();
client.on('error', (err) => console.log('Redis Client Error', err));

// ==== PUSH COMMANDS ==== //

// LPUSH: Add elements to HEAD (left) of the list.
//   - Use for stack (LIFO) or when you want most-recent items first.
app.post("/lpush", async (req, res) => {
    const { key, value } = req.body;
    try {
        const len = await client.lPush(key, value);
        res.send(`LPUSH success, new length: ${len}`);
    } catch (err) {
        res.status(500).send("LPUSH failed");
    }
});

// RPUSH: Add elements to TAIL (right) of the list.
//   - Use for FIFO queues or when you want items to be processed in insertion order.
app.post("/rpush", async (req, res) => {
    const { key, value } = req.body;
    try {
        const len = await client.rPush(key, value);
        res.send(`RPUSH success, new length: ${len}`);
    } catch (err) {
        res.status(500).send("RPUSH failed");
    }
});

// ==== NON-BLOCKING POP COMMANDS ==== //

// LPOP: Remove and return HEAD (left) element.
//   - Use for FIFO queue consumer or popping oldest on left.
app.get("/lpop", async (req, res) => {
    const { key }  = req.query;
    try {
        const val = await client.lPop(key as string);
        if (val === null) return res.status(404).send("List empty");
        res.json({ value: val });
    } catch (err) {
        res.status(500).send("LPOP failed");
    }
});

// RPOP: Remove and return TAIL (right) element.
//   - Use for stack (LIFO) consumer or popping most-recent on right.
app.get("/rpop", async (req, res) => {
    const { key } = req.query;
    try {
        const val = await client.rPop(key as string);
        if (val === null) return res.status(404).send("List empty");
        res.json({ value: val });
    } catch (err) {
        res.status(500).send("RPOP failed");
    }
});

// ==== BLOCKING POP COMMANDS ==== //

// BLPOP: Block and pop HEAD (left).
//   - Use for worker queues or consumers that wait for new tasks.
//   - Good for distributed consumers to avoid busy polling[2][10].
app.get("/blpop", async (req, res) => {
    const { key, timeout } = req.query;
    try {
        const val = await client.blPop(key as string, timeout ? parseInt(timeout as string) : 0);
        if (val === null) return res.status(404).send("Timeout expired, no elements");
        res.json(val);
    } catch (err) {
        res.status(500).send("BLPOP failed");
    }
});

// BRPOP: Block and pop TAIL (right).
//   - Use for worker queues that process newest rightmost elements.
//   - Same as BLPOP but pops from the right[7][10].
app.get("/brpop", async (req, res) => {
    const { key, timeout } = req.query;
    try {
        const val = await client.brPop(key as string, timeout ? parseInt(timeout as string) : 0);
        if (val === null) return res.status(404).send("Timeout expired, no elements");
        res.json(val);
    } catch (err) {
        res.status(500).send("BRPOP failed");
    }
});

// ==== ATOMIC POP-AND-PUSH ==== //

// RPOPLPUSH: Atomically pop TAIL of source and push to HEAD of destination.
//   - Use for reliable queue (e.g. move job to "processing" list before processing).
//   - Good for job transfer, circular rotating lists, or work stealing patterns[22][23][26].
app.post("/rpoplpush", async (req, res) => {
    const { source, destination } = req.body;
    try {
        const val = await client.rPopLPush(source, destination);
        if (val === null) return res.status(404).send("Source empty");
        res.json({ value: val });
    } catch (err) {
        res.status(500).send("RPOPLPUSH failed");
    }
});

// BRPOPLPUSH: Blocking version of RPOPLPUSH (deprecated in favor of BLMOVE in Redis 6.2+).
//   - Blocks until element available or timeout reached. Use for distributed consumers that "claim" work[24][27].
//   - Use for reliable distributed task queues.
app.post("/brpoplpush", async (req, res) => {
    const { source, destination, timeout } = req.body;
    try {
        const val = await client.bRPopLPush(source, destination, timeout ? parseInt(timeout) : 0);
        if (val === null) return res.status(404).send("Timeout or source empty");
        res.json({ value: val });
    } catch (err) {
        res.status(500).send("BRPOPLPUSH failed");
    }
});

// ==== START SERVER ==== //

async function startServer() {
    try {
        await client.connect();
        console.log("Connected to Redis");
        app.listen(3000, () => {
            console.log("Server running on port 3000");
        });
    } catch (error) {
        console.error("Failed to connect to Redis", error);
    }
}

startServer();
