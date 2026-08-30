const express = require("express");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

/* ================= CONFIG ================= */

const PORT = Number(process.env.PORT || 3000);

const GEMINI_API_KEY =
process.env.GEMINI_API_KEY || "";

const GEMINI_MODEL =
process.env.GEMINI_MODEL || "gemini-3.6-flash";

const OWNER_NAME =
process.env.OWNER_NAME || "HARI TARD";

const PUBLIC_DIR =
path.join(__dirname, "public");

/* ================= MIDDLEWARE ================= */

app.use(express.json({ limit: "1mb" }));

app.use(express.static(PUBLIC_DIR));

/* ================= HOME PAGE ================= */

app.get("/", function (req, res) {
res.sendFile(
path.join(PUBLIC_DIR, "index.html")
);
});

/* ================= HEALTH CHECK ================= */

app.get("/api/health", function (req, res) {

res.json({
ok: true,
service: "NEXORA AI",
model: GEMINI_MODEL,
owner: OWNER_NAME
});

});

/* ================= CHAT API ================= */

app.post("/api/chat", async function (req, res) {

console.log("");
console.log("========== CHAT REQUEST ==========");

try {

const message =
  typeof req.body?.message === "string"
    ? req.body.message.trim()
    : "";

const history =
  Array.isArray(req.body?.history)
    ? req.body.history
    : [];


console.log("Message:", message);
console.log("History:", history.length);
console.log("Model:", GEMINI_MODEL);


/* EMPTY MESSAGE */

if (!message) {

  return res.status(400).json({
    error: "Message is empty."
  });

}


/* API KEY CHECK */

if (!GEMINI_API_KEY) {

  console.error(
    "GEMINI_API_KEY is missing."
  );

  return res.status(500).json({
    error:
      "Gemini API key server par configured nahi hai."
  });

}


/* ================= HISTORY ================= */

const contents = [];

for (const item of history) {

  if (
    !item ||
    typeof item.text !== "string" ||
    !item.text.trim()
  ) {
    continue;
  }


  const role =
    item.role === "assistant"
      ? "model"
      : "user";


  contents.push({
    role: role,
    parts: [
      {
        text: item.text.trim()
      }
    ]
  });

}


/* Make sure current message exists */

const last =
  contents[contents.length - 1];


if (
  !last ||
  last.role !== "user" ||
  last.parts?.[0]?.text !== message
) {

  contents.push({
    role: "user",
    parts: [
      {
        text: message
      }
    ]
  });

}


/* ================= GEMINI URL ================= */

const apiUrl =
  "https://generativelanguage.googleapis.com/v1beta/models/" +
  encodeURIComponent(GEMINI_MODEL) +
  ":generateContent";


console.log("Calling Gemini...");


/* ================= GEMINI REQUEST ================= */

const response = await fetch(apiUrl, {

  method: "POST",

  headers: {
    "Content-Type": "application/json",
    "x-goog-api-key": GEMINI_API_KEY
  },

  body: JSON.stringify({

    systemInstruction: {

      parts: [

        {
          text:
            "You are NEXORA AI, a futuristic AI assistant. " +

            "Your creator and owner is HARI TARD. " +

            "If someone asks who owns you, who created you, " +
            "who made you, or who your owner is, clearly answer " +
            "that NEXORA AI was created and engineered by HARI TARD. " +

            "Do not say that you have no owner. " +

            "Do not invent another owner or company. " +

            "You can answer in Hindi, Hinglish, or English " +
            "depending on the user's language. " +

            "Be helpful, natural, clear and concise."

        }

      ]

    },

    contents: contents

  })

});


console.log(
  "Gemini status:",
  response.status
);


/* ================= GEMINI ERROR ================= */

if (!response.ok) {

  const errorText =
    await response.text();

  console.error(
    "Gemini API error:",
    errorText
  );


  let errorMessage =
    "Gemini API request failed.";

  try {

    const errorData =
      JSON.parse(errorText);

    errorMessage =
      errorData?.error?.message ||
      errorMessage;

  } catch (_) {

    if (errorText) {
      errorMessage = errorText;
    }

  }


  return res.status(response.status).json({
    error: errorMessage
  });

}


/* ================= RESPONSE ================= */

const data =
  await response.json();


const reply =
  data?.candidates?.[0]?.content?.parts
    ?.map(function (part) {

      return part?.text || "";

    })
    .join("")
    .trim();


if (!reply) {

  console.error(
    "Gemini returned empty response:",
    JSON.stringify(data, null, 2)
  );

  return res.status(500).json({
    error:
      "Gemini ne empty response diya."
  });

}


console.log(
  "NEXORA response generated."
);

console.log(
  "================================"
);


return res.json({
  reply: reply
});

} catch (error) {

console.error(
  "NEXORA SERVER ERROR:",
  error
);

return res.status(500).json({
  error:
    "NEXORA server error: " +
    error.message
});

}

});

/* ================= 404 API ================= */

app.use("/api", function (req, res) {

res.status(404).json({
error: "NEXORA API route not found."
});

});

/* ================= START SERVER ================= */

app.listen(
PORT,
"0.0.0.0",
function () {

console.log("");
console.log("================================");
console.log("       NEXORA AI ONLINE");
console.log("================================");
console.log("");
console.log(
  "Local: http://localhost:" + PORT
);
console.log(
  "Model:", GEMINI_MODEL
);
console.log(
  "Owner:", OWNER_NAME
);
console.log("");
console.log(
  "Waiting for chat requests..."
);
console.log("");

}
);