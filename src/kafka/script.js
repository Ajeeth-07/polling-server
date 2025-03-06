const { Kafka } = require("kafkajs");

// Connect to Kafka
const kafka = new Kafka({
  clientId: "polling-app-admin",
  brokers: [process.env.KAFKA_BOOTSTRAP_SERVER || "localhost:9092"],
});

const admin = kafka.admin();

const setupTopics = async () => {
  try {
    await admin.connect();
    console.log("Admin connected, creating topics...");

    // Create topics
    await admin.createTopics({
      topics: [
        {
          topic: "poll-votes",
          numPartitions: 3, // Using partitions for handling concurrent votes
          replicationFactor: 1, // In production, use higher replication factor
        },
        {
          topic: "poll-results",
          numPartitions: 1,
          replicationFactor: 1,
        },
      ],
    });

    console.log("Topics created successfully!");
  } catch (error) {
    console.error("Error creating Kafka topics:", error);
  } finally {
    await admin.disconnect();
  }
};

module.exports = { setupTopics };
