# Redis Queue (List-based)

await client.lPush("queue", "task1")      # Push task to head (left)
await client.rPush("queue", "task2")      # Push task to tail (right)
await client.lPop("queue")                # Pop from head (FIFO)
await client.rPop("queue")                # Pop from tail (LIFO)
await client.blPop("queue", 0)            # Blocking pop from head (waits if empty)

# Redis Pub/Sub

await pubsubClient.subscribe("channel", (msg) => { ... })  # Subscribe to a channel
await client.publish("channel", "message")                 # Publish message to channel
await pubsubClient.pSubscribe("prefix:*", (msg, ch) => { ... })  # Pattern subscribe
