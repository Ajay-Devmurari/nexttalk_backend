const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { Redis } = require("@upstash/redis"); // ✅ Redis import

const app = express();
app.use(cors());

const server = http.createServer(app);

// ✅ Socket.io Setup (CORS allowed for Flutter)
const io = new Server(server, {
  cors: {
    origin: "*", // Production me yahan sirf apna Flutter web URL denge
    methods: ["GET", "POST"],
  },
});

// ✅ Upstash Redis Setup (Render ke Environment Variables se connect hoga)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// ==========================================
// TEST ROUTES
// ==========================================

// Basic Server Test
app.get("/", (req, res) => {
  res.send("NextTalk Backend, Socket.io & Redis are Running 🚀");
});

// Redis Connection Test
// Redis Connection Test
app.get("/test-redis", async (req, res) => {
  try {
    await redis.set("test_key", "Hello from NextTalk!");
    const value = await redis.get("test_key");
    res.send(`Redis Test Successful! Value: ${value}`);
  } catch (error) {
    res.send(`Redis Error: ${error.message}`);
  }
});
l̥;

// ==========================================
// SOCKET.IO REAL-TIME EVENTS
// ==========================================

io.on("connection", (socket) => {
  console.log("🟢 A user connected:", socket.id);

  // Jab user disconnect ho
  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
  });
});

// ==========================================
// SERVER START
// ==========================================

// Render dynamically port deta hai, isliye process.env.PORT zaroori hai
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
