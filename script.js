const chatBox = document.getElementById('chat-box');
const inputField = document.getElementById('user-input');
const typingIndicator = document.getElementById('typing-indicator');

const GEMINI_API_KEY = "AIzaSyDNkXTP69Ik0fhw4UrhARu-sPgeTNhdYso"; // Replace with your Gemini API key

let chatHistory = JSON.parse(sessionStorage.getItem("chatHistory")) || [];

// ✅ Load chat on page load
window.addEventListener("load", () => {
  chatHistory.forEach(msg => addMessage(msg.text, msg.sender, false));
});

// ✅ Save to session
function saveToSession() {
  sessionStorage.setItem("chatHistory", JSON.stringify(chatHistory));
}

// ✅ Send message
function sendMessage() {
  const userMessage = inputField.value.trim();
  if (!userMessage) return;

  addMessage(userMessage, 'user');
  chatHistory.push({ role: 'user', text: userMessage });
  saveToSession();
  inputField.value = '';
  showTyping(true);

  getGeminiResponse().then(botReply => {
    showTyping(false);
    addMessage(botReply, 'bot');
    chatHistory.push({ role: 'model', text: botReply });
    saveToSession();
  });
}

// ✅ Add message to UI
function addMessage(message, sender, save = true) {
  const msgElement = document.createElement('div');
  msgElement.classList.add('message', sender);

  const messageText = document.createElement('span');
  messageText.textContent = message;
  msgElement.appendChild(messageText);

  if (sender === 'bot') {
    const actions = document.createElement('div');
    actions.className = 'message-actions';

    const speakBtn = document.createElement('button');
    speakBtn.textContent = '🔊';
    speakBtn.title = 'Speak';
    speakBtn.onclick = () => speak(message);
    actions.appendChild(speakBtn);

    const copyBtn = document.createElement('button');
    copyBtn.textContent = '📋';
    copyBtn.title = 'Copy';
    copyBtn.onclick = () => copyToClipboard(message);
    actions.appendChild(copyBtn);

    msgElement.appendChild(actions);
  }

  chatBox.appendChild(msgElement);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// ✅ Typing indicator
function showTyping(show) {
  typingIndicator.style.display = show ? 'block' : 'none';
  chatBox.scrollTop = chatBox.scrollHeight;
}

// ✅ Gemini API with Full Chat History Context
async function getGeminiResponse() {
  const formattedHistory = chatHistory.map(entry => ({
    role: entry.role,
    parts: [{ text: entry.text }]
  }));

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: formattedHistory }),
      }
    );

    const data = await response.json();
    console.log("Gemini API response:", data);

    if (
      data &&
      data.candidates &&
      data.candidates[0]?.content?.parts?.[0]?.text
    ) {
      return data.candidates[0].content.parts[0].text;
    } else {
      return "⚠️ Gemini didn't return a valid response.";
    }
  } catch (err) {
    console.error("Gemini API Error:", err);
    return "❌ Could not connect to Gemini API.";
  }
}

// ✅ Voice Output
function speak(text) {
  if ('speechSynthesis' in window) {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-IN';
    speechSynthesis.speak(utter);
  } else {
    alert("❌ Your browser doesn't support text-to-speech.");
  }
}

// ✅ Copy to clipboard
function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => alert("✅ Copied!"));
  } else {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    alert("✅ Copied!");
  }
}

// ✅ Enter key to send
inputField.addEventListener("keypress", function (e) {
  if (e.key === "Enter") sendMessage();
});
