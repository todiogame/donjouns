const colyseus = require("colyseus");
const express = require("express");
const http = require("http");
const path = require("path");
const MyRoom = require("./room");
const { monitor } = require("@colyseus/monitor");

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 2567;

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, "../dist")));

// Create the Colyseus game server
const gameServer = new colyseus.Server({
    server: server,
});

// Define the room
gameServer.define("my_room", MyRoom);

// Register colyseus monitor (monitoring panel)
app.use("/colyseus", monitor());

// Start the server
gameServer.listen(port);
console.log(`Listening on ws://localhost:${port}`);
