const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const { Kafka } = require("kafkajs");
const prisma = require("./src/db/client");
const WebSocketManager = require("./src/websocket/wsManager");
const pollController = require("./src/api/pollController");
const leaderboardController = require("./src/api/leaderboardController");
const voteConsumer = require("./src/kafka/consumers/voteConsumer");

// Create Express app
const app = express();
const server = http.createServer(app);

// Initialize WebSocket manager
WebSocketManager.init(server);

// Middleware
app.use(express.json());

// Routes
app.use("/polls", pollController);
app.use("/leaderboard", leaderboardController);

// Basic health check route
app.get("/", (req, res) => {
  res.json({ status: "Polling API is running" });
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

  // Test database connection
  try {
    // Test Prisma connection by running a simple query
    await prisma.$queryRaw`SELECT 1`;
    console.log("Database connection successful");

    // Setup Kafka topics after server starts
    await setupKafkaTopics();

    // Start vote consumer
    await voteConsumer.startConsuming();
  } catch (error) {
    console.error("Error during startup:", error);
  }
});

// Handle graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
  });

  // Disconnect from Kafka
  try {
    await voteConsumer.disconnect();
    console.log("Kafka consumer disconnected");

    // Close Prisma connection
    await prisma.$disconnect();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Error during shutdown:", error);
  }
});
