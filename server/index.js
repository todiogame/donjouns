const colyseus = require("colyseus");
const express = require("express");
const http = require("http");
const path = require("path");
const MyRoom = require("./rooms/room");
const { monitor } = require("@colyseus/monitor");
const { loadData } = require('./dataReader');

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 2567;

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, "../dist")));

// Create the Colyseus game server
const gameServer = new colyseus.Server({
    server: server,
});

// Load game data and start server
async function startServer() {
    const { dungeon, items } = await loadData();
    // Define the room with the loaded cards
    gameServer.define("my_room", MyRoom, { dungeon: dungeon, itemsCards: items });

    // Register colyseus monitor (monitoring panel)
    app.use("/colyseus", monitor());

    // Start the server
    gameServer.listen(port);
    console.log(`Listening on ws://localhost:${port}`);
}

startServer()