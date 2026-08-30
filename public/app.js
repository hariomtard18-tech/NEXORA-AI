const landing = document.getElementById("landing");
const app = document.getElementById("app");

const enterButton = document.getElementById("enterButton");
const guestButton = document.getElementById("guestButton");

const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const messages = document.getElementById("messages");
const welcome = document.getElementById("welcome");

const clearButton = document.getElementById("clearButton");
const newChatButton = document.getElementById("newChatButton");

const menuButton = document.getElementById("menuButton");
const sidebar = document.getElementById("sidebar");

let conversation = [];


/* ================= ENTER NEXORA ================= */

function openNexora() {
  if (!landing || !app) {
    console.error("Landing/App element missing.");
    return;
  }

  landing.classList.add("hidden");
  app.classList.remove("hidden");

  if (messageInput) {
    setTimeout(() => messageInput.focus(), 100);
  }
}

if (enterButton) {
  enterButton.addEventListener("click", openNexora);
}

if (guestButton) {
  guestButton.addEventListener("click", openNexora);
}


/* ================= MOBILE MENU ================= */

if (menuButton && sidebar) {
  menuButton.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });
}


/* ================= NEW CHAT ================= */

function startNewChat() {
  conversation = [];

  if (messages) {
    messages.innerHTML = "";
  }

  if (welcome) {
    welcome.classList.remove("hidden");
  }

  if (messageInput) {
    messageInput.value = "";
    messageInput.style.height = "auto";
    messageInput.focus();
  }
}

if (newChatButton) {
  newChatButton.addEventListener("click", startNewChat);
}

if (clearButton) {
  clearButton.addEventListener("click", startNewChat);
}


/* ================= QUICK PROMPTS ================= */

document.querySelectorAll(".quick-prompts button").forEach((button) => {

  button.addEventListener("click", () => {

    const prompt = button.dataset.prompt;

    if (!prompt || !messageInput) {
      return;
    }

    messageInput.value = prompt;
    messageInput.focus();

  });

});


/* ================= ADD MESSAGE ================= */

function addMessage(text, type) {

  if (!messages) {
    return;
  }

  const message = document.createElement("div");
  message.className = `message ${type}`;

  const bubble = document.createElement("div");
  bubble.className = "bubble";

  bubble.textContent = text;

  message.appendChild(bubble);
  messages.appendChild(message);

  const chatArea = document.getElementById("chatMessages");

  if (chatArea) {
    chatArea.scrollTop = chatArea.scrollHeight;
  }
}


/* ================= TYPING ================= */

function addTyping() {

  if (!messages) {
    return;
  }

  removeTyping();

  const message = document.createElement("div");

  message.id = "typingMessage";
  message.className = "message assistant";

  const bubble = document.createElement("div");

  bubble.className = "bubble typing";
  bubble.textContent = "NEXORA is thinking...";

  message.appendChild(bubble);
  messages.appendChild(message);

  const chatArea = document.getElementById("chatMessages");

  if (chatArea) {
    chatArea.scrollTop = chatArea.scrollHeight;
  }
}


function removeTyping() {

  const typing = document.getElementById("typingMessage");

  if (typing) {
    typing.remove();
  }
}


/* ================= SEND MESSAGE ================= */

async function sendMessage(text) {

  const cleanText = String(text || "").trim();

  if (!cleanText) {
    return;
  }

  if (welcome) {
    welcome.classList.add("hidden");
  }

  addMessage(cleanText, "user");

  conversation.push({
    role: "user",
    text: cleanText
  });

  if (messageInput) {
    messageInput.value = "";
    messageInput.style.height = "auto";
  }

  addTyping();

  try {

    console.log("Sending request to /api/chat...");

    const response = await fetch("/api/chat", {

      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },

      body: JSON.stringify({
        message: cleanText,
        history: conversation
      })

    });

    console.log("API status:", response.status);

    const rawText = await response.text();

    console.log("Raw API response:", rawText);

    removeTyping();

    let data = {};

    try {
      data = JSON.parse(rawText);
    } catch (parseError) {

      console.error(
        "JSON parse error:",
        parseError
      );

      addMessage(
        "Server ne valid JSON response nahi diya. API status: " +
        response.status,
        "assistant"
      );

      return;
    }


    if (!response.ok) {

      const errorMessage =
        data.error ||
        `NEXORA API error (${response.status})`;

      console.error(
        "NEXORA API ERROR:",
        data
      );

      addMessage(
        errorMessage,
        "assistant"
      );

      return;
    }


    const reply =
      typeof data.reply === "string"
        ? data.reply.trim()
        : "";


    if (!reply) {

      addMessage(
        "NEXORA ne empty response diya.",
        "assistant"
      );

      return;
    }


    addMessage(
      reply,
      "assistant"
    );


    conversation.push({
      role: "assistant",
      text: reply
    });


  } catch (error) {

    removeTyping();

    console.error(
      "FETCH ERROR:",
      error
    );

    addMessage(
      "Connection error: " + error.message,
      "assistant"
    );

  }

}


/* ================= FORM ================= */

if (chatForm) {

  chatForm.addEventListener("submit", (event) => {

    event.preventDefault();

    if (!messageInput) {
      return;
    }

    sendMessage(messageInput.value);

  });

}


/* ================= ENTER KEY ================= */

if (messageInput) {

  messageInput.addEventListener("keydown", (event) => {

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      if (chatForm) {
        chatForm.requestSubmit();
      }

    }

  });


  /* ================= AUTO HEIGHT ================= */

  messageInput.addEventListener("input", function () {

    this.style.height = "auto";

    this.style.height =
      Math.min(this.scrollHeight, 130) + "px";

  });

}


/* ================= MODE BUTTONS ================= */

document.querySelectorAll(".mode").forEach((button) => {

  button.addEventListener("click", () => {

    document
      .querySelectorAll(".mode")
      .forEach((item) => item.classList.remove("active"));

    button.classList.add("active");

  });

});


console.log("NEXORA AI frontend loaded successfully.");