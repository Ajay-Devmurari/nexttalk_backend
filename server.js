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
  // TASK 5: JOIN QUEUE & MATCHING BRAIN
  // ==========================================
  socket.on("joinQueue", async () => {
    try {
      console.log(`🔄 User ${socket.id} is looking for a match...`);

      // 1. Pehle current user ko Queue me daal do
      await redis.lpush("nexttalk_queue", socket.id);

      // 2. Check karo kitne log queue me hain
      const queueLength = await redis.llen("nexttalk_queue");

      // 3. Agar 2 ya 2 se zyada log hain, toh MATCH kardo!
      if (queueLength >= 2) {
        // Queue se 2 users ko bahar nikalo (Jo pehle se wait kar rahe the unko priority do)
        const user1Id = await redis.rpop("nexttalk_queue");
        const user2Id = await redis.rpop("nexttalk_queue");

        // Safety Check: Agar dono same user nahi hain (rare case)
        if (user1Id && user2Id && user1Id !== user2Id) {
          // 4. Ek unique Room ID generate karo
          const roomId = `room_${Date.now()}`;

          console.log(
            `✅ Match Found! 🎉 Room: ${roomId} | Users: ${user1Id} & ${user2Id}`,
          );

          // 5. Dono users ko "match_found" event bhejo unke private rooms me
          io.to(user1Id).emit("match_found", { roomId: roomId });
          io.to(user2Id).emit("match_found", { roomId: roomId });
        } else {
          // Agar koi error ho, toh user ko wapas searching status par daal do
          socket.emit("searching");
        }
      } else {
        // Agar sirf 1 user hai (wo khud hai), toh usko bolo "Ruko, searching chalu hai"
        socket.emit("searching");
      }
    } catch (error) {
      console.error("Redis Matching Error:", error);
    }
  });

  // ==========================================
  // DISCONNECT LOGIC (Cleanup)
  // ==========================================
  socket.on("disconnect", async () => {
    console.log("🔴 User disconnected:", socket.id);

    try {
      // Agar user band kar de, toh use queue se hata do taki kisi aur ko match na ho jaye
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
