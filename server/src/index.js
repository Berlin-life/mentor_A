const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Determine environment
const isProd = process.env.NODE_ENV === 'production';
const clientURL = process.env.CLIENT_URL || 'http://localhost:5173';

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    // Allow any localhost port in development
    if (!isProd && origin.startsWith('http://localhost')) return callback(null, true);
    // In production, allow configured CLIENT_URL
    if (isProd && origin === clientURL) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
};

const io = new Server(server, {
  cors: {
    origin: isProd ? clientURL : /^http:\/\/localhost:\d+$/,
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors(corsOptions));
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => { console.error('MongoDB connection error:', err.message); process.exit(1); });

// API Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/requests', require('./routes/request.routes'));
app.use('/api/sessions', require('./routes/session.routes'));
app.use('/api/posts', require('./routes/post.routes'));
app.use('/api/messages', require('./routes/message.routes'));

// Serve React frontend in production
if (isProd) {
  const clientBuildPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('MentorMatch API is running...');
  });
}

// Socket.io Logic
const Message = require('./models/Message');

io.on('connection', (socket) => {
  socket.on('join_room', (userId) => {
    socket.userId = userId;
    socket.join(userId);
    io.emit('user_status', { userId, online: true });
  });

  socket.on('typing', ({ to }) => {
    if (socket.userId) io.to(to).emit('typing', { from: socket.userId });
  });

  socket.on('stop_typing', ({ to }) => {
    if (socket.userId) io.to(to).emit('stop_typing', { from: socket.userId });
  });

  socket.on('send_message', async (data) => {
    const { sender, receiver, content, type, fileData, fileName, fileMime, replyTo } = data;
    try {
      const newMessage = new Message({
        sender, receiver,
        content: content || '',
        type: type || 'text',
        fileData: fileData || '',
        fileName: fileName || '',
        fileMime: fileMime || '',
        replyTo: replyTo || null
      });
      await newMessage.save();
      await newMessage.populate('replyTo', 'content type sender fileName');
      io.to(receiver).emit('receive_message', newMessage);
      io.to(sender).emit('receive_message', newMessage);
    } catch (err) {
      console.error('Error saving message:', err);
    }
  });

  socket.on('message_deleted', ({ messageId, receiverId }) => {
    io.to(receiverId).emit('message_deleted', { messageId });
  });

  socket.on('message_reaction', ({ messageId, reactions, receiverId }) => {
    io.to(receiverId).emit('message_reaction', { messageId, reactions });
  });

  socket.on('disconnect', () => {
    if (socket.userId) io.emit('user_status', { userId: socket.userId, online: false });
  });
});


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
