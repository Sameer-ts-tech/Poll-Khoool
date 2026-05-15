import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import pollRoutes from './routes/poll.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/polls', pollRoutes);

app.get('/', (req, res) => {
  res.send('Poll Khoool API is running');
});

const activePollVisitors = new Map();

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join_poll', (payload) => {
    let pollId = payload;
    let visitorId = socket.handshake.address;

    if (typeof payload === 'object') {
      pollId = payload.pollId;
      visitorId = payload.visitorId;
    }

    socket.visitorId = visitorId;
    socket.join(`poll_${pollId}_active`);
    
    if (!activePollVisitors.has(pollId)) {
      activePollVisitors.set(pollId, new Map());
    }
    const visitorsMap = activePollVisitors.get(pollId);
    if (!visitorsMap.has(visitorId)) {
      visitorsMap.set(visitorId, new Set());
    }
    visitorsMap.get(visitorId).add(socket.id);
    
    io.to(`poll_${pollId}_active`).emit('active_users_count', visitorsMap.size);
    console.log(`User ${socket.id} (visitor ${visitorId}) joined poll ${pollId}. Unique visitors: ${visitorsMap.size}`);
  });

  socket.on('leave_poll', (pollId) => {
    socket.leave(`poll_${pollId}_active`);
    
    const visitorId = socket.visitorId;
    if (activePollVisitors.has(pollId)) {
      const visitorsMap = activePollVisitors.get(pollId);
      if (visitorsMap.has(visitorId)) {
        const socketsSet = visitorsMap.get(visitorId);
        socketsSet.delete(socket.id);
        if (socketsSet.size === 0) {
          visitorsMap.delete(visitorId);
        }
      }
      io.to(`poll_${pollId}_active`).emit('active_users_count', visitorsMap.size);
      console.log(`User ${socket.id} left poll ${pollId}. Unique visitors: ${visitorsMap.size}`);
    }
  });

  socket.on('disconnecting', () => {
    socket.rooms.forEach(room => {
      if (room.startsWith('poll_') && room.endsWith('_active')) {
        const pollId = room.replace('poll_', '').replace('_active', '');
        const visitorId = socket.visitorId;
        
        if (activePollVisitors.has(pollId)) {
          const visitorsMap = activePollVisitors.get(pollId);
          if (visitorsMap.has(visitorId)) {
            const socketsSet = visitorsMap.get(visitorId);
            socketsSet.delete(socket.id);
            if (socketsSet.size === 0) {
              visitorsMap.delete(visitorId);
            }
          }
          io.to(room).emit('active_users_count', visitorsMap.size);
        }
      }
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

app.set('io', io);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
