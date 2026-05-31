require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { Redis } = require("@upstash/redis");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

app.get("/", (req, res) => {
  res.send("NextTalk Backend, Socket.io & Redis are Running 🚀");
});

app.get("/test-redis", async (req, res) => {
  try {
    await redis.set("test_key", "Hello from NextTalk!");
    const value = await redis.get("test_key");
    res.send(`Redis Test Successful! Value: ${value}`);
  } catch (error) {
    res.send(`Redis Error: ${error.message}`);
  }
});

// ==========================================
// SOCKET.IO REAL-TIME EVENTS
// ==========================================
io.on("connection", (socket) => {
  console.log("🟢 A user connected:", socket.id);

  // ==========================================
  // TASK 4: JOIN QUEUE (Searching Logic)
  // ==========================================
  socket.on("joinQueue", async () => {
    try {
      console.log(`🔄 User ${socket.id} is looking for a match...`);

      // 1. User ko Redis List (Queue) me daal do
      await redis.lpush("nexttalk_queue", socket.id);

      // 2. User ko Flutter app me batao ki "Searching" chalu kardo
      socket.emit("searching");

      // NOTE: Agar queue me 2 log ho jaye, toh match karna (Task 5) yahi par hoga!
    } catch (error) {
      console.error("Redis Queue Error:", error);
    }
  });

  // ==========================================
  // DISCONNECT LOGIC (Cleanup)
  // ==========================================
  socket.on("disconnect", async () => {
    console.log("🔴 User disconnected:", socket.id);

    try {
      // Agar user chat chhod ke chala jaye, toh use Redis queue se bhi hata do
      await redis.lrem("nexttalk_queue", 0, socket.id);
    } catch (error) {
      console.error("Redis Remove Error:", error);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
