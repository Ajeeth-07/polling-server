const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const { Kafka } = require("kafkajs");

// Create Express app
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(express.json());

// Set up Kafka connection
const kafka = new Kafka({
  clientId: "polling-app",
  brokers: [process.env.KAFKA_BOOTSTRAP_SERVER || "localhost:9092"],
});

// Basic health check route
app.get("/", (req, res) => {
  res.json({ status: "Polling API is running" });
});

// Routes placeholder - we'll implement these next
app.post("/polls", (req, res) => {
  res.status(501).json({ error: "Not implemented yet" });
});

app.post("/polls/:id/vote", (req, res) => {
  res.status(501).json({ error: "Not implemented yet" });
});

app.get("/polls/:id", (req, res) => {
  res.status(501).json({ error: "Not implemented yet" });
});

app.get("/leaderboard", (req, res) => {
  res.status(501).json({ error: "Not implemented yet" });
});

// WebSocket connection handler
wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (message) => {
    console.log("Received message:", message);
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

// Kafka topic setup
async function setupKafkaTopics() {
  try {
    const admin = kafka.admin();
    await admin.connect();

    await admin.createTopics({
      topics: [
        {
          topic: "poll-votes",
          numPartitions: 3, // Multiple partitions for concurrent voting
          replicationFactor: 1,
        },
        {
          topic: "poll-results",
          numPartitions: 1,
          replicationFactor: 1,
        },
      ],
    });

    console.log("Kafka topics created successfully");
    await admin.disconnect();
  } catch (error) {
    console.error("Error setting up Kafka topics:", error);
  }
}

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  // Setup Kafka topics after server starts
  try {
    await setupKafkaTopics();
  } catch (error) {
    console.error("Failed to setup Kafka topics:", error);
  }
});
