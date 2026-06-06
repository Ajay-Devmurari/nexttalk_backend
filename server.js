// require("dotenv").config();

// const express = require("express");
// const http = require("http");
// const { Server } = require("socket.io");
// const cors = require("cors");
// const { Redis } = require("@upstash/redis");

// const app = express();
// app.use(cors());

// const server = http.createServer(app);

// const io = new Server(server, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST"],
//   },
// });

// const redis = new Redis({
//   url: process.env.UPSTASH_REDIS_REST_URL || "",
//   token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
// });

// app.get("/", (req, res) => {
//   res.send("NextTalk Backend, Socket.io & Redis are Running 🚀");
// });

// app.get("/test-redis", async (req, res) => {
//   try {
//     await redis.set("test_key", "Hello from NextTalk!");
//     const value = await redis.get("test_key");
//     res.send(`Redis Test Successful! Value: ${value}`);
//   } catch (error) {
//     res.send(`Redis Error: ${error.message}`);
//   }
// });

// // ==========================================
// // SOCKET.IO REAL-TIME EVENTS
// // ==========================================
// io.on("connection", (socket) => {
//   console.log("🟢 A user connected:", socket.id);

//   // ✅ NAYA: User apna naam aur UID bhejega connection ke baad
//   socket.on("authenticate", (data) => {
//     socket.uid = data.uid;
//     socket.displayName = data.displayName;
//     console.log(`👤 User Authenticated: ${socket.displayName} (${socket.uid})`);
//   });

//   // ==========================================
//   // JOIN QUEUE & MATCHING BRAIN (Updated)
//   // ==========================================
//   socket.on("joinQueue", async () => {
//     try {
//       console.log(
//         `🔄 User ${socket.displayName || socket.id} is looking for a match...`,
//       );

//       // 1. User ko Queue me daal do
//       await redis.lpush("nexttalk_queue", socket.id);

//       // 2. Check karo kitne log queue me hain
//       const queueLength = await redis.llen("nexttalk_queue");

//       // 3. Agar 2 ya zyada log hain, toh MATCH kardo!
//       if (queueLength >= 2) {
//         const user1Id = await redis.rpop("nexttalk_queue");
//         const user2Id = await redis.rpop("nexttalk_queue");

//         if (user1Id && user2Id && user1Id !== user2Id) {
//           const roomId = `room_${Date.now()}`;

//           // ✅ NAYA: Dono users ka data nikalo
//           const user1Socket = io.sockets.sockets.get(user1Id);
//           const user2Socket = io.sockets.sockets.get(user2Id);

//           console.log(
//             `✅ Match Found! 🎉 Room: ${roomId} | Users: ${user1Socket?.displayName} & ${user2Socket?.displayName}`,
//           );

//           // ✅ NAYA: Match found event me Stranger ka Naam aur UID bhejo
//           io.to(user1Id).emit("match_found", {
//             roomId: roomId,
//             strangerName: user2Socket?.displayName || "Stranger",
//             strangerUid: user2Socket?.uid || "",
//           });

//           io.to(user2Id).emit("match_found", {
//             roomId: roomId,
//             strangerName: user1Socket?.displayName || "Stranger",
//             strangerUid: user1Socket?.uid || "",
//           });
//         } else {
//           socket.emit("searching");
//         }
//       } else {
//         // Agar sirf 1 user hai
//         socket.emit("searching");
//       }
//     } catch (error) {
//       console.error("Redis Matching Error:", error);
//     }
//   });

//   // ==========================================
//   // REAL-TIME TEXT CHAT LOGIC
//   // ==========================================

//   // ✅ Jab user chat room me enter kare
//   socket.on("joinRoom", (roomId) => {
//     socket.join(roomId);
//     console.log(
//       `👥 User ${socket.displayName || socket.id} joined room: ${roomId}`,
//     );
//   });

//   // ✅ Jab user message bheje
//   socket.on("sendMessage", (data) => {
//     // data me roomId aur text aayega
//     // socket.to(roomId) se message us room ke SABKO bhejega (BHEJNE WALE KO CHHOD KE)
//     socket.to(data["roomId"]).emit("receiveMessage", data["text"]);
//   });

//   // ==========================================
//   // DISCONNECT LOGIC
//   // ==========================================
//   socket.on("disconnect", async () => {
//     console.log("🔴 User disconnected:", socket.id);
//     try {
//       await redis.lrem("nexttalk_queue", 0, socket.id);
//     } catch (error) {
//       console.error("Redis Remove Error:", error);
//     }
//   });
// });

// // Tumhare server.js me existing socket.io code ke andar ye add karo

// socket.on("skip_stranger", (data) => {
//   const { roomId } = data;

//   if (roomId) {
//     // ✅ Broadcast to the OTHER user in the room that they have been skipped
//     socket.to(roomId).emit("stranger_skipped");

//     // Optional: Undon ko room se bhi nikal do
//     // socket.leave(roomId);
//   }
// });

// const PORT = process.env.PORT || 3000;
// server.listen(PORT, () => {
//   console.log(`🚀 Server is running on port ${PORT}`);
// });

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

// ==========================================
// API ROUTES
// ==========================================

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
// SOCKET.IO EVENTS
// ==========================================

io.on("connection", (socket) => {
  console.log("🟢 User Connected:", socket.id);

  // ==========================================
  // AUTHENTICATION
  // ==========================================

  socket.on("authenticate", (data) => {
    socket.uid = data.uid;
    socket.displayName = data.displayName;

    console.log(`👤 Authenticated: ${socket.displayName} (${socket.uid})`);
  });

  // ==========================================
  // JOIN QUEUE & MATCHING
  // ==========================================

  socket.on("joinQueue", async () => {
    try {
      console.log(`🔍 Searching Match For: ${socket.displayName || socket.id}`);

      await redis.lpush("nexttalk_queue", socket.id);

      const queueLength = await redis.llen("nexttalk_queue");

      if (queueLength >= 2) {
        const user1Id = await redis.rpop("nexttalk_queue");
        const user2Id = await redis.rpop("nexttalk_queue");

        if (user1Id && user2Id && user1Id !== user2Id) {
          const roomId = `room_${Date.now()}`;

          const user1Socket = io.sockets.sockets.get(user1Id);

          const user2Socket = io.sockets.sockets.get(user2Id);

          if (!user1Socket || !user2Socket) {
            return;
          }

          // Join both users to room
          user1Socket.join(roomId);
          user2Socket.join(roomId);

          console.log(
            `✅ Match Found | Room: ${roomId} | ${user1Socket.displayName} ↔ ${user2Socket.displayName}`,
          );

          io.to(user1Id).emit("match_found", {
            roomId,
            strangerName: user2Socket.displayName || "Stranger",
            strangerUid: user2Socket.uid || "",
          });

          io.to(user2Id).emit("match_found", {
            roomId,
            strangerName: user1Socket.displayName || "Stranger",
            strangerUid: user1Socket.uid || "",
          });
        }
      } else {
        socket.emit("searching");
      }
    } catch (error) {
      console.error("❌ Matching Error:", error.message);
    }
  });

  // ==========================================
  // ROOM JOIN
  // ==========================================

  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);

    console.log(`👥 ${socket.displayName || socket.id} joined ${roomId}`);
  });

  // ==========================================
  // CHAT MESSAGE
  // ==========================================

  socket.on("sendMessage", (data) => {
    socket.to(data.roomId).emit("receiveMessage", data.text);
  });

  // ==========================================
  // SKIP STRANGER
  // ==========================================

  socket.on("skip_stranger", ({ roomId }) => {
    console.log(`⏭️ ${socket.displayName || socket.id} skipped stranger`);

    if (roomId) {
      // Notify stranger
      socket.to(roomId).emit("stranger_skipped");

      // Leave room
      socket.leave(roomId);
    }
  });

  // ==========================================
  // DISCONNECT
  // ==========================================

  socket.on("disconnect", async () => {
    console.log("🔴 User Disconnected:", socket.id);

    try {
      await redis.lrem("nexttalk_queue", 0, socket.id);
    } catch (error) {
      console.error("Redis Remove Error:", error.message);
    }
  });
});

// Tumhare existing socket.io connection code ke andar ye add karo

socket.on("typing", (data) => {
  const { roomId } = data;
  if (roomId) {
    // ✅ Sirf room me dusre user ko bhejo (Broadcast to others in room)
    socket.to(roomId).emit("stranger_typing");
  }
});

// ==========================================
// START SERVER
// ==========================================

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Server Running On Port ${PORT}`);
});
