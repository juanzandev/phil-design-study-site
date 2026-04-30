import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve("..", "Philosophy of Design", "Phil Design");
const TXT_ROOT = path.resolve("src", "data", "pdf-texts");
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

const MANUAL_SUMMARIES = {
  "A Computer Art Form": {
    paragraphs: [
      "Lopes asks whether computer art is just digital art in a new technical format, or a distinct art form with its own criteria. He starts by treating this as a specialization problem: if computer art is a genuine art kind, then works in that kind must share features that matter for appreciation and not only for production. Through examples like Golden Calf, Telegarden, Project X, Boundary Functions, and Kodama, he shows that these works combine familiar artistic materials with computational systems that structure how audiences interact with the work.",
      "The key move in the chapter is the claim that interactivity alone is not enough to define computer art, because many non-computational practices are interactive in some sense. Lopes therefore narrows the account to works where interactivity is computationally constituted: the computer is not a delivery channel but part of the work's form. His working definition links art status, computational execution, and computer-dependent interaction, setting up later chapters to test whether this framework explains the value and identity of computer art better than broader labels like digital art.",
      "He also clarifies why medium claims need to be tied to appreciation, not just technology. A work can include digital displays or software and still belong to older art categories if computation is not doing the decisive aesthetic work. By contrast, in computer art the interactive behavior, rule structure, and audience agency are constitutive features. The chapter therefore lays conceptual groundwork for treating computer art as an identifiable form whose norms and values can be argued about in their own right.",
    ],
    keyPoints: [
      "Lopes treats computer art as an art-kind question, not a hardware question.",
      "He uses concrete interactive works to show recurring formal features.",
      "Interactivity is necessary but must be computationally grounded to be distinctive.",
      "Computer art is defined by how computation structures appreciation, not just display.",
    ],
  },
  "Agency as Art": {
    paragraphs: [
      "Nguyen argues that agency itself can be aesthetically valuable and can be part of what an artwork is designed to produce. Instead of centering only finished objects, he focuses on structures of action: rules, constraints, permissions, and decision spaces that let people perform certain kinds of intentional activity. This moves aesthetic analysis toward practices such as games and interactive systems, where design quality is partly measured by how it shapes skill, commitment, and reflective choice.",
      "A major implication of the essay is that artworks can be evaluated by the form of agency they cultivate. Some works reward shallow optimization, while others support richer practical reasoning, experimentation, and personal style. Nguyen's framework therefore links artistic design to ethics and social life without collapsing one into the other: design decisions influence how people act, what they attend to, and what kinds of selves they can temporarily inhabit through participation.",
      "The text also resists the idea that constraints are necessarily anti-creative. Well-designed constraints can generate meaningful agency by making choices legible, consequential, and expressive. On this view, the aesthetic object is partly the action-profile offered to participants. Nguyen thus expands what counts as artistic achievement: not only what is shown or represented, but also what kinds of practical freedom and self-direction a work makes possible.",
    ],
    keyPoints: [
      "Agency is treated as an aesthetic medium, not just a byproduct.",
      "Design is evaluated by the quality of actions it enables.",
      "Interactive forms (especially games) become central, not peripheral, art cases.",
      "Rules and constraints can expand rather than merely limit expression.",
    ],
  },
  "Technological Determinism": {
    paragraphs: [
      "Hassan and Sutherland present technological determinism as the claim that technological development is the primary driver of social change, often imagined as directional and unavoidable. They position this view against approaches that treat technology and society as mutually shaping, where institutions, politics, economics, and culture influence both design and use. Rather than reducing the debate to slogans, the text maps stronger and weaker forms of determinism and shows why deterministic language remains persuasive in media theory and public discourse.",
      "The paper's value is its conceptual clarification of what is actually being claimed when people say 'technology changes society.' It shows that causal priority, inevitability, and autonomy are distinct theses that are often mixed together. By unpacking these layers, the authors make room for more precise analysis: technologies can constrain and enable action without being socially independent forces, and social structures can co-produce technological trajectories while still being transformed by them.",
      "A central contribution of the reading is methodological: it asks for clearer argument structure before normative conclusions are drawn. Claims about inevitability need historical evidence; claims about causal force need comparison across contexts. This reframing helps explain why the same technology can have different effects in different institutional settings. The text therefore shifts the debate from abstract opposition to a more careful account of co-evolution between technical systems and social arrangements.",
    ],
    keyPoints: [
      "Determinism is analyzed as a family of claims, not a single thesis.",
      "The text contrasts one-way causality with social-shaping models.",
      "It separates inevitability claims from empirical claims about influence.",
      "Conceptual precision is necessary before taking sides in the debate.",
    ],
  },
  Panopticism: {
    paragraphs: [
      "Foucault begins with plague regulations to show a model of power based on partitioning space, fixing individuals in place, and maintaining continuous inspection through record-keeping. From this historical scene he develops panopticism as a general political technology: a way of organizing visibility so that surveillance is constant in principle, whether or not an observer is physically present. The point is not only repression but the production of disciplined subjects through routines, classification, and normalized behavior.",
      "The panopticon becomes for Foucault a diagram of modern power that extends beyond prisons into schools, hospitals, factories, and administrative systems. What matters is the linkage between observation, documentation, and intervention: individuals become knowable cases inside continuous institutional processes. The chapter therefore reframes punishment and control as embedded in everyday social design, where architecture, procedure, and information systems quietly organize conduct.",
      "He contrasts this disciplinary model with older sovereign power centered on visible spectacle and episodic punishment. In disciplinary societies, power becomes continuous, detailed, and productive, shaping habits before overt disobedience occurs. The architectural metaphor is crucial because it shows how social order can be built into environments and routines. Panopticism thus names a broader transformation in how modern institutions manage populations through visibility, normalization, and administrative knowledge.",
    ],
    keyPoints: [
      "Panopticism is a model of power through visibility and internalized discipline.",
      "Foucault ties surveillance to documentation and administrative knowledge.",
      "The plague city is used as a historical prototype for modern control.",
      "The panopticon is a transferable diagram, not only a prison design.",
    ],
  },
  "Design Ethics": {
    paragraphs: [
      "Verbeek argues that technologies are morally mediating rather than neutral instruments. Artifacts shape perception, action, and decision contexts, so ethical analysis must include how technical forms help constitute human-world relations. This perspective critiques simple models where responsibility is located only in individual intention, because design choices pre-structure options and invite specific patterns of behavior.",
      "The essay proposes an ethics of design that tracks mediation across the lifecycle of artifacts: conception, implementation, adoption, and use. Instead of asking whether technology is good or bad in the abstract, Verbeek asks how concrete design configurations redistribute agency, responsibility, and vulnerability. Ethical reflection therefore becomes a practical task inside design itself, requiring anticipation of use scenarios and attention to how artifacts script action.",
      "Rather than dissolving human accountability, this approach reframes it. Designers, institutions, and users remain responsible, but responsibility is exercised within mediated relations that artifacts help organize. The text therefore encourages more explicit normative reflection during design decisions about defaults, affordances, and constraints. Ethics is treated as iterative and situated, tied to concrete human-technology practices rather than fixed external rules.",
    ],
    keyPoints: [
      "Technologies mediate moral experience; they are not neutral channels.",
      "Responsibility is distributed across designers, users, and artifacts.",
      "Ethics must analyze concrete mediation patterns, not abstractions.",
      "Design practice is itself a site of moral decision-making.",
    ],
  },
  "Ethics of Design": {
    paragraphs: [
      "Parsons develops an account of design ethics that integrates functionality, aesthetics, and value consequences. He rejects the idea that ethical criticism is external to design criticism, arguing that judgments about good design already imply claims about wellbeing, inclusion, sustainability, and the quality of shared environments. Design is treated as a norm-governed practice where practical and evaluative dimensions are inseparable.",
      "The text shows how ethical evaluation operates at multiple levels: object-level harms and benefits, systemic effects, and symbolic-cultural meanings. Parsons emphasizes that even ordinary design decisions can encode priorities about users, bodies, and ways of life. This makes ethical reflection continuous rather than exceptional: design standards, material choices, and interface assumptions all participate in shaping social outcomes.",
      "He also draws attention to conflicts among design values, where improving one dimension can undermine another. Ethical analysis therefore requires trade-off reasoning rather than single-metric optimization. By treating design as a public practice with distributive effects, Parsons expands criticism beyond technical performance. The result is a framework in which questions of justice, responsibility, and long-term impact become central to what counts as good design.",
    ],
    keyPoints: [
      "Ethical and aesthetic evaluation in design are intertwined.",
      "Design quality includes social and environmental consequences.",
      "Normative assumptions are built into ordinary design decisions.",
      "Ethics applies across both individual artifacts and wider systems.",
    ],
  },
  "Kant and the Philosophy of Architecture": {
    paragraphs: [
      "Guyer examines Kant's scattered remarks on architecture and places them against the Vitruvian tradition of utility and beauty. He shows that Kant does not give architecture a central role in his formal system, yet his broader theory of fine art strongly influences later debates about what architecture should express. The essay traces how Kant's framework reorients architectural theory toward questions of meaning and idea-presentation without dissolving architecture into pure symbolism.",
      "A core tension in Guyer's reading is the relation between function and aesthetic form in adherent beauty. Kant preserves purposiveness as essential in architecture while allowing aesthetic ideas to contribute to architectural value. Guyer argues that this tension helps explain why post-Kantian thinkers diverge: some emphasize construction and force, others moral content, others metaphysical expression. Kant thus functions as a hinge between classical architectural norms and modern philosophical pluralism.",
      "The essay highlights that Kant's influence operates less through explicit architectural doctrine and more through conceptual tools that later theorists adapt. By insisting that architecture is neither pure utility nor pure free beauty, Kant opens space for mixed judgments that combine use, form, and meaning. Guyer uses this to explain the historical transition from classical criteria to nineteenth-century expressivist approaches. The result is a historically grounded account of why architecture becomes philosophically contentious after Kant.",
    ],
    keyPoints: [
      "Guyer situates Kant between Vitruvian utility and modern expressivism.",
      "Architecture is marginal in Kant's text but central in his legacy.",
      "Adherent beauty links function with aesthetic significance.",
      "Post-Kantian theories diverge by stressing different expressive targets.",
    ],
  },
  "Does Architecture Have an Essence?": {
    paragraphs: [
      "Scruton reviews dominant theories of architecture - functionalism, spatial theories, and proportional or formal theories - to test whether any single doctrine captures the nature of architectural experience. He argues that each theory explains something real but becomes misleading when elevated to an essence. Functional explanations can ignore experience, spatial explanations can become empty abstractions, and purely formal accounts can detach geometry from lived perception.",
      "His broader claim is that architecture must be understood through a richer account of meaning, use, appearance, and judgment. Rather than dissolving criticism into historical relativism, Scruton defends the possibility of evaluative standards: buildings can be better or worse in ways that are reason-giving and publicly discussable. The essay therefore positions architecture as an art that demands both conceptual analysis and cultivated critical attention.",
      "Scruton's method is diagnostic: he reconstructs why influential doctrines attract support, then shows where each one overreaches. This allows him to preserve useful insights without reducing architecture to a single explanatory principle. He insists that criticism requires both descriptive sensitivity and normative discrimination. The text ultimately argues for a plural but disciplined understanding of architecture, where interpretation remains accountable to experience and argument.",
    ],
    keyPoints: [
      "Single-factor theories each capture part of architecture, not its whole.",
      "Functional, spatial, and formal doctrines fail as total explanations.",
      "Scruton defends substantive architectural judgment against relativism.",
      "Architectural criticism requires attention to experience and meaning together.",
    ],
  },
  "The House": {
    paragraphs: [
      "Bachelard develops a phenomenology of domestic space in which the house is treated as a lived and imagined structure rather than a neutral container. Through images of attics, cellars, corners, nests, and thresholds, he explores how intimate spaces organize memory, reverie, and psychic orientation. The house becomes a topology of affect where spatial forms correspond to registers of inner life.",
      "The text's method is poetic-philosophical rather than analytic in a narrow sense: Bachelard reads literary and experiential images to show how inhabitation exceeds physical shelter. Domestic architecture matters because it stabilizes rhythms of solitude, protection, and recollection. His account shifts architectural reflection from external style toward phenomenological depth, showing how material spaces become anchors of imagination and identity.",
      "A recurring theme is the relation between vertical zones of the house and modes of consciousness: elevated spaces invite lightness and projection, while lower spaces gather density, fear, and hidden memory. Bachelard uses this symbolic geography to argue that dwelling is inseparable from daydreaming and narrative self-formation. The house is not just where life occurs; it actively shapes how life is remembered and imagined. This makes domestic space philosophically central to questions of subjectivity.",
    ],
    keyPoints: [
      "The house is interpreted as lived imagination, not mere structure.",
      "Vertical and enclosed spaces (attic/cellar/corner) map psychic functions.",
      "Memory and reverie are spatially organized through habitation.",
      "Bachelard links domestic form to intimacy, identity, and poetic experience.",
    ],
  },
  "The Significance of Architecture": {
    paragraphs: [
      "de Botton argues that architecture shapes emotional life and moral aspiration by making values materially present in everyday environments. Buildings are treated as practical philosophy: they can calm or agitate, ennoble or diminish, and orient people toward specific ideals of order, freedom, dignity, or care. The text blends cultural history with criticism to show how aesthetic judgments are bound to psychological and social needs.",
      "He also critiques modern assumptions that functionality alone settles architectural questions. Even when technical demands are met, built form still communicates attitudes about how life should be lived. Architecture therefore matters not only at monumental scales but in ordinary settings, where design details influence mood, attention, and conduct. The essay frames architectural criticism as an inquiry into the relation between form, feeling, and shared values.",
      "Throughout the text, examples from domestic and public architecture illustrate how taste is tied to identity and aspiration. de Botton argues that people seek in buildings confirmations of desired character traits and social ideals. This gives architecture a pedagogical role: environments can cultivate patience, seriousness, openness, or carelessness. The significance of architecture, in his account, lies in this ongoing interaction between built form, emotional response, and moral imagination.",
    ],
    keyPoints: [
      "Architecture is presented as a carrier of emotional and ethical meaning.",
      "Design influences mood and self-understanding in daily life.",
      "Functional success does not eliminate aesthetic and moral questions.",
      "Ordinary built environments have deep psychological significance.",
    ],
  },
  "Digital Slot Machines and Attentional Scaffolds": {
    paragraphs: [
      "Voinea and coauthors analyze social media platforms as attentional architectures that borrow mechanisms from slot-machine design: variable rewards, intermittent reinforcement, and uncertainty-driven checking. The paper argues that platform interfaces are not passive channels but active scaffolds that train habits of anticipation and return. User engagement is therefore better explained through designed interaction loops than through isolated individual weakness.",
      "By framing platforms as engineered environments, the text links micro-level interface features to macro-level effects on agency, attention, and collective discourse. It emphasizes that design decisions about notifications, feeds, and feedback cues can reshape temporal experience and self-regulation. The analysis supports a normative shift from blaming users to evaluating the responsibility embedded in platform design practices.",
      "The paper also clarifies that attentional scaffolding is not inherently harmful; its effects depend on design goals and governance context. The problem arises when optimization for engagement overrides user autonomy and reflective control. This distinction allows for criticism that is structural rather than moralizing. The argument therefore contributes to broader debates about platform accountability by grounding them in concrete design mechanics.",
    ],
    keyPoints: [
      "Social media is modeled as attentional scaffolding, not neutral communication.",
      "Variable-reward mechanics help explain compulsive engagement patterns.",
      "Interface design redistributes responsibility between users and platforms.",
      "Attention design has ethical and political consequences beyond individual use.",
    ],
  },
  "A Perfect Storm for Epistemic Injustice": {
    paragraphs: [
      "Stewart and collaborators argue that contemporary media systems can generate epistemic injustice by systematically shaping who is heard, believed, and amplified. The paper identifies interacting factors - platform affordances, algorithmic ranking, social identity dynamics, and institutional mistrust - that combine into an environment where testimonial credibility is unevenly distributed. Harm emerges not from one mechanism alone but from their cumulative reinforcement.",
      "The authors show that epistemic injustice in digital contexts is both structural and experiential: marginalized speakers face persistent credibility deficits while dominant narratives receive frictionless circulation. This analysis expands injustice beyond overt exclusion to include design-level conditions that distort recognition and uptake. The result is a framework for understanding media ecosystems as sites where knowledge practices and power relations are co-produced.",
      "An important strength of the paper is its attention to feedback loops: visibility patterns shape trust, trust shapes participation, and participation reshapes visibility. These loops can entrench asymmetries even when no actor explicitly intends injustice. The 'perfect storm' metaphor captures this convergence of technical, social, and political pressures. The text thus explains why remedies require coordinated changes in platform design, moderation practice, and institutional discourse norms.",
    ],
    keyPoints: [
      "Epistemic injustice is produced through interacting platform and social factors.",
      "Credibility distribution online is structurally unequal, not merely accidental.",
      "Algorithmic visibility and social identity jointly shape who is believed.",
      "Media design conditions are central to contemporary knowledge injustice.",
    ],
  },
  "The Acoustic Designer": {
    paragraphs: [
      "Schafer argues that modern environments must be understood and designed as soundscapes, not only as visual or spatial arrangements. He introduces a vocabulary for analyzing sonic environments - keynotes, signals, and soundmarks - to show how collective life is organized through patterns of listening. Industrialization and media technologies transform these patterns, often reducing acoustic diversity and producing forms of sonic overload.",
      "The essay treats listening as a civic and ecological practice. Acoustic design becomes a normative project aimed at restoring balance, legibility, and care in shared auditory space. Rather than accepting noise as an inevitable byproduct of modern life, Schafer proposes that sonic conditions can be intentionally composed, evaluated, and improved, making sound central to debates about quality of life and environmental responsibility.",
      "Schafer combines descriptive analysis with prescriptive intervention: first learning to hear the environment, then redesigning it. This approach reframes environmental awareness as an auditory discipline, where attention to sound reveals hidden social and industrial dynamics. Soundmarks are especially important because they connect place identity to collective memory. The essay ultimately argues for cultural stewardship of listening as part of broader ecological design practice.",
    ],
    keyPoints: [
      "Schafer reframes environment as a designed soundscape.",
      "Keynotes, signals, and soundmarks organize sonic analysis.",
      "Modernity alters auditory life through noise and standardization.",
      "Acoustic design is proposed as a civic and ecological responsibility.",
    ],
  },
  "Architecture and the Senses": {
    paragraphs: [
      "This reading challenges the visual dominance of architectural discourse by insisting that built environments are encountered through the full sensorium. Sound, touch, rhythm, temperature, and movement are treated as integral to how spaces are experienced and interpreted. The argument repositions architecture as embodied world-making rather than image production.",
      "By foregrounding multisensory experience, the text broadens criteria for architectural evaluation. A space can be formally striking yet experientially poor if it neglects acoustic comfort, tactile cues, or bodily orientation. The essay thus supports a more inclusive design perspective in which sensory diversity and lived usability are central to architectural quality.",
      "The reading also implies a methodological shift in architectural criticism: evaluators must attend to duration, movement, and bodily context, not only static visual composition. Sensory hierarchies in design education and practice can obscure how people actually inhabit space. Re-centering touch and sound reveals overlooked dimensions of accessibility and atmosphere. Architecture, on this account, succeeds when it orchestrates coherent multisensory experience rather than merely producing visual impact.",
    ],
    keyPoints: [
      "Architectural experience is multisensory, not primarily visual.",
      "Embodiment is central to how spaces acquire meaning.",
      "Sensory design affects orientation, comfort, and interpretation.",
      "Evaluation should include acoustic and tactile qualities, not only form.",
    ],
  },
};

function toId(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanText(raw) {
  return raw
    .replace(/â|â/g, '"')
    .replace(/â|â/g, "'")
    .replace(/â/g, "-")
    .replace(/Â/g, "")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .replace(/\s+\n/g, "\n")
    .trim();
}

function splitSentences(text) {
  const raw = text
    .replace(/([a-zA-Z])-\s+([a-zA-Z])/g, "$1$2")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 70 && s.length < 320);
  const seen = new Set();
  const deduped = [];
  for (const sentence of raw) {
    const key = sentence.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(sentence);
  }
  return deduped;
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

function buildKeyPoints(scoredSentences) {
  const selected = [...scoredSentences]
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .filter((item) => item.sentence.length > 80 && item.sentence.length < 240)
    .slice(0, 4)
    .sort((a, b) => a.index - b.index)
    .map((item) => item.sentence);
  return selected;
}

function makeSummary(text, title, textName) {
  if (MANUAL_SUMMARIES[textName]) return MANUAL_SUMMARIES[textName];
  const clean = sanitizeForSummary(text);
  const sentences = splitSentences(clean);
  if (sentences.length < 8) {
    const fallbackParagraphs = [
      `${title} examines core questions in philosophy of design by focusing on how form, medium, and interpretation shape meaning. The reading develops conceptual distinctions and uses examples to show how design decisions influence aesthetic and social understanding.`,
      `The text follows a structured argument that clarifies key terms, compares competing positions, and identifies implications for how we evaluate artifacts. Its central contribution is a detailed account of how design frameworks influence perception, judgment, and the relation between practice and theory.`,
    ];
    return { paragraphs: fallbackParagraphs, keyPoints: fallbackParagraphs };
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
  const keyPoints = buildKeyPoints(scored);
  return {
    paragraphs: [firstParagraph, secondParagraph],
    keyPoints,
  };
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

async function readTxtFromExtraction(category, fileName) {
  const txtPath = path.join(TXT_ROOT, category, fileName.replace(/\.pdf$/i, ".txt"));
  const raw = await fs.readFile(txtPath, "utf-8");
  return cleanText(raw);
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
      const text = await readTxtFromExtraction(category, fileName);
      const meta = parseReadingMeta(fileName);
      const summaryObj = makeSummary(text, `${meta.textName} by ${meta.author}`, meta.textName);
      readings.push({
        id: toId(`${category}-${meta.displayTitle}`),
        title: meta.displayTitle,
        textName: meta.textName,
        author: meta.author,
        week: meta.week,
        audioKey: toId(`${meta.textName}-${meta.author}`),
        audioPath: `audio/${toId(`${meta.textName}-${meta.author}`)}.mp3`,
        category,
        fileName,
        summary: summaryObj.paragraphs,
        keyPoints: summaryObj.keyPoints,
        flashcards: makeFlashcards(meta.textName, summaryObj.paragraphs),
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
