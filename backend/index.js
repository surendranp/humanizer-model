import express from "express";
import cors from "cors";
import axios from "axios";
import { buildPrompt } from "./prompts.js";
import { calculateHumanScore } from "./humanScore.js";

const app = express();
app.use(cors());
app.use(express.json());

// 🔥 Human noise post-process
function humanizePostProcess(text) {
  return text
    .replace(/\s{2,}/g, " ")
    .replace(/\.\s+/g, ". ")
    .replace(/,\s*(and|or)\s*/gi, ", $1 ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

app.post("/humanize", async (req, res) => {
  const { text, tone, maxLines, keywords } = req.body;

  let output = "";
  let scoreData;
  let tries = 0;

  while (tries < 3) {
    output = "";

   const response = await axios.post(
  "http://localhost:11434/api/generate",
  {
    model: "mistral",
    prompt: buildPrompt(text, tone, maxLines, keywords),
    stream: true,

    // 🔥 HUMAN-LIKE SAMPLING
    options: {
      temperature: 0.95,
      top_p: 0.9,
      top_k: 40,
      repeat_penalty: 1.15,
      presence_penalty: 0.6,
      frequency_penalty: 0.5
    }
  },
  { responseType: "stream" }
);
    await new Promise(resolve => {
      response.data.on("data", chunk => {
        chunk
          .toString()
          .split("\n")
          .forEach(line => {
            if (!line) return;
            const json = JSON.parse(line);
            if (json.response) output += json.response;
          });
      });
      response.data.on("end", resolve);
    });

    // 🔥 Humanize output slightly
    output = humanizePostProcess(output);

    scoreData = calculateHumanScore(output, keywords);
    if (scoreData.score >= 90) break;

    tries++;
  }

  res.json({
    text: output,
    score: scoreData.score,
    debug: scoreData.debug
  });
});

app.listen(5000, () =>
  console.log("🔥 Backend running at http://localhost:5000")
);
