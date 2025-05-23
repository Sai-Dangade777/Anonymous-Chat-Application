const express = require('express')
const path = require('path')
const app = express()

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

const http = require('http');
const server = http.createServer(app);

const io = require('socket.io')(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  transports: ['polling'], // Force long-polling for Vercel
  allowEIO3: true // Allow older clients
});

const Filter = require('bad-words');
const customFilter = new Filter();
customFilter.replaceWord = function() {
  return '****';
};
console.log(customFilter.clean('You are a bitch')); // Should output: You are a ****
console.log(customFilter.clean('You are a chutiya')); // Should output: You are a *******
console.log(customFilter.clean('You are a bhosdi')); // Should output: You are a ******

// Optionally add custom Hindi/other words
customFilter.addWords(
  'chutiya', 'bhosdi', 'bhosdike', 'madarchod', 'behenchod', 'benchod', 'gaand', 'loda', 'lund', 'randi', 'gandu', 'chodu', 'saala', 'harami', 'kutte', 'kamina', 'chutiye', 'bhenchod', 'mc', 'bc'
);

app.use(express.static(path.join(__dirname, 'public')))

let socketsConected = new Set()
let onlineUsers = {}; // username: socket.id

function filterProfanity(message) {
  return customFilter.clean(message);
}

io.on('connection', (socket) => {
  console.log('Socket connected', socket.id);

  socket.on('join', (username) => {
    onlineUsers[username] = socket.id;
    io.emit('online-users', Object.keys(onlineUsers));
  });

  socket.on('disconnect', () => {
    // Remove user by socket id
    for (const [name, id] of Object.entries(onlineUsers)) {
      if (id === socket.id) {
        delete onlineUsers[name];
        break;
      }
    }
    io.emit('online-users', Object.keys(onlineUsers));
    socketsConected.delete(socket.id);
    io.emit('clients-total', socketsConected.size);
  });

  socket.on('message', (data) => {
    if (data.message && data.message.trim() !== '') {
      data.message = filterProfanity(data.message);
    }
    if (data.file && data.file.data) {
      const base64Pattern = /^data:(image\/[a-zA-Z]+);base64,[a-zA-Z0-9+/=]+$/;
      if (!base64Pattern.test(data.file.data)) {
        console.error('Invalid file data received');
        return;
      }
    }
    socket.broadcast.emit('chat-message', data);
  });

  socket.on('feedback', (data) => {
    socket.broadcast.emit('feedback', data);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = server;
