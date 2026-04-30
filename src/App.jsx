import { useMemo, useState } from "react";
import { Link, Navigate, Route, Routes, useParams } from "react-router-dom";
import data from "./data/readings.json";
import "./App.css";

const categories = ["Possible Question Readings", "Pres", "Questions", "Unlikely"];

function Layout({ children }) {
  return (
    <div className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Philosophy of Design</p>
          <h1>Exam Prep Studio</h1>
        </div>
        <nav>
          <Link to="/">Texts</Link>
          <Link to="/questions">Given Questions</Link>
          <Link to="/flashcards">Flashcards</Link>
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
        <section key={category} className="panel">
          <h2>{category}</h2>
          <div className="grid">
            {data.readings
              .filter((reading) => reading.category === category)
              .map((reading) => (
                <Link key={reading.id} className="card" to={`/reading/${reading.id}`}>
                  <h3>{reading.title}</h3>
                  <p>{reading.summary[0]}</p>
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
      <section className="panel">
        <p className="eyebrow">{reading.category}</p>
        <h2>{reading.title}</h2>
        <div className="summary">
          <p>{reading.summary[0]}</p>
          <p>{reading.summary[1]}</p>
        </div>
      </section>
    </Layout>
  );
}

function QuestionsPage() {
  return (
    <Layout>
      {data.givenQuestions.map((question) => (
        <section className="panel" key={question.id}>
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
  const [selected, setSelected] = useState(data.readings[0]?.id ?? "");
  const [activeCard, setActiveCard] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const reading = useMemo(
    () => data.readings.find((item) => item.id === selected) ?? data.readings[0],
    [selected],
  );

  const card = reading.flashcards[activeCard];

  return (
    <Layout>
      <section className="panel">
        <h2>Flashcard Practice</h2>
        <div className="controls">
          <select
            value={reading.id}
            onChange={(event) => {
              setSelected(event.target.value);
              setActiveCard(0);
              setRevealed(false);
            }}
          >
            {data.readings.map((item) => (
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
