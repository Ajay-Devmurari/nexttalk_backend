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
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
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
// SOCKET.IO REAL-TIME EVENTS (WITH MATCHING)
// ==========================================
io.on("connection", (socket) => {
  console.log("🟢 A user connected:", socket.id);

  // JOIN QUEUE & MATCHING BRAIN
  socket.on("joinQueue", async () => {
    try {
      console.log(`🔄 User ${socket.id} is looking for a match...`);

      // 1. User ko Queue me daal do
      await redis.lpush("nexttalk_queue", socket.id);

      // 2. Check karo kitne log queue me hain
      const queueLength = await redis.llen("nexttalk_queue");

      // 3. Agar 2 ya zyada log hain, toh MATCH kardo!
      if (queueLength >= 2) {
        const user1Id = await redis.rpop("nexttalk_queue");
        const user2Id = await redis.rpop("nexttalk_queue");

        if (user1Id && user2Id && user1Id !== user2Id) {
          const roomId = `room_${Date.now()}`;
          console.log(
            `✅ Match Found! 🎉 Room: ${roomId} | Users: ${user1Id} & ${user2Id}`,
          );

          io.to(user1Id).emit("match_found", { roomId: roomId });
          io.to(user2Id).emit("match_found", { roomId: roomId });
        } else {
          socket.emit("searching");
        }
      } else {
        // Agar sirf 1 user hai
        socket.emit("searching");
      }
    } catch (error) {
      console.error("Redis Matching Error:", error);
    }
  });

  // DISCONNECT LOGIC
  socket.on("disconnect", async () => {
    console.log("🔴 User disconnected:", socket.id);
    try {
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
