const chatBox = document.getElementById('chat-box');
const inputField = document.getElementById('user-input');
const typingIndicator = document.getElementById('typing-indicator');

const GEMINI_API_KEY = "AIzaSyDNkXTP69Ik0fhw4UrhARu-sPgeTNhdYso";

// ➤ Restore messages if session exists
window.addEventListener("load", () => {
  const saved = sessionStorage.getItem("chatHistory");
  if (saved) {
    const messages = JSON.parse(saved);
    messages.forEach(m => addMessage(m.text, m.sender, false));
  }
});

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

// ➤ Add message & store in session
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
    speakBtn.addEventListener('click', () => speak(message));
    actions.appendChild(speakBtn);

    const copyBtn = document.createElement('button');
    copyBtn.textContent = '📋';
    copyBtn.title = 'Copy';
    copyBtn.addEventListener('click', () => copyToClipboard(message));
    actions.appendChild(copyBtn);

    msgElement.appendChild(actions);
  }

  chatBox.appendChild(msgElement);
  chatBox.scrollTop = chatBox.scrollHeight;

  if (save) saveToSession(message, sender);
}

// ➤ Save to sessionStorage
function saveToSession(text, sender) {
  let history = JSON.parse(sessionStorage.getItem("chatHistory")) || [];
  history.push({ text, sender });
  sessionStorage.setItem("chatHistory", JSON.stringify(history));
}

// ➤ Typing Indicator
function showTyping(show) {
  typingIndicator.style.display = show ? 'block' : 'none';
  chatBox.scrollTop = chatBox.scrollHeight;
}

// ➤ Smart Gemini API call with multilingual & intent awareness
async function getGeminiResponse(userText) {
  const lowerText = userText.toLowerCase();

  const nameQueries = [
    "what's your name", "your name", "tumhara naam", "naam kya hai", "aapka naam", "aapka naam kya hai"
  ];
  const creatorQueries = [
    "who created you", "who made you", "your developer", "creator",
    "kisne banaya", "banaya kisne", "developer kaun", "kisne develop", "tumhe kisne banaya"
  ];

  const isName = nameQueries.some(q => lowerText.includes(q));
  const isCreator = creatorQueries.some(q => lowerText.includes(q));

  let systemInstruction = "";

  if (isName && !isCreator) {
    systemInstruction = "Respond only with: My name is Nebula.";
  } else if (isCreator && !isName) {
    systemInstruction = "Respond only with: I was created by Vinayak Dhiman.";
  } else if (isName && isCreator) {
    systemInstruction = "Respond only with: I am Nebula, created by Vinayak Dhiman.";
  } else {
    systemInstruction = `
You are Nebula, an AI assistant created by Vinayak Dhiman. 
If the user asks your name (in any language), say "My name is Nebula." 
If they ask who created you or your developer (in any language), say "I was created by Vinayak Dhiman." 
Otherwise, just respond to the user’s message helpfully. Translate and understand user input if it's not in English.
    `.trim();
  }

  const prompt = `${systemInstruction}\n\nUser: ${userText}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        }),
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
    console.error("❌ Gemini API Error:", err);
    return "❌ Could not connect to Gemini API.";
  }
}

// ➤ Voice
function speak(text) {
  if ('speechSynthesis' in window) {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-IN';
    utter.rate = 1;
    utter.pitch = 1;
    speechSynthesis.speak(utter);
  } else {
    alert("❌ Your browser does not support speech synthesis.");
  }
}

// ➤ Clipboard
function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text)
      .then(() => alert("✅ Copied to clipboard!"))
      .catch(() => alert("❌ Failed to copy."));
  } else {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      const success = document.execCommand("copy");
      alert(success ? "✅ Copied to clipboard!" : "❌ Copy failed.");
    } catch {
      alert("❌ Copy failed.");
    }
    document.body.removeChild(textarea);
  }
}

// ➤ Enter to send
inputField.addEventListener("keypress", function (e) {
  if (e.key === "Enter") sendMessage();
});
