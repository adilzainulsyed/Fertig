const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

router.post('/', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'No message provided' });
  }

  try {
    // 🧠 Local Phi-3 model via Ollama (30-second timeout)
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 30000);

    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "phi3:mini", // or "phi3:mini-4k-instruct" if you pulled that tag
        prompt: message
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const data = await response.json();
    const reply = data.response || "No response from local model";
    res.json({ reply });

  } catch (error) {
    console.error("Chatbot API Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
