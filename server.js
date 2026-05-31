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

io.on("connection", (socket) => {
  console.log("🟢 A user connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
