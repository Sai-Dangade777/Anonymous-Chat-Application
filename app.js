const express = require('express')
const path = require('path')
const app = express()
const PORT = process.env.PORT || 4000
const server = app.listen(PORT, () => console.log(`💬 server on port ${PORT}`))

const io = require('socket.io')(server)

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

function filterProfanity(message) {
  return customFilter.clean(message);
}

io.on('connection', onConnected)

function onConnected(socket) {
  console.log('Socket connected', socket.id)
  socketsConected.add(socket.id)
  io.emit('clients-total', socketsConected.size)

  socket.on('disconnect', () => {
    console.log('Socket disconnected', socket.id)
    socketsConected.delete(socket.id)
    io.emit('clients-total', socketsConected.size)
  })

  socket.on('message', (data) => {
    // Filter profanity before broadcasting
    data.message = filterProfanity(data.message);
    socket.broadcast.emit('chat-message', data)
  })

  socket.on('feedback', (data) => {
    socket.broadcast.emit('feedback', data)
  })
}
