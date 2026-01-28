const aiBuzz = [
  "evidence-based",
  "cutting-edge",
  "foster",
  "champion",
  "moreover",
  "furthermore",
  "ensures",
  "tailored to",
  "designed to"
];

export function calculateHumanScore(text, keywords = "") {
  let score = 100;
  const debug = [];

  aiBuzz.forEach(w => {
    if (text.toLowerCase().includes(w)) {
      score -= 8;
      debug.push(`Buzzword detected: ${w}`);
    }
  });

  if (text.split(".").length - 1 < 2) {
    score -= 10;
    debug.push("Too few sentence breaks");
  }

  const uniqueRatio =
    new Set(text.split(/\s+/)).size / text.split(/\s+/).length;

  if (uniqueRatio < 0.6) {
    score -= 12;
    debug.push("Low lexical variety");
  }

  return { score: Math.max(score, 0), debug };
}
