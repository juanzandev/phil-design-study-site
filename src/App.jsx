import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, Navigate, Route, Routes, useParams } from "react-router-dom";
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
  controlsOpen: "study_controls_open",
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

function Toasts({ items, removeToast }) {
  return (
    <div className="toastWrap" aria-live="polite" aria-atomic="true">
      {items.map((item) => (
        <div key={item.id} className="toastItem">
          {item.text}
          <button type="button" onClick={() => removeToast(item.id)} aria-label="Dismiss notification">
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

function SkeletonBlocks({ count = 3 }) {
  return (
    <section className="sectionBlock">
      <div className="skeletonTitle" />
      <div className="grid">
        {Array.from({ length: count }).map((_, index) => (
          <article key={index} className="skeletonCard">
            <div className="skeletonLine short" />
            <div className="skeletonLine" />
            <div className="skeletonLine" />
          </article>
        ))}
      </div>
    </section>
  );
}

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
  controlsOpen,
  setControlsOpen,
  hideChrome = false,
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
      <header className="topbar" hidden={hideChrome}>
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
          <NavLink to="/" end>
            Texts
          </NavLink>
          <NavLink to="/questions">Given Questions</NavLink>
          <NavLink to="/flashcards">Flashcards</NavLink>
          <NavLink to="/car-mode">Car Mode</NavLink>
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
      <section className="settingsBar" hidden={!setSelectedCategories || hideChrome} data-open={controlsOpen}>
        <button type="button" className="controlsToggle" onClick={() => setControlsOpen((value) => !value)}>
          {controlsOpen ? "Hide Study Controls" : "Show Study Controls"}
        </button>
        <div className="settingsBody" hidden={!controlsOpen}>
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
        </div>
      </section>
      <main>{children}</main>
    </div>
  );
}

function HomePage({ readings, selectedCategories, continueReadingId, bookmarks, studied, layoutProps, booting }) {
  const continueReading = readings.find((item) => item.id === continueReadingId);
  const bookmarkedReadings = readings.filter((reading) => bookmarks.has(reading.id));
  const byCategoryProgress = useMemo(
    () =>
      categories.map((category) => {
        const inCategory = readings.filter((reading) => reading.category === category);
        const done = inCategory.filter((reading) => studied.has(reading.id)).length;
        const percent = inCategory.length ? Math.round((done / inCategory.length) * 100) : 0;
        return { category, done, total: inCategory.length, percent };
      }),
    [readings, studied],
  );

  return (
    <Layout {...layoutProps}>
      {booting ? <SkeletonBlocks /> : null}
      {selectedCategories.length === 0 ? (
        <section className="sectionBlock emptyState">
          <h2>All sections hidden</h2>
          <p>Select at least one section in Study Controls to see readings.</p>
        </section>
      ) : null}
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
      {!bookmarkedReadings.length ? (
        <section className="sectionBlock emptyState">
          <h2>No bookmarks yet</h2>
          <p>Open any reading and press Bookmark to pin it here.</p>
        </section>
      ) : null}
      {categories.map((category) => (
        <section key={category} className="sectionBlock" hidden={!selectedCategories.includes(category)}>
          <h2 className="sectionTitle">{category}</h2>
          <p className="progressText">
            {byCategoryProgress.find((item) => item.category === category)?.done ?? 0}/
            {byCategoryProgress.find((item) => item.category === category)?.total ?? 0} studied
          </p>
          <div className="progressWrap tiny">
            <div
              className="progressFill"
              style={{ width: `${byCategoryProgress.find((item) => item.category === category)?.percent ?? 0}%` }}
            />
          </div>
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

function CustomAudioPlayer({ src, rate, onEnded, onPlayStateChange, audioRef, compact = false, largeButtons = false }) {
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
      <div className={largeButtons ? "customAudioButtons large" : "customAudioButtons"}>
        <button type="button" className="ghostBtn" onClick={() => skip(-10)} aria-label="Back 10 seconds">
          -10s
        </button>
        <button type="button" className="ghostBtn" onClick={togglePlay} aria-label={isPlaying ? "Pause" : "Play"}>
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button type="button" className="ghostBtn" onClick={stop} aria-label="Stop and reset">
          Stop
        </button>
        <button type="button" className="ghostBtn" onClick={() => skip(10)} aria-label="Forward 10 seconds">
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
        largeButtons
      />
      <p className="readerHint">OpenAI neural voice audio for this summary.</p>
    </div>
  );
}

function ReadingPage({
  readings,
  bookmarks,
  toggleBookmark,
  studied,
  toggleStudied,
  setContinueReadingId,
  layoutProps,
  pushToast,
  setMiniQueueFromSingle,
}) {
  const { id } = useParams();
  const [focusMode, setFocusMode] = useState(false);
  const reading = readings.find((item) => item.id === id);
  useEffect(() => {
    if (reading) setContinueReadingId(reading.id);
  }, [reading, setContinueReadingId]);
  if (!reading) return <Navigate to="/" replace />;
  return (
    <Layout {...layoutProps} hideChrome={focusMode}>
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
          <button
            type="button"
            className={focusMode ? "chip active" : "chip"}
            onClick={() => setFocusMode((value) => !value)}
          >
            {focusMode ? "Exit focus" : "Focus mode"}
          </button>
          <button
            type="button"
            className="chip"
            onClick={() => {
              setMiniQueueFromSingle(reading);
              pushToast(`Mini player ready: ${reading.textName}`);
            }}
          >
            Send to mini player
          </button>
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

function QuestionsPage({ readings, layoutProps, booting }) {
  const allowedIds = new Set(readings.map((reading) => reading.id));
  const hasAny = data.givenQuestions.some((question) => question.byText.some((item) => allowedIds.has(item.readingId)));
  return (
    <Layout {...layoutProps}>
      {booting ? <SkeletonBlocks count={2} /> : null}
      {!hasAny ? (
        <section className="sectionBlock emptyState">
          <h2>No question matches</h2>
          <p>Change section filters to include readings linked to these questions.</p>
        </section>
      ) : null}
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

function FlashcardsPage({ readings, layoutProps, booting, pushToast }) {
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
  const [ratings, setRatings] = useState({});

  const reading = useMemo(
    () => sortedReadings.find((item) => item.id === selected) ?? sortedReadings[0],
    [selected, sortedReadings],
  );
  const totalCards = reading?.flashcards?.length ?? 0;
  const card = reading?.flashcards?.[activeCard] ?? null;
  const progress = totalCards ? Math.round((completed.length / totalCards) * 100) : 0;
  const ratedCount = Object.keys(ratings).length;

  const goNext = useCallback(() => {
    if (!totalCards) return;
    setActiveCard((current) => (current + 1) % totalCards);
    setRevealed(false);
  }, [totalCards]);

  const goPrevious = useCallback(() => {
    if (!totalCards) return;
    setActiveCard((current) => (current - 1 + totalCards) % totalCards);
    setRevealed(false);
  }, [totalCards]);

  useEffect(() => {
    const handler = (event) => {
      if (event.target && ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName)) return;
      if (event.code === "Space") {
        event.preventDefault();
        setRevealed((current) => !current);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrevious();
      } else if (event.key.toLowerCase() === "m") {
        event.preventDefault();
        if (!completed.includes(activeCard)) setCompleted((current) => [...current, activeCard]);
        goNext();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeCard, completed, goNext, goPrevious]);

  const rateCard = (rating) => {
    setRatings((current) => ({ ...current, [activeCard]: rating }));
    if (!completed.includes(activeCard)) setCompleted((current) => [...current, activeCard]);
    pushToast(`Card rated: ${rating}`);
    goNext();
  };

  return (
    <Layout {...layoutProps}>
      {booting ? <SkeletonBlocks count={1} /> : null}
      {!reading ? (
        <section className="sectionBlock emptyState">
          <h2>No flashcards in this filter</h2>
          <p>Pick more sections in Study Controls to practice flashcards.</p>
        </section>
      ) : (
        <section className="sectionBlock">
        <h2>Flashcard Practice</h2>
        <p className="flashcardSubtext">Tap to flip. Shortcuts: Space flip, Left/Right navigate, M mark done.</p>
        <div className="controls">
          <select
            value={reading.id}
            onChange={(event) => {
              setSelected(event.target.value);
              setActiveCard(0);
              setRevealed(false);
              setCompleted([]);
              setRatings({});
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
          <p>{revealed ? card?.answer : card?.question}</p>
        </button>

        <div className="flashcardActions">
          <button type="button" className="ghostBtn" onClick={goPrevious}>
            Previous
          </button>
          <p className="cardCounter" aria-live="polite">
            {activeCard + 1}/{totalCards}
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
              pushToast("Marked card done");
              goNext();
            }}
          >
            Mark Done
          </button>
        </div>
        <div className="ratingRow">
          {["Again", "Hard", "Good", "Easy"].map((rating) => (
            <button key={rating} type="button" className="chip" onClick={() => rateCard(rating)}>
              {rating}
            </button>
          ))}
        </div>
        <div className="progressWrap" aria-label="flashcard progress">
          <div className="progressFill" style={{ width: `${progress}%` }} />
        </div>
        <p className="progressText">
          {completed.length} of {totalCards} reviewed · {ratedCount} confidence ratings
        </p>
        </section>
      )}
    </Layout>
  );
}

function CarModePage({
  readings,
  carAutoplay,
  setCarAutoplay,
  carShuffle,
  setCarShuffle,
  carRepeat,
  setCarRepeat,
  layoutProps,
  pushToast,
  setMiniQueue,
}) {
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
  const [completedTracks, setCompletedTracks] = useState([]);
  const audioRef = useRef(null);
  const shouldAutoPlayNext = useRef(false);

  const current = playlist[index];
  const currentSrc = current ? `${import.meta.env.BASE_URL}${current.audioPath}` : "";

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
    setCompletedTracks((current) => (current.includes(index) ? current : [...current, index]));
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
      {!playlist.length ? (
        <section className="sectionBlock emptyState">
          <h2>No tracks in this filter</h2>
          <p>Enable more sections to build a playable car mode queue.</p>
        </section>
      ) : null}
      {playlist.length ? (
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
          largeButtons
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
          <button
            type="button"
            className="chip"
            onClick={() => {
              setMiniQueue(playlist, index, rate);
              pushToast("Car queue sent to mini player");
            }}
          >
            Open mini player
          </button>
          <button type="button" className="chip" onClick={() => setCompletedTracks([])}>
            Clear completed
          </button>
        </div>

        <div className="carQueue">
          {playlist.map((item, itemIndex) => (
            <div key={item.id} className="queueRow">
              <button
                type="button"
                className={itemIndex === index ? "queueItem active" : "queueItem"}
                onClick={() => setIndex(itemIndex)}
              >
                {item.title} {completedTracks.includes(itemIndex) ? "✓" : ""}
              </button>
              <button type="button" className="chip" onClick={() => setIndex(itemIndex)}>
                Play
              </button>
              <button
                type="button"
                className="chip"
                onClick={() => {
                  setIndex(itemIndex);
                  shouldAutoPlayNext.current = true;
                  pushToast("Play from here");
                }}
              >
                Play from here
              </button>
              <button
                type="button"
                className="chip"
                onClick={() => {
                  const selected = playlist[itemIndex];
                  const reordered = [selected, ...playlist.filter((entry) => entry.id !== selected.id)];
                  const inOrder = reordered.map((entry) => entry.id);
                  const actual = readings
                    .filter((reading) => inOrder.includes(reading.id))
                    .sort((a, b) => inOrder.indexOf(a.id) - inOrder.indexOf(b.id));
                  setMiniQueue(actual, 0, rate);
                  pushToast("Moved track to top in mini queue");
                }}
              >
                Move to top
              </button>
            </div>
          ))}
        </div>
      </section>
      ) : null}
    </Layout>
  );
}

function MiniPlayerDock({ queue, index, setIndex, rate, setRate, isPlaying, setIsPlaying }) {
  const audioRef = useRef(null);
  const current = queue[index];
  const src = current ? `${import.meta.env.BASE_URL}${current.audioPath}` : "";

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = Number.parseFloat(rate);
  }, [rate, src]);

  if (!current) return null;

  return (
    <aside className="miniDock">
      <p className="carLabel">Mini Player</p>
      <strong>{current.title}</strong>
      <div className="miniDockControls">
        <button
          type="button"
          className="chip"
          onClick={async () => {
            if (!audioRef.current) return;
            if (audioRef.current.paused) {
              await audioRef.current.play();
              setIsPlaying(true);
            } else {
              audioRef.current.pause();
              setIsPlaying(false);
            }
          }}
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button type="button" className="chip" onClick={() => setIndex((value) => (value - 1 + queue.length) % queue.length)}>
          Prev
        </button>
        <button type="button" className="chip" onClick={() => setIndex((value) => (value + 1) % queue.length)}>
          Next
        </button>
        <select value={rate} onChange={(event) => setRate(event.target.value)}>
          <option value="1">1.0x</option>
          <option value="1.25">1.25x</option>
          <option value="1.5">1.5x</option>
          <option value="1.75">1.75x</option>
          <option value="2">2.0x</option>
        </select>
      </div>
      <audio
        key={src}
        ref={audioRef}
        src={src}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIndex((value) => (value + 1) % queue.length)}
      />
    </aside>
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
  const [controlsOpen, setControlsOpen] = useState(() => readStored(STORAGE.controlsOpen, true));
  const [booting, setBooting] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [miniQueue, setMiniQueue] = useState([]);
  const [miniIndex, setMiniIndex] = useState(0);
  const [miniRate, setMiniRate] = useState("1");
  const [miniPlaying, setMiniPlaying] = useState(false);

  useEffect(() => localStorage.setItem(STORAGE.filters, JSON.stringify(selectedCategories)), [selectedCategories]);
  useEffect(() => localStorage.setItem(STORAGE.bookmarks, JSON.stringify([...bookmarks])), [bookmarks]);
  useEffect(() => localStorage.setItem(STORAGE.studied, JSON.stringify([...studied])), [studied]);
  useEffect(() => localStorage.setItem(STORAGE.continueId, JSON.stringify(continueReadingId)), [continueReadingId]);
  useEffect(() => localStorage.setItem(STORAGE.textScale, JSON.stringify(textScale)), [textScale]);
  useEffect(() => localStorage.setItem(STORAGE.lineHeight, JSON.stringify(lineHeight)), [lineHeight]);
  useEffect(() => localStorage.setItem(STORAGE.carAutoplay, JSON.stringify(carAutoplay)), [carAutoplay]);
  useEffect(() => localStorage.setItem(STORAGE.carShuffle, JSON.stringify(carShuffle)), [carShuffle]);
  useEffect(() => localStorage.setItem(STORAGE.carRepeat, JSON.stringify(carRepeat)), [carRepeat]);
  useEffect(() => localStorage.setItem(STORAGE.controlsOpen, JSON.stringify(controlsOpen)), [controlsOpen]);
  useEffect(() => {
    const timeout = window.setTimeout(() => setBooting(false), 450);
    return () => window.clearTimeout(timeout);
  }, []);

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
    controlsOpen,
    setControlsOpen,
  };

  const pushToast = (text) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, text }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 2200);
  };

  const removeToast = (id) => setToasts((current) => current.filter((item) => item.id !== id));

  const toggleBookmark = (id) =>
    setBookmarks((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      pushToast(next.has(id) ? "Bookmarked reading" : "Removed bookmark");
      return next;
    });

  const toggleStudied = (id) =>
    setStudied((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      pushToast(next.has(id) ? "Marked studied" : "Marked unstudied");
      return next;
    });

  const setMiniQueueFromSingle = (reading) => {
    setMiniQueue([reading]);
    setMiniIndex(0);
    setMiniRate("1");
  };

  const setMiniQueueFromCar = (queue, index = 0, rate = "1") => {
    setMiniQueue(queue);
    setMiniIndex(index);
    setMiniRate(rate);
  };

  return (
    <>
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
              booting={booting}
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
              pushToast={pushToast}
              setMiniQueueFromSingle={setMiniQueueFromSingle}
            />
          }
        />
        <Route path="/questions" element={<QuestionsPage readings={filteredReadings} layoutProps={layoutProps} booting={booting} />} />
        <Route
          path="/flashcards"
          element={
            <FlashcardsPage
              readings={filteredReadings.length ? filteredReadings : data.readings}
              layoutProps={layoutProps}
              booting={booting}
              pushToast={pushToast}
            />
          }
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
              pushToast={pushToast}
              setMiniQueue={setMiniQueueFromCar}
            />
          }
        />
      </Routes>
      <MiniPlayerDock
        queue={miniQueue}
        index={miniIndex}
        setIndex={setMiniIndex}
        rate={miniRate}
        setRate={setMiniRate}
        isPlaying={miniPlaying}
        setIsPlaying={setMiniPlaying}
      />
      <Toasts items={toasts} removeToast={removeToast} />
    </>
  );
}
