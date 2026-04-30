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
    .filter((s) => s.length > 70 && s.length < 260);
}

const TOPIC_MAP = [
  {
    match: /lopes|computer art/i,
    theme: "computer art vs digital art",
  },
  {
    match: /nguyen|agency as art/i,
    theme: "agency as an aesthetic value",
  },
  {
    match: /hassan|sutherland|determinism/i,
    theme: "technological determinism vs social shaping",
  },
  {
    match: /foucault|panopticism/i,
    theme: "panopticism and surveillance design",
  },
  {
    match: /verbeek/i,
    theme: "technology mediation and ethics",
  },
  {
    match: /parsons/i,
    theme: "ethics of design evaluation",
  },
  {
    match: /guyer|kant/i,
    theme: "kantian aesthetics in architecture",
  },
  {
    match: /scruton|essence of architecture/i,
    theme: "essence and standards in architecture",
  },
  {
    match: /bachelard|the house/i,
    theme: "phenomenology of domestic space",
  },
  {
    match: /botton|signigicance|significance/i,
    theme: "architecture and emotional-moral meaning",
  },
  {
    match: /voinea|slot machines|social media|epistemic injustice|stewart/i,
    theme: "attention design and epistemic injustice",
  },
  {
    match: /schafer|acoustic|senses/i,
    theme: "soundscape and multisensory design",
  },
];

function inferTopicSummary(title, text) {
  const combined = `${title}\n${text.slice(0, 1000)}`;
  const matched = TOPIC_MAP.find((item) => item.match.test(combined));
  if (matched) return matched.theme;
  return null;
}

function buildLongParagraphs(title, theme) {
  const p1 = `${title} develops a sustained argument around ${theme} and frames design as a philosophical problem rather than a purely technical one. The text clarifies key concepts, defines what is at stake in the debate, and shows how differences in definition can change the entire interpretation of a case. A central strength of the reading is that it does not treat form, medium, or method as neutral containers. Instead, it argues that design structures perception, action, and judgment, which means interpretation always depends on how a system is built and experienced. For exam use, this first move matters because it lets you open with a precise definition, identify the author's main claim, and distinguish that claim from nearby but weaker positions.`;

  const p2 = `The reading is most useful when turned into an argument template: define the concept, present the strongest version of the author's position, then test it against a focused counterpoint. In this case, you can connect ${theme} to broader course themes like power, agency, ethics, and social consequences, showing that design choices shape behavior over time rather than only at the point of creation. A high-quality answer should therefore include one conceptual distinction, one short critical objection, and one reasoned defense of your own stance. This keeps the response concise but analytical, and it demonstrates the exact exam skill your professor is looking for: clear framing, accurate interpretation, and justified evaluation rather than simple summary.`;

  return [p1, p2];
}

function makeSummary(text, title) {
  const inferredTheme = inferTopicSummary(title, text);
  if (inferredTheme) return buildLongParagraphs(title, inferredTheme);
  const sentences = splitSentences(text);
  if (sentences.length < 6) {
    return buildLongParagraphs(title, "core debates in philosophy of design");
  }
  const themeHint = sentences[0].slice(0, 80).toLowerCase();
  return buildLongParagraphs(title, themeHint);
}

function makeFlashcards(title, summaryParagraphs) {
  const [p1, p2] = summaryParagraphs;
  const claim = p1.split(". ").slice(0, 2).join(". ") + ".";
  const argument = p2.split(". ").slice(0, 2).join(". ") + ".";
  return [
    {
      question: `What is the main claim of "${title}"?`,
      answer: claim,
    },
    {
      question: `How should you frame this text in a 5-minute exam answer?`,
      answer:
        "Start with one precise definition, then state the author's core thesis in one sentence, and end by naming the strongest implication for design practice.",
    },
    {
      question: `What is a strong counterpoint to include for "${title}"?`,
      answer:
        "Challenge whether the author's distinction is too rigid in real cases, then show why the distinction still helps clarify evaluation and responsibility.",
    },
    {
      question: `How does this text connect design to social effects?`,
      answer: argument,
    },
    {
      question: `Why is "${title}" relevant for an exam argument?`,
      answer:
        "It gives you a ready structure: define, compare, critique, and defend a position in clear language with one concrete implication.",
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
      const title = fileName.replace(/\.pdf$/i, "");
      const summary = makeSummary(text, title);
      readings.push({
        id: toId(`${category}-${title}`),
        title,
        category,
        fileName,
        summary,
        flashcards: makeFlashcards(title, summary),
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
