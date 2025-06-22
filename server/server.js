// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

let players = {};

io.on("connection", (socket) => {
    console.log("Player connected:", socket.id);

    socket.on("newPlayer", (data) => {
        const playerData = {
            x: data.x || 0,
            y: data.y || 0.4,
            z: data.z || 0,
            angle: data.angle || 0,
            name: data.name || "Anonymous"
        };

        players[socket.id] = playerData;

        // Send all existing players to the new player
        socket.emit("initPlayers", players);

        // Broadcast the new player to all other clients
        socket.broadcast.emit("newPlayer", {
            id: socket.id,
            ...playerData
        });

        console.log(`New player joined: ${playerData.name} (${socket.id})`);
    });

    socket.on("updatePlayer", (data) => {
        if (players[socket.id]) {
            players[socket.id] = {
                ...players[socket.id], // retain name
                x: data.x,
                y: data.y,
                z: data.z,
                angle: data.angle
            };
            socket.broadcast.emit("updatePlayer", { id: socket.id, ...players[socket.id] });
        }
    });

    socket.on("disconnect", () => {
        console.log("Player disconnected:", socket.id);
        delete players[socket.id];
        socket.broadcast.emit("removePlayer", socket.id);
    });
});

server.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
