// server.js
import express from 'express';
import { Server } from 'socket.io';
import http from 'http';
import cors from 'cors';

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});
const roomMessages = {};
const roomUserCounts = {};
io.on('connection', socket => {
    console.log('New client connected');

    socket.on('join-room', (groupId) => {
        socket.join(groupId);

        // Track user count
        roomUserCounts[groupId] = (roomUserCounts[groupId] || 0) + 1;

        // Send history if available
        if (roomMessages[groupId]) {
            socket.emit('room-history', roomMessages[groupId]);
        }

        console.log(`User joined room: ${groupId}`);
    });

    socket.on('send-message', ({ groupId, alias, message, time }) => {
        const msg = { groupId, alias, message, time };

        if (!roomMessages[groupId]) roomMessages[groupId] = [];
        roomMessages[groupId].push(msg);

        io.to(groupId).emit('receive-message', msg);
    });

    socket.on('disconnecting', () => {
        const rooms = Array.from(socket.rooms).filter(r => r !== socket.id);

        for (const roomId of rooms) {
            roomUserCounts[roomId] = (roomUserCounts[roomId] || 1) - 1;

            if (roomUserCounts[roomId] <= 0) {
                delete roomMessages[roomId];
                delete roomUserCounts[roomId];
                console.log(`Cleared messages for room: ${roomId}`);
            }
        }
    });
});

const PORT = 5000;
server.listen(PORT, () => {
    console.log(`Darkroom Server running on http://localhost:${PORT}`);
}); 