const express = require("express");
const http = require("http");
const { Server } = require("socket.io"); // ✅ Socket.io import kiya
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

// ✅ Socket.io setup kiya aur CORS allow kiya globally
const io = new Server(server, {
  cors: {
    origin: "*", // Abhi ke liye sabko allow (Flutter web/mobile dono ke liye)
    methods: ["GET", "POST"],
  },
});

// Simple Test Route (Render par check karne ke liye)
app.get("/", (req, res) => {
  res.send("NextTalk Backend & Socket.io is Running 🚀");
});

// ✅ Socket.io Connection Listener
io.on("connection", (socket) => {
  console.log("🟢 A user connected:", socket.id);

  // Jab user disconnect ho
  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
  });
});

// Render dynamically port deta hai, isliye process.env.PORT zaroori hai
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
