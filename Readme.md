# Polling Application

A high-concurrency real-time polling system built with Node.js, Kafka, WebSockets, and PostgreSQL.

## Features

- Create polls with multiple options
- Vote on polls with real-time updates
- Concurrent vote processing via Kafka partitioning
- Real-time updates via WebSockets
- Leaderboard of most popular polls

## Architecture

- **API Layer**: Express.js REST API
- **Message Broker**: Kafka for handling concurrent votes
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma
- **Real-time Updates**: WebSockets
- **Containerization**: Docker & Docker Compose

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Supabase account (or use local PostgreSQL)

## Setup & Installation

### Option 1: Using Docker (Recommended)

1. Clone the repository:
   ```bash
   git clone https://github.com/Ajeeth-07/polling-server.git
   cd polling-app
   ```

2. Configure your database:
   - For Supabase: Update .env with your Supabase connection string
   - For local PostgreSQL: Update docker-compose.yaml to use the local PostgreSQL container

3. Start the application:
   ```bash
   docker-compose -f docker/docker-compose.yaml up --build
   ```

### Option 2: Manual Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure your database in .env:
   ```
   DATABASE_URL="your-database-connection-string"
   ```

3. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

4. Run database migrations:
   ```bash
   npx prisma migrate deploy
   ```

5. Start the application:
   ```bash
   npm start
   ```

## Testing the Application

### 1. Creating a Poll

**Using curl:**
```bash
curl -X POST http://localhost:3000/polls \
  -H "Content-Type: application/json" \
  -d '{"title":"Favorite Programming Language", "options":["JavaScript", "Python", "Java", "Go", "Rust"]}'
```

**Using Postman:**
- Method: POST
- URL: http://localhost:3000/polls
- Headers: Content-Type: application/json
- Body (raw, JSON):
  ```json
  {
    "title": "Favorite Programming Language",
    "options": ["JavaScript", "Python", "Java", "Go", "Rust"]
  }
  ```

### 2. Voting on a Poll

**Using curl:**
```bash
# Replace POLL_ID with the ID returned from creating a poll
curl -X POST http://localhost:3000/polls/POLL_ID/vote \
  -H "Content-Type: application/json" \
  -d '{"optionId":"option-2"}'
```

**Using Postman:**
- Method: POST
- URL: http://localhost:3000/polls/POLL_ID/vote
- Headers: Content-Type: application/json
- Body (raw, JSON):
  ```json
  {
    "optionId": "option-2"
  }
  ```

### 3. Getting Poll Results

**Using curl:**
```bash
curl http://localhost:3000/polls/POLL_ID
```

**Using Postman:**
- Method: GET
- URL: http://localhost:3000/polls/POLL_ID

### 4. Getting the Leaderboard

**Using curl:**
```bash
curl http://localhost:3000/leaderboard
```

**Using Postman:**
- Method: GET
- URL: http://localhost:3000/leaderboard

### 5. Testing WebSocket Real-time Updates

#### Option 1: Using Browser Console

Open your browser console and run:

```javascript
// Connect to poll updates (replace POLL_ID)
const pollSocket = new WebSocket(`ws://localhost:3000?pollId=POLL_ID`);
pollSocket.onmessage = (event) => {
  console.log('Poll update:', JSON.parse(event.data));
};

// Connect to leaderboard updates
const leaderboardSocket = new WebSocket(`ws://localhost:3000`);
leaderboardSocket.onmessage = (event) => {
  console.log('Leaderboard update:', JSON.parse(event.data));
};
```

#### Option 2: Using wscat

Install wscat:
```bash
npm install -g wscat
```

Connect to poll updates:
```bash
wscat -c "ws://localhost:3000?pollId=POLL_ID"
```

Connect to leaderboard updates:
```bash
wscat -c "ws://localhost:3000"
```

### 6. Testing Concurrency

To test how the system handles concurrent votes via Kafka partitioning:

1. Create a new poll and note its ID
2. Open multiple WebSocket connections to observe real-time updates

## API Reference

### Polls API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/polls` | GET | Get all polls |
| `/polls` | POST | Create a new poll |
| `/polls/:id` | GET | Get a specific poll by ID |
| `/polls/:id/vote` | POST | Vote on a specific poll |

### Leaderboard API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/leaderboard` | GET | Get leaderboard of top polls |

## WebSocket Endpoints

| Endpoint | Description |
|----------|-------------|
| `ws://localhost:3000?pollId=POLL_ID` | Real-time updates for a specific poll |
| `ws://localhost:3000` | Real-time updates for the leaderboard |

## Troubleshooting

### "The table `public.Poll` does not exist in the current database"
The database migrations haven't been applied correctly. Run:
```bash
npx prisma migrate deploy
```

### "Connection refused" errors with Kafka
Ensure Kafka and Zookeeper containers are running. Sometimes Kafka needs more time to fully start up.

### Database Connection Issues
- Check that your Supabase connection string is correct in .env
- Make sure SSL connection is properly configured for Supabase

## Architecture Highlights

- **Kafka Partitioning**: Using 3 partitions for the `poll-votes` topic allows for concurrent vote processing
- **WebSocket Broadcasting**: Real-time updates are pushed to clients based on what they're subscribed to
- **Prisma ORM**: Provides type-safe database access and handles migrations
- **Dockerized Setup**: All components run in containers for easy deployment