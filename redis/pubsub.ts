import { createClient, RedisClientType } from "redis";

// Create two clients: one for general ops, one dedicated for Pub/Sub
const client: RedisClientType = createClient();
const pubsubClient: RedisClientType = createClient(); // Redis requires separate clients for pub/sub

interface Submission {
    problemId: string;
    code: string;
    language: string;
}

// Processing logic
async function processSubmission(submission: string) {
    const { problemId, code, language } = JSON.parse(submission) as Submission;
    console.log(`Processing submission for problemId ${problemId}...`);
    console.log(`Code: ${code}`);
    console.log(`Language: ${language}`);
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Finished processing submission for problemId ${problemId}.`);
    // Notify completion via pub/sub
    await client.publish("problem_done", JSON.stringify({ problemId, status: "TLE" }));
}

// Pub/Sub operations – subscribe, unsubscribe, and message events
async function setupPubSub() {
    await pubsubClient.connect();

    // 1. SUBSCRIBE: Listen for messages on a channel
    await pubsubClient.subscribe("problem_done", (message, channel) => {
        console.log(`(SUBSCRIBED) Message from ${channel}: ${message}`);
        // Handle the completed problem notifications here
    });

    // 2. Subscribe to another channel (multiple subscriptions)
    await pubsubClient.subscribe("problem_error", (message, channel) => {
        console.log(`(SUBSCRIBED) Error from ${channel}: ${message}`);
    });

    // 3. UNSUBSCRIBE after some time (example):
    setTimeout(async () => {
        console.log("Unsubscribing from \'problem_error\'...");
        await pubsubClient.unsubscribe("problem_error");
    }, 10000); // Unsubscribe after 10s, just an example

    // 4. PUBLISH (demo): Send a test notification (you can do this anywhere)
    setTimeout(async () => {
        await client.publish("problem_done", JSON.stringify({ problemId: "demo123", status: "Accepted" }));
    }, 2000);

    // 5. Pattern subscribe (listen to multiple channels matching a pattern)
    // E.g., channels: task:done, task:error, etc.
    await pubsubClient.pSubscribe("task:*", (message, channel) => {
        console.log(`[PSUBSCRIBED] Pattern matched ${channel}: ${message}`);
    });
}

async function startWorker() {
    try {
        await client.connect();
        console.log("Worker connected to Redis.");

        setupPubSub(); // Set up Pub/Sub listeners

        // Main processing loop
        while (true) {
            try {
                // BLOCKING pop from queue, waiting for new submissions
                const response = await client.brPop("problems", 0) as { key: string, element: string } | null;
                if (response) {
                    await processSubmission(response.element);
                }
            } catch (error) {
                console.error("Error processing submission:", error);
                // Error handling (e.g., push back to queue or log error)
            }
        }
    } catch (error) {
        console.error("Failed to connect to Redis", error);
    }
}

startWorker();
