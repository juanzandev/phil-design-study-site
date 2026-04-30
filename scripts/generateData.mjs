import fs from "node:fs/promises";
import path from "node:path";
import { PDFParse } from "pdf-parse";

const ROOT = path.resolve("..", "Philosophy of Design", "Phil Design");
const OUT_FILE = path.resolve("src", "data", "readings.json");

const CATEGORY_ORDER = [
  "Possible Question Readings",
  "Pres",
  "Questions",
  "Unlikely",
];

const GIVEN_QUESTIONS = [
  {
    id: "lopes",
    question:
      "In “A Computer Art Form,” what does Lopes argue distinguishes computer art from digital art? Offer a counterargument to Lopes’s position.",
  },
  {
    id: "foucault",
    question:
      "Foucault compares contemporary surveillance design to what medieval practice in Panopticism? Do you believe we live in a panopticon society? Why or why not?",
  },
  {
    id: "determinism",
    question:
      "What is technological determinism in Hassan and Sutherland’s “Philosophy of Media”? Which side do you take: technological determinism or social shaping theory, and why?",
  },
];

const TITLE_OVERRIDES = [
  { match: /computer art form/i, textName: "A Computer Art Form", author: "Dominic Lopes" },
  { match: /technological determinism/i, textName: "Technological Determinism", author: "Hassan and Sutherland" },
  { match: /panopticism/i, textName: "Panopticism", author: "Michel Foucault" },
  { match: /agency as art/i, textName: "Agency as Art", author: "C. Thi Nguyen" },
  { match: /verbeek/i, textName: "Design Ethics", author: "Peter-Paul Verbeek" },
  { match: /parsons/i, textName: "Ethics of Design", author: "Glenn Parsons" },
  { match: /kantphilosophyarchitecture|guyer/i, textName: "Kant and the Philosophy of Architecture", author: "Paul Guyer" },
  { match: /essence.*scruton|has architecture have an essence/i, textName: "Does Architecture Have an Essence?", author: "Roger Scruton" },
  { match: /the house.*bachelard/i, textName: "The House", author: "Gaston Bachelard" },
  { match: /signigicance|significance.*botton/i, textName: "The Significance of Architecture", author: "Alain de Botton" },
  { match: /slot machines.*attentional scaffolds|voinea/i, textName: "Digital Slot Machines and Attentional Scaffolds", author: "Voinea et al." },
  { match: /perfect storm.*epistemic injustice|stewart/i, textName: "A Perfect Storm for Epistemic Injustice", author: "Stewart et al." },
  { match: /acoustic designer|schafer part 1/i, textName: "The Acoustic Designer", author: "Murray Schafer" },
  { match: /architecture and the senses|schafer part 2/i, textName: "Architecture and the Senses", author: "Murray Schafer" },
  { match: /week 10,\s*lopes/i, textName: "A Computer Art Form", author: "Dominic Lopes" },
  { match: /week 10,\s*nguyen/i, textName: "Agency as Art", author: "C. Thi Nguyen" },
  { match: /week 11,\s*sutherland and hassan/i, textName: "Technological Determinism", author: "Hassan and Sutherland" },
  { match: /week 12,\s*foucault/i, textName: "Panopticism", author: "Michel Foucault" },
  { match: /week 12,\s*parsons/i, textName: "Ethics of Design", author: "Glenn Parsons" },
  { match: /week 13,\s*scruton/i, textName: "Does Architecture Have an Essence?", author: "Roger Scruton" },
  { match: /week 13,\s*guyer/i, textName: "Kant and the Philosophy of Architecture", author: "Paul Guyer" },
  { match: /week 14,\s*bachelard/i, textName: "The House", author: "Gaston Bachelard" },
  { match: /week 14,\s*botton/i, textName: "The Significance of Architecture", author: "Alain de Botton" },
];

function toId(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanText(raw) {
  return raw
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .replace(/\s+\n/g, "\n")
    .trim();
}

function splitSentences(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 70 && s.length < 320);
}

function parseReadingMeta(fileName) {
  const base = fileName.replace(/\.pdf$/i, "").replace(/\s+/g, " ").trim();
  const weekMatch = base.match(/(?:wk|week)\s*(\d{1,2})/i);
  const week = weekMatch ? Number.parseInt(weekMatch[1], 10) : 99;
  const withoutWeek = base.replace(/^(?:wk|week)\s*\d{1,2}\s*[-,]?\s*/i, "").trim();
  const fallbackParts = withoutWeek.split(",").map((s) => s.trim()).filter(Boolean);
  let textName = fallbackParts[0] || withoutWeek || base;
  let author = fallbackParts.length > 1 ? fallbackParts.at(-1) : "Unknown Author";
  const override = TITLE_OVERRIDES.find((item) => item.match.test(base));
  if (override) {
    textName = override.textName;
    author = override.author;
  }
  textName = textName.replace(/^[-_ ]+|[-_ ]+$/g, "");
  author = author.replace(/^[-_ ]+|[-_ ]+$/g, "");
  return {
    week,
    textName,
    author,
    displayTitle: `Week ${week}: ${textName} - ${author}`,
  };
}

const STOPWORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "into", "their", "there", "were", "have",
  "been", "will", "would", "about", "which", "when", "what", "where", "while", "also", "than",
  "they", "them", "then", "such", "these", "those", "because", "through", "over", "under", "between",
  "after", "before", "being", "used", "using", "most", "more", "less", "very", "only", "many", "some",
  "text", "page", "pages", "jstor", "week", "author", "source",
]);

function sanitizeForSummary(text) {
  return text
    .replace(/--\s*\d+\s*of\s*\d+\s*--/gi, " ")
    .replace(/\n\d+\n/g, " ")
    .replace(/copyright[^\n]*/gi, " ")
    .replace(/doi:[^\s]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sentenceScore(sentence, termWeights) {
  const words = sentence.toLowerCase().match(/[a-z]{4,}/g) ?? [];
  let score = 0;
  for (const word of words) score += termWeights.get(word) ?? 0;
  if (/\b(argues?|claims?|defines?|distinguishes?|describes?|analy[sz]es?|explores?)\b/i.test(sentence)) {
    score += 2;
  }
  return score;
}

function keywordWeights(text) {
  const words = text.toLowerCase().match(/[a-z]{4,}/g) ?? [];
  const counts = new Map();
  for (const word of words) {
    if (STOPWORDS.has(word)) continue;
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  const top = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 40);
  return new Map(top);
}

function buildParagraph(candidates, minSentences = 4) {
  if (!candidates.length) return "";
  const ordered = [...candidates].sort((a, b) => a.index - b.index);
  const chosen = ordered.slice(0, Math.max(minSentences, Math.min(6, ordered.length)));
  return chosen.map((item) => item.sentence).join(" ");
}

function makeSummary(text, title) {
  const clean = sanitizeForSummary(text);
  const sentences = splitSentences(clean);
  if (sentences.length < 8) {
    return [
      `${title} examines core questions in philosophy of design by focusing on how form, medium, and interpretation shape meaning. The reading develops conceptual distinctions and uses examples to show how design decisions influence aesthetic and social understanding.`,
      `The text follows a structured argument that clarifies key terms, compares competing positions, and identifies implications for how we evaluate artifacts. Its central contribution is a detailed account of how design frameworks influence perception, judgment, and the relation between practice and theory.`,
    ];
  }

  const weights = keywordWeights(clean);
  const scored = sentences.map((sentence, index) => ({
    sentence,
    index,
    score: sentenceScore(sentence, weights),
  }));

  const mid = Math.floor(scored.length / 2);
  const firstPool = scored
    .filter((item) => item.index < mid + 2)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 8);
  const secondPool = scored
    .filter((item) => item.index >= Math.max(2, mid - 2))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 8);

  const firstParagraph = buildParagraph(firstPool, 4);
  const secondParagraph = buildParagraph(secondPool, 4);
  return [firstParagraph, secondParagraph];
}

function makeFlashcards(title, summaryParagraphs) {
  const [p1, p2] = summaryParagraphs;
  const s1 = p1.split(/(?<=[.!?])\s+/);
  const s2 = p2.split(/(?<=[.!?])\s+/);
  const firstTwo = s1.slice(0, 2).join(" ");
  const middleTwo = s1.slice(2, 4).join(" ");
  const nextTwo = s2.slice(0, 2).join(" ");
  const lastTwo = s2.slice(2, 4).join(" ");
  return [
    {
      question: `In the essay, "${title}", what does the author argue is the central distinction or core claim? Offer one concise explanation.`,
      answer: firstTwo,
    },
    {
      question: `In "${title}", what conceptual distinction is used to organize the argument? Explain why that distinction matters for interpreting the text.`,
      answer: middleTwo,
    },
    {
      question: `How does "${title}" define or frame its key concept, and what position does the author take in relation to competing views?`,
      answer: nextTwo,
    },
    {
      question: `In "${title}", what broader implication follows for how we understand design, media, or architecture in social life?`,
      answer: nextTwo,
    },
    {
      question: `Which side of the debate in "${title}" do you find more convincing, and why? Give one reasoned justification grounded in the text.`,
      answer: lastTwo || nextTwo,
    },
  ];
}

function categoryWeight(category) {
  const idx = CATEGORY_ORDER.indexOf(category);
  return idx === -1 ? 999 : idx;
}

async function readPdfText(filePath) {
  const parser = new PDFParse({ data: await fs.readFile(filePath) });
  const result = await parser.getText();
  await parser.destroy();
  return cleanText(result.text ?? "");
}

function buildGivenQuestionAnswers(readings) {
  return [
    {
      ...GIVEN_QUESTIONS[0],
      synthesizedAnswer:
        "Lopes argues computer art is defined by its dependence on computational processes as part of the artwork’s identity, not merely by being stored or displayed digitally. A counterargument is that this line is too strict, because many digital works involve meaningful interaction and procedural manipulation even if computation is not foregrounded as the core aesthetic property. In practice, the boundary between digital and computer art is often fluid.",
      byText: readings
        .filter((r) => /lopes|computer art/i.test(r.fileName))
        .map((r) => ({
          readingId: r.id,
          answer:
            "This text frames computer art as art whose form depends on computational structure and rule-based generation rather than just digital format.",
        })),
    },
    {
      ...GIVEN_QUESTIONS[1],
      synthesizedAnswer:
        "Foucault links modern surveillance design to the historical model of leper exclusion and, more directly, plague-era partition and observation, culminating in the panopticon logic of constant visibility. Today’s digital infrastructure resembles a distributed panopticon because people internalize monitoring by platforms, institutions, and data systems. I would argue we partially live in one: surveillance is not total, but it is normalized and behavior-shaping.",
      byText: readings
        .filter((r) => /foucault|panopticism/i.test(r.fileName))
        .map((r) => ({
          readingId: r.id,
          answer:
            "Foucault shows how disciplinary power works by making subjects permanently observable, so control becomes internalized rather than externally forced.",
        })),
    },
    {
      ...GIVEN_QUESTIONS[2],
      synthesizedAnswer:
        "Hassan and Sutherland present technological determinism as the view that technology drives social change in a primary, often one-directional way. Social shaping theory instead argues technologies are produced, interpreted, and stabilized through institutions, culture, and political choices. I side with social shaping because it better explains why similar technologies produce different outcomes across contexts.",
      byText: readings
        .filter((r) => /hassan|sutherland|determinism/i.test(r.fileName))
        .map((r) => ({
          readingId: r.id,
          answer:
            "This reading defines determinism as technology-led social change, then contrasts it with approaches that stress social and institutional mediation.",
        })),
    },
  ];
}

async function main() {
  const categories = await fs.readdir(ROOT);
  const readings = [];

  for (const category of categories.sort((a, b) => categoryWeight(a) - categoryWeight(b))) {
    const catPath = path.join(ROOT, category);
    const stats = await fs.stat(catPath);
    if (!stats.isDirectory()) continue;

    const files = (await fs.readdir(catPath)).filter((f) => f.toLowerCase().endsWith(".pdf"));
    for (const fileName of files) {
      const filePath = path.join(catPath, fileName);
      const text = await readPdfText(filePath);
      const meta = parseReadingMeta(fileName);
      const summary = makeSummary(text, `${meta.textName} by ${meta.author}`);
      readings.push({
        id: toId(`${category}-${meta.displayTitle}`),
        title: meta.displayTitle,
        textName: meta.textName,
        author: meta.author,
        week: meta.week,
        category,
        fileName,
        summary,
        flashcards: makeFlashcards(meta.textName, summary),
      });
    }
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    readings,
    givenQuestions: buildGivenQuestionAnswers(readings),
  };

  await fs.writeFile(OUT_FILE, JSON.stringify(payload, null, 2), "utf-8");
  console.log(`Generated ${readings.length} readings in ${OUT_FILE}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
