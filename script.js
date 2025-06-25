const chatBox = document.getElementById('chat-box');
const inputField = document.getElementById('user-input');
const typingIndicator = document.getElementById('typing-indicator');

const GEMINI_API_KEY = "AIzaSyDNkXTP69Ik0fhw4UrhARu-sPgeTNhdYso"; // Replace with your API Key

let chatHistory = JSON.parse(sessionStorage.getItem("chatHistory")) || [];
let speakingUtterance = null;
let currentlySpeakingBtn = null;

// Load previous session
window.addEventListener("load", () => {
  chatHistory.forEach(msg => addMessage(msg.text, msg.sender, false));
});

// Save session
function saveToSession() {
  sessionStorage.setItem("chatHistory", JSON.stringify(chatHistory));
}

// Send Message
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

// Add message to chat
function addMessage(message, sender, save = true) {
  const msgElement = document.createElement('div');
  msgElement.classList.add('message', sender);

  const messageText = document.createElement('span');
  messageText.textContent = message;
  msgElement.appendChild(messageText);

  if (sender === 'bot') {
    const actions = document.createElement('div');
    actions.className = 'message-actions';

    // Voice Button
    const speakBtn = document.createElement('button');
    speakBtn.textContent = '🔊';
    speakBtn.title = 'Speak';
    speakBtn.onclick = () => toggleSpeak(message, speakBtn);
    actions.appendChild(speakBtn);

    // Copy Button
    const copyBtn = document.createElement('button');
    copyBtn.textContent = '📋';
    copyBtn.title = 'Copy';
    copyBtn.onclick = () => copyToClipboard(message);
    actions.appendChild(copyBtn);

    msgElement.appendChild(actions);
  }

  chatBox.appendChild(msgElement);
  chatBox.scrollTop = chatBox.scrollHeight;

  if (save) saveToSession();
}

// Typing indicator
function showTyping(show) {
  typingIndicator.style.display = show ? 'block' : 'none';
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Gemini API with context
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
    console.log("Gemini API:", data);

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

// Toggle Speak / Stop
function toggleSpeak(text, button) {
  if (speechSynthesis.speaking && currentlySpeakingBtn === button) {
    speechSynthesis.cancel();
    button.textContent = '🔊';
    currentlySpeakingBtn = null;
    return;
  }

  const cleanText = text.replace(/[^a-zA-Z0-9\s.,?!]/g, ' '); // Remove annoying symbols like *

  const utter = new SpeechSynthesisUtterance(cleanText);
  utter.lang = 'en-IN';
  utter.rate = 1;
  utter.pitch = 1;

  utter.onstart = () => {
    button.textContent = '⏸️';
    currentlySpeakingBtn = button;
  };

  utter.onend = () => {
    button.textContent = '🔊';
    currentlySpeakingBtn = null;
  };

  speechSynthesis.speak(utter);
}

// Copy to Clipboard
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

// Enter key to send
inputField.addEventListener("keypress", function (e) {
  if (e.key === "Enter") sendMessage();
});
