const express = require("express");
const http = require("http");
const cors = require("cors");

// Express app banaya
const app = express();
app.use(cors()); // CORS enable kiya taki Flutter se request aaye

// HTTP server banaya (Socket.io ko iske upar chalana padta hai)
const server = http.createServer(app);

// Simple Test Route
app.get("/", (req, res) => {
  res.send("NextTalk Backend is Running 🚀");
});

// Server ko port 3000 par start kiya
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
