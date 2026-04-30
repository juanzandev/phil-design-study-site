import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, Route, Routes, useParams } from "react-router-dom";
import data from "./data/readings.json";
import "./App.css";

const categories = ["Possible Question Readings", "Pres", "Questions", "Unlikely"];
const byWeek = (a, b) => (a.week ?? 99) - (b.week ?? 99) || a.textName.localeCompare(b.textName);
const previewText = (text) => (text.length > 190 ? `${text.slice(0, 190)}...` : text);
const STORAGE = {
  filters: "study_filters",
  bookmarks: "study_bookmarks",
  studied: "study_studied",
  continueId: "study_continue_id",
  textScale: "study_text_scale",
  lineHeight: "study_line_height",
  carAutoplay: "study_car_autoplay",
  carShuffle: "study_car_shuffle",
  carRepeat: "study_car_repeat",
};

const readStored = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
};

const estimateMinutes = (reading) => {
  const words = reading.summary.join(" ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 150));
};

function Layout({
  children,
  selectedCategories,
  setSelectedCategories,
  textScale,
  setTextScale,
  lineHeight,
  setLineHeight,
  studiedCount,
  totalCount,
} = {}) {
  const toggleCategory = (category) => {
    if (!setSelectedCategories) return;
    setSelectedCategories((current) => {
      if (current.includes(category)) return current.filter((c) => c !== category);
      return [...current, category];
    });
  };

  const selectAll = () => {
    if (!setSelectedCategories) return;
    setSelectedCategories(categories);
  };

  return (
    <div className="shell" style={{ fontSize: `${textScale}rem`, lineHeight }}>
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
          <Link to="/car-mode">Car Mode</Link>
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
      <section className="settingsBar" hidden={!setSelectedCategories}>
        <div className="filterGroup">
          <button type="button" className="chip" onClick={selectAll}>
            All sections
          </button>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={selectedCategories.includes(category) ? "chip active" : "chip"}
              onClick={() => toggleCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
        <div className="typeControls">
          <label>
            Text
            <input
              type="range"
              min="0.95"
              max="1.15"
              step="0.01"
              value={textScale}
              onChange={(event) => setTextScale(Number.parseFloat(event.target.value))}
            />
          </label>
          <label>
            Spacing
            <input
              type="range"
              min="1.45"
              max="1.95"
              step="0.01"
              value={lineHeight}
              onChange={(event) => setLineHeight(Number.parseFloat(event.target.value))}
            />
          </label>
          <p className="progressText">
            Studied {studiedCount}/{totalCount}
          </p>
        </div>
      </section>
      <main>{children}</main>
    </div>
  );
}

function HomePage({ readings, selectedCategories, continueReadingId, bookmarks, studied, layoutProps }) {
  const continueReading = readings.find((item) => item.id === continueReadingId);
  const bookmarkedReadings = readings.filter((reading) => bookmarks.has(reading.id));
  return (
    <Layout {...layoutProps}>
      {continueReading ? (
        <section className="sectionBlock">
          <h2 className="sectionTitle">Continue Listening/Reading</h2>
          <Link className="card" to={`/reading/${continueReading.id}`}>
            <h3>{continueReading.title}</h3>
            <p>{previewText(continueReading.summary[0])}</p>
          </Link>
        </section>
      ) : null}
      {bookmarkedReadings.length ? (
        <section className="sectionBlock">
          <h2 className="sectionTitle">Bookmarked</h2>
          <div className="grid">
            {bookmarkedReadings.map((reading) => (
              <Link key={reading.id} className="card" to={`/reading/${reading.id}`}>
                <h3>{reading.title}</h3>
                <p>{previewText(reading.summary[0])}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
      {categories.map((category) => (
        <section key={category} className="sectionBlock" hidden={!selectedCategories.includes(category)}>
          <h2 className="sectionTitle">{category}</h2>
          <div className="grid">
            {readings
              .filter((reading) => reading.category === category)
              .sort(byWeek)
              .map((reading) => (
                <Link key={reading.id} className="card" to={`/reading/${reading.id}`}>
                  <h3>
                    {reading.title}
                    {studied.has(reading.id) ? " ✓" : ""}
                  </h3>
                  <p>{previewText(reading.summary[0])}</p>
                  <p className="readerHint">~{estimateMinutes(reading)} min listen</p>
                </Link>
              ))}
          </div>
        </section>
      ))}
    </Layout>
  );
}

function CustomAudioPlayer({ src, rate, onEnded, onPlayStateChange, audioRef, compact = false }) {
  const internalRef = useRef(null);
  const playerRef = audioRef ?? internalRef;
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const setPlaying = (value) => {
    setIsPlaying(value);
    if (onPlayStateChange) onPlayStateChange(value);
  };

  const togglePlay = async () => {
    if (!playerRef.current) return;
    if (playerRef.current.paused) {
      await playerRef.current.play();
      setPlaying(true);
    } else {
      playerRef.current.pause();
      setPlaying(false);
    }
  };

  const stop = () => {
    if (!playerRef.current) return;
    playerRef.current.pause();
    playerRef.current.currentTime = 0;
    setCurrentTime(0);
    setPlaying(false);
  };

  const seekTo = (event) => {
    if (!playerRef.current) return;
    const value = Number.parseFloat(event.target.value);
    playerRef.current.currentTime = value;
    setCurrentTime(value);
  };

  const skip = (delta) => {
    if (!playerRef.current) return;
    const next = Math.min(Math.max(playerRef.current.currentTime + delta, 0), duration || 0);
    playerRef.current.currentTime = next;
    setCurrentTime(next);
  };

  return (
    <div className={compact ? "customAudio compact" : "customAudio"}>
      <audio
        ref={playerRef}
        preload="metadata"
        src={src}
        onEnded={() => {
          setPlaying(false);
          if (onEnded) onEnded();
        }}
        onLoadedMetadata={(event) => {
          event.currentTarget.playbackRate = Number.parseFloat(rate);
          setDuration(event.currentTarget.duration || 0);
        }}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime || 0)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <div className="customAudioButtons">
        <button type="button" className="ghostBtn" onClick={() => skip(-10)}>
          -10s
        </button>
        <button type="button" className="ghostBtn" onClick={togglePlay}>
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button type="button" className="ghostBtn" onClick={stop}>
          Stop
        </button>
        <button type="button" className="ghostBtn" onClick={() => skip(10)}>
          +10s
        </button>
      </div>
      <div className="customAudioTimeline">
        <span>{formatTime(currentTime)}</span>
        <input
          type="range"
          min="0"
          max={duration || 0}
          step="0.1"
          value={Math.min(currentTime, duration || 0)}
          onChange={seekTo}
        />
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}

function SummaryReader({ audioPath }) {
  const [rate, setRate] = useState("1");
  const audioRef = useRef(null);
  const source = `${import.meta.env.BASE_URL}${audioPath}`;
  return (
    <div className="audioReader">
      <h3>Listen to Summary</h3>
      <div className="readerControls">
        <label>
          Speed
          <select
            value={rate}
            onChange={(event) => {
              const next = event.target.value;
              setRate(next);
              if (audioRef.current) audioRef.current.playbackRate = Number.parseFloat(next);
            }}
          >
            <option value="1">1.0x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="1.75">1.75x</option>
            <option value="2">2.0x</option>
          </select>
        </label>
      </div>
      <CustomAudioPlayer
        key={source}
        audioRef={audioRef}
        src={source}
        rate={rate}
      />
      <p className="readerHint">OpenAI neural voice audio for this summary.</p>
    </div>
  );
}

function ReadingPage({ readings, bookmarks, toggleBookmark, studied, toggleStudied, setContinueReadingId, layoutProps }) {
  const { id } = useParams();
  const reading = readings.find((item) => item.id === id);
  useEffect(() => {
    if (reading) setContinueReadingId(reading.id);
  }, [reading, setContinueReadingId]);
  if (!reading) return <Navigate to="/" replace />;

  return (
    <Layout {...layoutProps}>
      <section className="sectionBlock readingView">
        <p className="eyebrow">{reading.category}</p>
        <h2>{reading.title}</h2>
        <div className="metaRow">
          <button type="button" className={bookmarks.has(reading.id) ? "chip active" : "chip"} onClick={() => toggleBookmark(reading.id)}>
            {bookmarks.has(reading.id) ? "Bookmarked" : "Bookmark"}
          </button>
          <button type="button" className={studied.has(reading.id) ? "chip active" : "chip"} onClick={() => toggleStudied(reading.id)}>
            {studied.has(reading.id) ? "Studied" : "Mark studied"}
          </button>
          <p className="readerHint">Estimated listen: ~{estimateMinutes(reading)} min</p>
        </div>
        <div className="summary">
          {reading.summary.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
        <SummaryReader audioPath={reading.audioPath} />
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

function QuestionsPage({ readings, layoutProps }) {
  const allowedIds = new Set(readings.map((reading) => reading.id));
  return (
    <Layout {...layoutProps}>
      {data.givenQuestions.map((question) => (
        <section className="sectionBlock" key={question.id}>
          <h2>{question.question}</h2>
          <p className="synth">{question.synthesizedAnswer}</p>
          <div className="qaList">
            {question.byText.filter((item) => allowedIds.has(item.readingId)).map((item) => {
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

function FlashcardsPage({ readings, layoutProps }) {
  const sortedReadings = useMemo(() => {
    const unique = [];
    const seenTitles = new Set();
    for (const reading of [...readings].sort(byWeek)) {
      if (seenTitles.has(reading.title)) continue;
      seenTitles.add(reading.title);
      unique.push(reading);
    }
    return unique;
  }, [readings]);
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
    <Layout {...layoutProps}>
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
          <p className="cardCounter" aria-live="polite">
            {activeCard + 1}/{reading.flashcards.length}
          </p>
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

function CarModePage({ readings, carAutoplay, setCarAutoplay, carShuffle, setCarShuffle, carRepeat, setCarRepeat, layoutProps }) {
  const playlist = useMemo(() => {
    const unique = [];
    const seenAudio = new Set();
    for (const reading of [...readings].sort(byWeek)) {
      if (seenAudio.has(reading.audioPath)) continue;
      seenAudio.add(reading.audioPath);
      unique.push(reading);
    }
    return unique;
  }, [readings]);

  const [index, setIndex] = useState(0);
  const [rate, setRate] = useState("1");
  const audioRef = useRef(null);
  const shouldAutoPlayNext = useRef(false);

  const current = playlist[index];
  const currentSrc = `${import.meta.env.BASE_URL}${current.audioPath}`;

  const goNext = () => {
    shouldAutoPlayNext.current = Boolean(audioRef.current && !audioRef.current.paused);
    setIndex((currentIndex) => {
      if (carShuffle && playlist.length > 1) {
        let next = currentIndex;
        while (next === currentIndex) next = Math.floor(Math.random() * playlist.length);
        return next;
      }
      const atEnd = currentIndex >= playlist.length - 1;
      if (atEnd && carRepeat === "off") return currentIndex;
      if (atEnd && carRepeat === "all") return 0;
      return currentIndex + 1;
    });
  };

  const goPrev = () => {
    shouldAutoPlayNext.current = Boolean(audioRef.current && !audioRef.current.paused);
    setIndex((currentIndex) => (currentIndex - 1 + playlist.length) % playlist.length);
  };

  useEffect(() => {
    if (!audioRef.current) return;
    if (!shouldAutoPlayNext.current) return;
    shouldAutoPlayNext.current = false;
    audioRef.current.play().catch(() => {});
  }, [index]);

  const handleTrackEnd = () => {
    if (!carAutoplay) return;
    if (carRepeat === "one" && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
      return;
    }
    shouldAutoPlayNext.current = true;
    setIndex((currentIndex) => {
      if (carShuffle && playlist.length > 1) {
        let next = currentIndex;
        while (next === currentIndex) next = Math.floor(Math.random() * playlist.length);
        return next;
      }
      const atEnd = currentIndex >= playlist.length - 1;
      if (atEnd && carRepeat === "off") return currentIndex;
      if (atEnd && carRepeat === "all") return 0;
      return currentIndex + 1;
    });
  };

  return (
    <Layout {...layoutProps}>
      <section className="sectionBlock carMode">
        <p className="eyebrow">Drive-Friendly Player</p>
        <h2>Car Mode</h2>

        <div className="carNowPlaying">
          <p className="carLabel">Now Playing</p>
          <h3>{current.title}</h3>
          <p className="readerHint">
            Track {index + 1} of {playlist.length}
          </p>
        </div>

        <CustomAudioPlayer
          key={currentSrc}
          audioRef={audioRef}
          src={currentSrc}
          rate={rate}
          onEnded={handleTrackEnd}
        />

        <div className="carControls">
          <button type="button" className="carBtn" onClick={goPrev}>
            ◀◀
          </button>
          <button type="button" className="carBtn" onClick={goNext}>
            ▶▶
          </button>
          <select
            value={rate}
            onChange={(event) => {
              const next = event.target.value;
              setRate(next);
              if (audioRef.current) audioRef.current.playbackRate = Number.parseFloat(next);
            }}
          >
            <option value="1">1.0x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="1.75">1.75x</option>
            <option value="2">2.0x</option>
          </select>
          <button type="button" className={carAutoplay ? "chip active" : "chip"} onClick={() => setCarAutoplay((v) => !v)}>
            Autoplay {carAutoplay ? "On" : "Off"}
          </button>
          <button type="button" className={carShuffle ? "chip active" : "chip"} onClick={() => setCarShuffle((v) => !v)}>
            Shuffle {carShuffle ? "On" : "Off"}
          </button>
          <select value={carRepeat} onChange={(event) => setCarRepeat(event.target.value)}>
            <option value="off">Repeat off</option>
            <option value="one">Repeat one</option>
            <option value="all">Repeat all</option>
          </select>
        </div>

        <div className="carQueue">
          {playlist.map((item, itemIndex) => (
            <button
              key={item.id}
              type="button"
              className={itemIndex === index ? "queueItem active" : "queueItem"}
              onClick={() => setIndex(itemIndex)}
            >
              {item.title}
            </button>
          ))}
        </div>
      </section>
    </Layout>
  );
}

export default function App() {
  const [selectedCategories, setSelectedCategories] = useState(() => readStored(STORAGE.filters, categories));
  const [bookmarks, setBookmarks] = useState(() => new Set(readStored(STORAGE.bookmarks, [])));
  const [studied, setStudied] = useState(() => new Set(readStored(STORAGE.studied, [])));
  const [continueReadingId, setContinueReadingId] = useState(() => readStored(STORAGE.continueId, null));
  const [textScale, setTextScale] = useState(() => readStored(STORAGE.textScale, 1));
  const [lineHeight, setLineHeight] = useState(() => readStored(STORAGE.lineHeight, 1.72));
  const [carAutoplay, setCarAutoplay] = useState(() => readStored(STORAGE.carAutoplay, true));
  const [carShuffle, setCarShuffle] = useState(() => readStored(STORAGE.carShuffle, false));
  const [carRepeat, setCarRepeat] = useState(() => readStored(STORAGE.carRepeat, "all"));

  useEffect(() => localStorage.setItem(STORAGE.filters, JSON.stringify(selectedCategories)), [selectedCategories]);
  useEffect(() => localStorage.setItem(STORAGE.bookmarks, JSON.stringify([...bookmarks])), [bookmarks]);
  useEffect(() => localStorage.setItem(STORAGE.studied, JSON.stringify([...studied])), [studied]);
  useEffect(() => localStorage.setItem(STORAGE.continueId, JSON.stringify(continueReadingId)), [continueReadingId]);
  useEffect(() => localStorage.setItem(STORAGE.textScale, JSON.stringify(textScale)), [textScale]);
  useEffect(() => localStorage.setItem(STORAGE.lineHeight, JSON.stringify(lineHeight)), [lineHeight]);
  useEffect(() => localStorage.setItem(STORAGE.carAutoplay, JSON.stringify(carAutoplay)), [carAutoplay]);
  useEffect(() => localStorage.setItem(STORAGE.carShuffle, JSON.stringify(carShuffle)), [carShuffle]);
  useEffect(() => localStorage.setItem(STORAGE.carRepeat, JSON.stringify(carRepeat)), [carRepeat]);

  const filteredReadings = useMemo(
    () => data.readings.filter((reading) => selectedCategories.includes(reading.category)),
    [selectedCategories],
  );

  const layoutProps = {
    selectedCategories,
    setSelectedCategories,
    textScale,
    setTextScale,
    lineHeight,
    setLineHeight,
    studiedCount: studied.size,
    totalCount: data.readings.length,
  };

  const toggleBookmark = (id) =>
    setBookmarks((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleStudied = (id) =>
    setStudied((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <Routes>
      <Route
        path="/"
        element={
          <HomePage
            readings={filteredReadings}
            selectedCategories={selectedCategories}
            continueReadingId={continueReadingId}
            bookmarks={bookmarks}
            studied={studied}
            layoutProps={layoutProps}
          />
        }
      />
      <Route
        path="/reading/:id"
        element={
          <ReadingPage
            readings={filteredReadings.length ? filteredReadings : data.readings}
            bookmarks={bookmarks}
            toggleBookmark={toggleBookmark}
            studied={studied}
            toggleStudied={toggleStudied}
            setContinueReadingId={setContinueReadingId}
            layoutProps={layoutProps}
          />
        }
      />
      <Route path="/questions" element={<QuestionsPage readings={filteredReadings} layoutProps={layoutProps} />} />
      <Route
        path="/flashcards"
        element={<FlashcardsPage readings={filteredReadings.length ? filteredReadings : data.readings} layoutProps={layoutProps} />}
      />
      <Route
        path="/car-mode"
        element={
          <CarModePage
            readings={filteredReadings.length ? filteredReadings : data.readings}
            carAutoplay={carAutoplay}
            setCarAutoplay={setCarAutoplay}
            carShuffle={carShuffle}
            setCarShuffle={setCarShuffle}
            carRepeat={carRepeat}
            setCarRepeat={setCarRepeat}
            layoutProps={layoutProps}
          />
        }
      />
    </Routes>
  );
}
