import { useMemo, useState } from "react";
import { Link, Navigate, Route, Routes, useParams } from "react-router-dom";
import data from "./data/readings.json";
import "./App.css";

const categories = ["Possible Question Readings", "Pres", "Questions", "Unlikely"];
const byWeek = (a, b) => (a.week ?? 99) - (b.week ?? 99) || a.textName.localeCompare(b.textName);
const previewText = (text) => (text.length > 190 ? `${text.slice(0, 190)}...` : text);

function Layout({ children }) {
  return (
    <div className="shell">
      <header className="topbar">
        <div className="brandWrap">
          <div>
            <p className="eyebrow">Philosophy of Design</p>
            <h1>Exam Prep Studio</h1>
            <a
              className="devTag"
              href="https://github.com/juanzandev"
              target="_blank"
              rel="noreferrer"
            >
              By: juanzandev
            </a>
          </div>
        </div>
        <nav>
          <Link to="/">Texts</Link>
          <Link to="/questions">Given Questions</Link>
          <Link to="/flashcards">Flashcards</Link>
          <a
            className="githubStarBtn"
            href="https://github.com/juanzandev/phil-design-study-site"
            target="_blank"
            rel="noreferrer"
          >
            <span aria-hidden="true">★</span>
            <span>my repository</span>
          </a>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}

function HomePage() {
  return (
    <Layout>
      {categories.map((category) => (
        <section key={category} className="sectionBlock">
          <h2 className="sectionTitle">{category}</h2>
          <div className="grid">
            {data.readings
              .filter((reading) => reading.category === category)
              .sort(byWeek)
              .map((reading) => (
                <Link key={reading.id} className="card" to={`/reading/${reading.id}`}>
                  <h3>{reading.title}</h3>
                  <p>{previewText(reading.summary[0])}</p>
                </Link>
              ))}
          </div>
        </section>
      ))}
    </Layout>
  );
}

function ReadingPage() {
  const { id } = useParams();
  const reading = data.readings.find((item) => item.id === id);
  if (!reading) return <Navigate to="/" replace />;

  return (
    <Layout>
      <section className="sectionBlock readingView">
        <p className="eyebrow">{reading.category}</p>
        <h2>{reading.title}</h2>
        <div className="summary">
          {reading.summary.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
        {reading.keyPoints?.length ? (
          <div className="keyPoints">
            <h3>Key Points</h3>
            <ul>
              {reading.keyPoints.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </Layout>
  );
}

function QuestionsPage() {
  return (
    <Layout>
      {data.givenQuestions.map((question) => (
        <section className="sectionBlock" key={question.id}>
          <h2>{question.question}</h2>
          <p className="synth">{question.synthesizedAnswer}</p>
          <div className="qaList">
            {question.byText.map((item) => {
              const reading = data.readings.find((r) => r.id === item.readingId);
              return (
                <article key={item.readingId} className="qaItem">
                  <h3>{reading?.title ?? item.readingId}</h3>
                  <p>{item.answer}</p>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </Layout>
  );
}

function FlashcardsPage() {
  const sortedReadings = useMemo(() => [...data.readings].sort(byWeek), []);
  const [selected, setSelected] = useState(sortedReadings[0]?.id ?? "");
  const [activeCard, setActiveCard] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [completed, setCompleted] = useState([]);

  const reading = useMemo(
    () => sortedReadings.find((item) => item.id === selected) ?? sortedReadings[0],
    [selected, sortedReadings],
  );

  const card = reading.flashcards[activeCard];
  const progress = Math.round((completed.length / reading.flashcards.length) * 100);

  const goNext = () => {
    setActiveCard((current) => (current + 1) % reading.flashcards.length);
    setRevealed(false);
  };

  const goPrevious = () => {
    setActiveCard((current) => (current - 1 + reading.flashcards.length) % reading.flashcards.length);
    setRevealed(false);
  };

  return (
    <Layout>
      <section className="sectionBlock">
        <h2>Flashcard Practice</h2>
        <p className="flashcardSubtext">Tap card to flip between question and answer.</p>
        <div className="controls">
          <select
            value={reading.id}
            onChange={(event) => {
              setSelected(event.target.value);
              setActiveCard(0);
              setRevealed(false);
              setCompleted([]);
            }}
          >
            {sortedReadings.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
          <div className="chips">
            {reading.flashcards.map((_, index) => (
              <button
                type="button"
                key={index}
                className={index === activeCard ? "chip active" : "chip"}
                onClick={() => {
                  setActiveCard(index);
                  setRevealed(false);
                }}
              >
                Card {index + 1}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          className={revealed ? "flashcard revealed" : "flashcard"}
          onClick={() => setRevealed((current) => !current)}
        >
          <p className="faceLabel">{revealed ? "Answer" : "Question"}</p>
          <p>{revealed ? card.answer : card.question}</p>
        </button>

        <div className="flashcardActions">
          <button type="button" className="ghostBtn" onClick={goPrevious}>
            Previous
          </button>
          <button type="button" className="ghostBtn" onClick={goNext}>
            Next
          </button>
          <button
            type="button"
            className="ghostBtn"
            onClick={() => {
              if (!completed.includes(activeCard)) {
                setCompleted((current) => [...current, activeCard]);
              }
              goNext();
            }}
          >
            Mark Done
          </button>
        </div>
        <div className="progressWrap" aria-label="flashcard progress">
          <div className="progressFill" style={{ width: `${progress}%` }} />
        </div>
        <p className="progressText">
          {completed.length} of {reading.flashcards.length} cards reviewed
        </p>
      </section>
    </Layout>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/reading/:id" element={<ReadingPage />} />
      <Route path="/questions" element={<QuestionsPage />} />
      <Route path="/flashcards" element={<FlashcardsPage />} />
    </Routes>
  );
}
