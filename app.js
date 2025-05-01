const express = require('express')
const path = require('path')
const app = express()

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
    data.message = filterProfanity(data.message);
    socket.broadcast.emit('chat-message', data);
  });

  socket.on('feedback', (data) => {
    socket.broadcast.emit('feedback', data);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = server;
