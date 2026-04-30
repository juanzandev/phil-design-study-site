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
    paragraphs: [
      "Lopes argues that computer art is not just any art in digital format. For him, computer art depends on computational procedures as part of how the work is made and understood, so the medium is tied to rule-based processing and not only storage or display technology.",
      "The key exam issue is whether this distinction is too narrow in practice. A strong counterpoint is that many digital works mix interaction, code, editing, and platform behavior in ways that blur strict boundaries, so digital and computer art may be better treated as overlapping categories.",
    ],
  },
  {
    match: /nguyen|agency as art/i,
    paragraphs: [
      "Nguyen centers agency as an aesthetic value, arguing that part of what we appreciate in art is the quality of action it enables in creators and audiences. The discussion shifts attention from static objects to structured choices, participation, and skillful engagement.",
      "For exam use, this text helps explain why systems, games, and interactive environments can count as serious art forms. It also supports arguments that design is not neutral, because the design of constraints directly shapes what kinds of agency are possible.",
    ],
  },
  {
    match: /hassan|sutherland|determinism/i,
    paragraphs: [
      "The paper defines technological determinism as the view that technological development drives social change in a mostly one-way direction. In contrast, social shaping theory argues that institutions, politics, culture, and user practices co-produce technological outcomes.",
      "A concise exam position is to side with social shaping while admitting that technologies still create real constraints. This balanced view explains why the same tool can lead to different social effects depending on governance, design decisions, and local context.",
    ],
  },
  {
    match: /foucault|panopticism/i,
    paragraphs: [
      "Foucault explains modern discipline through architectures of visibility where people can be observed continuously and therefore regulate themselves. Panopticism names this shift from occasional punishment to everyday behavioral control built into institutions and routines.",
      "The text is useful for digital-era analysis because platforms and data systems reproduce similar dynamics at scale. It supports arguments that surveillance today is diffuse and normalized, shaping conduct even when direct coercion is not visible.",
    ],
  },
  {
    match: /verbeek/i,
    paragraphs: [
      "Verbeek argues that technologies mediate moral action rather than remaining neutral tools. Design influences how people perceive options, assign responsibility, and make ethical decisions, so artifacts actively participate in moral life.",
      "For exams, this supports a design ethics framework focused on responsibility during creation, deployment, and use. The main takeaway is that ethical evaluation should include technical form, not only user intention.",
    ],
  },
  {
    match: /parsons/i,
    paragraphs: [
      "Parsons develops ethical questions in design by linking form, function, and value judgments. The text highlights how design quality cannot be separated from human consequences, including environmental, social, and cultural effects.",
      "A strong exam use is to show that design criticism is also moral criticism. Evaluating a design means asking not only whether it works, but also whom it serves, excludes, or harms.",
    ],
  },
  {
    match: /guyer|kant/i,
    paragraphs: [
      "Guyer examines Kant to clarify how architecture sits between utility and beauty. The argument emphasizes that architectural judgment involves both practical function and aesthetic form, making architecture a special case in philosophical aesthetics.",
      "This reading helps answer debates about whether architecture is pure art or purposive making. Its value for exams is the conceptual bridge it gives between formal appreciation and use-oriented evaluation.",
    ],
  },
  {
    match: /scruton|essence of architecture/i,
    paragraphs: [
      "Scruton asks whether architecture has an essence and challenges overly simple views that reduce buildings to either engineering function or symbolic expression. He argues that architectural understanding requires attention to human experience, place, and evaluative standards.",
      "The core exam payoff is his critique of relativism: if all buildings merely mirror their era, critical judgment collapses. Scruton therefore defends criteria for distinguishing better and worse design in meaningful, not purely subjective, ways.",
    ],
  },
  {
    match: /bachelard|the house/i,
    paragraphs: [
      "Bachelard treats the house as a structure of lived imagination, where spaces like attics, rooms, and cellars organize memory and feeling. The text moves from technical architecture toward phenomenology, showing how built space shapes inner life.",
      "For exam writing, this reading supports arguments about design and subjectivity. It shows that architecture matters not only because of function, but because it anchors intimacy, identity, and poetic experience.",
    ],
  },
  {
    match: /botton|signigicance|significance/i,
    paragraphs: [
      "de Botton argues that architecture communicates values and emotional atmospheres, affecting how we feel and who we think we are. Buildings are presented as practical philosophy: they can educate taste, stabilize mood, and reflect collective ideals.",
      "The exam-ready takeaway is that architectural criticism can be framed as moral-psychological criticism. Design choices are not decorative extras; they influence behavior, aspiration, and social memory.",
    ],
  },
  {
    match: /voinea|slot machines|social media|epistemic injustice|stewart/i,
    paragraphs: [
      "These media readings analyze platform design as an attentional and epistemic architecture. Social media systems are compared to slot machines because variable rewards, interface cues, and notification loops train habitual engagement.",
      "The key conceptual point is that design can generate epistemic injustice by structuring whose voices are amplified, ignored, or discredited. This gives a direct bridge from interface mechanics to political and ethical consequences.",
    ],
  },
  {
    match: /schafer|acoustic|senses/i,
    paragraphs: [
      "Schafer broadens design analysis beyond vision by focusing on sonic environments and sensory experience. The readings argue that architecture and media shape attention through soundscapes, rhythms, and embodied perception.",
      "For exams, this perspective helps challenge visual bias in design theory. It supports claims that good design should be evaluated as multisensory world-making, not just visual style or technical performance.",
    ],
  },
];

function inferTopicSummary(title, text) {
  const combined = `${title}\n${text.slice(0, 1000)}`;
  const matched = TOPIC_MAP.find((item) => item.match.test(combined));
  if (matched) return matched.paragraphs;
  return null;
}

function makeSummary(text, title) {
  const inferred = inferTopicSummary(title, text);
  if (inferred) return inferred;
  const sentences = splitSentences(text);
  if (sentences.length < 6) {
    const fallback = `${title} explores key themes in philosophy of design and explains how conceptual arguments shape how we interpret media, architecture, and technological systems. The text compares competing positions and highlights how design choices carry social and ethical consequences.`;
    return [fallback, fallback];
  }
  const first = sentences.slice(0, 3).join(" ");
  const second = sentences.slice(Math.floor(sentences.length / 2), Math.floor(sentences.length / 2) + 3).join(" ");
  return [first, second];
}

function makeFlashcards(title, summaryParagraphs) {
  const [p1, p2] = summaryParagraphs;
  return [
    {
      question: `What is the main claim of "${title}"?`,
      answer: p1,
    },
    {
      question: `What concept does "${title}" use to frame design?`,
      answer: p2,
    },
    {
      question: `What debate can this text support in an exam answer?`,
      answer: "Use it to define terms clearly, contrast positions, and defend one side with a concrete conceptual distinction.",
    },
    {
      question: `How does this text connect design to social effects?`,
      answer: "It shows that design decisions shape behavior, interpretation, and power relations, not just technical outcomes.",
    },
    {
      question: `Why is "${title}" relevant for an exam argument?`,
      answer:
        "It gives clear conceptual distinctions, a normative position, and examples that can support short argumentative answers.",
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
