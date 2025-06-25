const chatBox = document.getElementById('chat-box');
const inputField = document.getElementById('user-input');
const typingIndicator = document.getElementById('typing-indicator');
const GEMINI_API_KEY = "AIzaSyDNkXTP69Ik0fhw4UrhARu-sPgeTNhdYso";  // Replace with your actual Gemini API key

// ➤ Send message
function sendMessage() {
  const userMessage = inputField.value.trim();
  if (!userMessage) return;

  addMessage(userMessage, 'user');
  inputField.value = '';
  showTyping(true);

  getGeminiResponse(userMessage).then(botReply => {
    showTyping(false);
    addMessage(botReply, 'bot');
  });
}

// ➤ Add message
function addMessage(message, sender) {
  const msg = document.createElement('div');
  msg.className = `message ${sender}`;
  msg.innerText = message;

  if (sender === 'bot') {
    const actions = document.createElement('div');
    actions.className = 'message-actions';

    const speakBtn = document.createElement('button');
    speakBtn.textContent = '🔊';
    speakBtn.onclick = () => speak(message);
    actions.appendChild(speakBtn);

    const copyBtn = document.createElement('button');
    copyBtn.textContent = '📋';
    copyBtn.onclick = () => copyText(message);
    actions.appendChild(copyBtn);

    msg.appendChild(actions);
  }

  chatBox.insertBefore(msg, typingIndicator);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// ➤ Typing Indicator
function showTyping(show) {
  typingIndicator.style.display = show ? 'block' : 'none';
  chatBox.scrollTop = chatBox.scrollHeight;
}

// ➤ Voice Speak
function speak(text) {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    speechSynthesis.speak(utterance);
  }
}

// ➤ Copy Text
function copyText(text) {
  navigator.clipboard.writeText(text)
    .then(() => alert('✅ Copied!'))
    .catch(() => alert('❌ Copy failed!'));
}

// ➤ Gemini API Call
async function getGeminiResponse(userText) {
  const prompt = `
You are Nebula, an AI assistant created by Vinayak Dhiman.
When asked your name, say "My name is Nebula".
When asked who created you, say "I was created by Vinayak Dhiman".
For all other queries, reply helpfully.

User: ${userText}
`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    const data = await res.json();
    console.log(data);

    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    } else {
      return "⚠️ Gemini API didn't return a valid response.";
    }
  } catch (err) {
    console.error("API Error:", err);
    return "❌ Error connecting to Gemini API.";
  }
}

// ➤ Voice Input (Speech-to-Text)
function startVoiceInput() {
  if (!('webkitSpeechRecognition' in window)) {
    alert("❌ Speech recognition not supported in this browser.");
    return;
  }

  const recognition = new webkitSpeechRecognition();
  recognition.lang = 'en-IN';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.start();

  recognition.onresult = (event) => {
    inputField.value = event.results[0][0].transcript;
    sendMessage();
  };

  recognition.onerror = (e) => {
    alert('❌ Voice input error: ' + e.error);
  };
}

// ➤ Send on Enter key
inputField.addEventListener('keypress', e => {
  if (e.key === 'Enter') sendMessage();
});
