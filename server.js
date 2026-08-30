const express = require("express");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

const PORT = Number(process.env.PORT || 3000);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

const PUBLIC_DIR = path.join(__dirname, "public");


// ================= MIDDLEWARE =================

app.use(express.json({ limit: "1mb" }));

app.use(express.static(PUBLIC_DIR));


// ================= HOME =================

app.get("/", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});


// ================= HEALTH =================

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "NEXORA AI",
    model: GEMINI_MODEL,
    owner: "HARI TARD"
  });
});


// ================= CHAT =================

app.post("/api/chat", async (req, res) => {

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


    if (!message) {

      return res.status(400).json({
        error: "Message is empty."
      });

    }


    if (!GEMINI_API_KEY) {

      console.error("GEMINI_API_KEY missing.");

      return res.status(500).json({
        error: "GEMINI_API_KEY .env file me nahi mila."
      });

    }


    // ================= BUILD HISTORY =================

    const contents = [];

    for (const item of history) {

      if (!item || typeof item.text !== "string") {
        continue;
      }

      const text = item.text.trim();

      if (!text) {
        continue;
      }

      contents.push({
        role: item.role === "assistant" ? "model" : "user",
        parts: [
          {
            text: text
          }
        ]
      });

    }


    // ================= GEMINI URL =================

    const apiUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/" +
      encodeURIComponent(GEMINI_MODEL) +
      ":generateContent";


    console.log("Model:", GEMINI_MODEL);
    console.log("Calling Gemini...");


    // ================= GEMINI REQUEST =================

    const geminiResponse = await fetch(apiUrl, {

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
                "You were created, made and engineered by HARI TARD. " +
                "If anyone asks who your owner, creator, maker, developer, " +
                "engineer or founder is, answer clearly that HARI TARD is " +
                "your owner and creator and that NEXORA AI was engineered by HARI TARD. " +
                "Respond naturally in Hindi, Hinglish or English according to the user."
            }
          ]
        },

        contents:
          contents.length > 0
            ? contents
            : [
                {
                  role: "user",
                  parts: [
                    {
                      text: message
                    }
                  ]
                }
              ]

      })

    });


    // ================= GEMINI RESPONSE =================

    const raw = await geminiResponse.text();

    console.log(
      "Gemini status:",
      geminiResponse.status
    );


    let data;

    try {
      data = JSON.parse(raw);
    } catch (error) {

      console.error("Gemini returned invalid JSON:");

      console.error(raw);

      return res.status(502).json({
        error: "Gemini ne invalid response diya."
      });

    }


    // ================= GEMINI ERROR =================

    if (!geminiResponse.ok) {

      const errorMessage =
        data?.error?.message ||
        "Gemini API request failed.";

      console.error(
        "Gemini API ERROR:",
        errorMessage
      );

      return res.status(geminiResponse.status).json({
        error: "Gemini API Error: " + errorMessage
      });

    }


    // ================= GET REPLY =================

    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("")
        .trim();


    if (!reply) {

      console.error(
        "Gemini returned empty response."
      );

      return res.status(500).json({
        error: "Gemini ne empty response diya."
      });

    }


    console.log("NEXORA response generated.");

    console.log("================================");
    console.log("");


    return res.json({
      reply: reply
    });


  } catch (error) {

    console.error("");
    console.error("========== SERVER ERROR ==========");
    console.error(error);
    console.error("==================================");
    console.error("");

    return res.status(500).json({
      error: "NEXORA server error: " + error.message
    });

  }

});


// ================= SERVER =================

const server = app.listen(PORT, "0.0.0.0", () => {

  console.log("");
  console.log("================================");
  console.log("       NEXORA AI ONLINE");
  console.log("================================");
  console.log("");
  console.log("Local: http://localhost:" + PORT);
  console.log("Model:", GEMINI_MODEL);
  console.log("Owner: HARI TARD");
  console.log("");
  console.log("Waiting for chat requests...");
  console.log("");

});


// ================= SERVER ERRORS =================

server.on("error", (error) => {

  console.error("");
  console.error("========== SERVER ERROR ==========");

  if (error.code === "EADDRINUSE") {

    console.error(
      "Port " + PORT + " is already in use."
    );

  } else {

    console.error(error);

  }

  console.error("==================================");
  console.error("");

});


// ================= PROCESS ERRORS =================

process.on("uncaughtException", (error) => {

  console.error("");
  console.error("UNCAUGHT EXCEPTION:");
  console.error(error);
  console.error("");

});


process.on("unhandledRejection", (reason) => {

  console.error("");
  console.error("UNHANDLED REJECTION:");
  console.error(reason);
  console.error("");

});