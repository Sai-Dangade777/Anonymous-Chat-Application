const socket = io()

const clientsTotal = document.getElementById('client-total')

const messageContainer = document.getElementById('message-container')
const nameInput = document.getElementById('name-input')
const messageForm = document.getElementById('message-form')
const messageInput = document.getElementById('message-input')
const fileInput = document.getElementById('file-input')

// Emit join event when username changes or on page load
function emitJoin() {
  socket.emit('join', nameInput.value || 'anonymous');
}
nameInput.addEventListener('change', emitJoin);
window.addEventListener('DOMContentLoaded', emitJoin);

const messageTone = new Audio('/message-tone.mp3')

messageForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = function(evt) {
      const data = {
        id: Date.now() + Math.random(),
        name: nameInput.value,
        message: '',
        file: {
          name: file.name,
          type: file.type,
          data: evt.target.result // base64 string
        },
        dateTime: new Date(),
      };
      socket.emit('message', data);
      addMessageToUI(true, data);
      fileInput.value = '';
    };
    reader.readAsDataURL(file); // This is important for images!
  } else {
    sendMessage();
  }
});

socket.on('clients-total', (data) => {
  clientsTotal.innerText = `Total Clients: ${data}`
})

function sendMessage() {
  if (messageInput.value === '') return
  // console.log(messageInput.value)
  const data = {
    name: nameInput.value,
    message: messageInput.value,
    dateTime: new Date(),
  }
  socket.emit('message', data)
  addMessageToUI(true, data)
  messageInput.value = ''
}

socket.on('chat-message', (data) => {
  // console.log(data)
  messageTone.play()
  addMessageToUI(false, data)
})

function addMessageToUI(isOwnMessage, data) {
  clearFeedback();
  let fileElement = document.createElement('div');
  if (data.file) {
    if (data.file.type && data.file.type.startsWith('image/')) {
      const img = document.createElement('img');
      if (data.file.data.startsWith('data:image/')) {
        img.src = data.file.data;
      } else {
        console.error('Invalid image data');
        return;
      }
      img.alt = data.file.name;
      img.style = "max-width:200px;max-height:200px;display:block;margin-top:8px;";
      fileElement.appendChild(img);
    } else {
      const link = document.createElement('a');
      if (data.file.data.startsWith('data:')) {
        link.href = data.file.data;
      } else {
        console.error('Invalid file data');
        return;
      }
      link.download = data.file.name;
      link.textContent = `Download ${data.file.name}`;
      link.style = "display:block;margin-top:8px;";
      fileElement.appendChild(link);
    }
  }
  const listItem = document.createElement('li');
  listItem.className = isOwnMessage ? 'message-right' : 'message-left';
  const messageParagraph = document.createElement('p');
  messageParagraph.className = 'message';
  const messageText = document.createTextNode(data.message);
  const messageMeta = document.createElement('span');
  messageMeta.textContent = `${data.name} ● ${moment(data.dateTime).fromNow()}`;
  messageParagraph.appendChild(messageText);
  messageParagraph.appendChild(fileElement);
  messageParagraph.appendChild(messageMeta);
  listItem.appendChild(messageParagraph);
  messageContainer.appendChild(listItem);
  scrollToBottom();
}

function scrollToBottom() {
  messageContainer.scrollTo(0, messageContainer.scrollHeight)
}

messageInput.addEventListener('focus', (e) => {
  socket.emit('feedback', {
    feedback: `✍️ ${nameInput.value} is typing a message`,
  })
})

messageInput.addEventListener('keypress', (e) => {
  socket.emit('feedback', {
    feedback: `✍️ ${nameInput.value} is typing a message`,
  })
})
messageInput.addEventListener('blur', (e) => {
  socket.emit('feedback', {
    feedback: '',
  })
})

socket.on('feedback', (data) => {
  clearFeedback();
  const listItem = document.createElement('li');
  listItem.classList.add('message-feedback');
  const feedbackParagraph = document.createElement('p');
  feedbackParagraph.classList.add('feedback');
  feedbackParagraph.id = 'feedback';
  feedbackParagraph.textContent = data.feedback; // Safely set text content
  listItem.appendChild(feedbackParagraph);
  messageContainer.appendChild(listItem);
})

function clearFeedback() {
  document.querySelectorAll('li.message-feedback').forEach((element) => {
    element.parentNode.removeChild(element)
  })
}

// Theme toggle logic
const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  if (document.body.classList.contains('dark-mode')) {
    themeToggle.textContent = '☀️ Light Mode';
  } else {
    themeToggle.textContent = '🌙 Dark Mode';
  }
});

const onlineUsersDiv = document.getElementById('online-users');

socket.on('online-users', (users) => {
  onlineUsersDiv.textContent = `Online: ${users.join(', ')}`;
});
