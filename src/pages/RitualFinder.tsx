import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { PRODUCT_INDEX } from "../data/products";
import { addCartItem, readCart, subscribeToCart, writeCart, type CartItem } from "../utils/cartStorage";
import type { Product } from "../types/product";

interface RitualArchetype {
  id: string;
  title: string;
  summary: string;
  mantra: string;
  products: number[];
  phases: string[];
}

const RITUAL_ARCHETYPES: Record<string, RitualArchetype> = {
  calm: {
    id: "calm",
    title: "Calm & Restore Ritual",
    summary: "Wrap fragile skin in chamomile steam, buttery hydration, and soothing scalp renewal.",
    mantra: "Slow breathing, linen towels, candlelit steam.",
    products: [2, 3, 5],
    phases: [
      "Gentle neroli cleanse to quiet irritation.",
      "Butter veil massage to seal in moisture.",
      "Crown nourishment for roots stressed by the day.",
    ],
  },
  glow: {
    id: "glow",
    title: "Nile Glow Ritual",
    summary: "Polish dullness with soft exfoliation, cushion moisture, and finish with a mirror gloss.",
    mantra: "Luminous oils, long strokes, radiant energy.",
    products: [1, 3, 6],
    phases: [
      "Radiance cleanse to sweep away the day.",
      "Body balm layering for plush suppleness.",
      "Cuticle-sealing finisher for hair + décolletage gleam.",
    ],
  },
  strength: {
    id: "strength",
    title: "Root Strength Ritual",
    summary: "Fortify from scalp to fingertips with rosemary stimulation and restorative balms.",
    mantra: "Focused massage, rooted posture, confident lift.",
    products: [2, 4, 5],
    phases: [
      "Grounding cleanse that calms while awakening.",
      "Hand armor to protect against daily wear.",
      "Scalp elixir to encourage resilient growth.",
    ],
  },
};

type ScoreMap = Record<string, number>;

interface QuestionOption {
  value: string;
  label: string;
  helper: string;
  scores: ScoreMap;
}

interface Question {
  id: string;
  title: string;
  description: string;
  options: QuestionOption[];
}

const QUESTIONS: Question[] = [
  {
    id: "skinFeel",
    title: "How does your skin feel tonight?",
    description: "Choose the mood that best matches your body and scalp.",
    options: [
      {
        value: "stressed",
        label: "Stressed or sensitized",
        helper: "Needs calm, hush, and barrier repair.",
        scores: { calm: 3, strength: 1 },
      },
      {
        value: "dull",
        label: "A little dull or flat",
        helper: "Craves luminosity and gentle polishing.",
        scores: { glow: 3 },
      },
      {
        value: "tired",
        label: "Tired but strong",
        helper: "Wants strength and circulation.",
        scores: { strength: 3, calm: 1 },
      },
    ],
  },
  {
    id: "finish",
    title: "What finish makes you feel most confident?",
    description: "Focus on the texture you want to carry into tomorrow.",
    options: [
      {
        value: "velvet",
        label: "Velvet-matte comfort",
        helper: "Soft touch, breathable, never sticky.",
        scores: { calm: 2, strength: 1 },
      },
      {
        value: "gloss",
        label: "Glass-like radiance",
        helper: "Sheen, glow, editorial polish.",
        scores: { glow: 3 },
      },
      {
        value: "lift",
        label: "Toned + lifted energy",
        helper: "Responsive, invigorated, uplifted.",
        scores: { strength: 3 },
      },
    ],
  },
  {
    id: "time",
    title: "How much time can you devote?",
    description: "All rituals are indulgent, but cadence matters.",
    options: [
      {
        value: "express",
        label: "Express (under 5 minutes)",
        helper: "Quick resets between calls and commitments.",
        scores: { strength: 2 },
      },
      {
        value: "unwind",
        label: "Unwind (10–15 minutes)",
        helper: "A considered nightly exhale.",
        scores: { calm: 2, glow: 1 },
      },
      {
        value: "indulge",
        label: "Indulge (20+ minutes)",
        helper: "Long soaks, playlists, notebooks.",
        scores: { glow: 2, calm: 1 },
      },
    ],
  },
  {
    id: "scent",
    title: "Which aromatic mood center you?",
    description: "Scent is the story your ritual tells.",
    options: [
      {
        value: "botanical",
        label: "Botanical + herbal",
        helper: "Rosemary sprigs, cypress, grounded greens.",
        scores: { strength: 2, calm: 1 },
      },
      {
        value: "floral",
        label: "Soft floral veil",
        helper: "Neroli blooms, orange blossom mist.",
        scores: { calm: 2, glow: 1 },
      },
      {
        value: "amber",
        label: "Amber glow",
        helper: "Warm resins with luminous finish.",
        scores: { glow: 2 },
      },
    ],
  },
];

const DEFAULT_ARCHETYPE = "calm";

type Answers = Record<string, string | undefined>;

const scoreAnswers = (answers: Answers) => {
  const scores: Record<string, number> = {};
  QUESTIONS.forEach((question) => {
    const selection = answers[question.id];
    const option = question.options.find((opt) => opt.value === selection);
    if (option?.scores) {
      Object.entries(option.scores).forEach(([ritualId, value]) => {
        scores[ritualId] = (scores[ritualId] ?? 0) + value;
      });
    }
  });
  const ordered = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return ordered[0]?.[0] ?? DEFAULT_ARCHETYPE;
};

export default function RitualFinder() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>(() => readCart());
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [resultId, setResultId] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: "info" | "success"; message: string } | null>(null);

  useEffect(() => subscribeToCart(setCartItems), []);
  useEffect(() => {
    if (!status) return undefined;
    const timer = setTimeout(() => setStatus(null), 3000);
    return () => clearTimeout(timer);
  }, [status]);

  const totalItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + (item.quantity ?? 0), 0),
    [cartItems]
  );

  const currentQuestion = QUESTIONS[step];
  const result = resultId ? RITUAL_ARCHETYPES[resultId] : null;
  const resultProducts = useMemo<Product[]>(
    () => (result ? (result.products.map((id) => PRODUCT_INDEX[id]).filter(Boolean) as Product[]) : []),
    [result]
  );
  const progress = result ? 100 : Math.round(((step + 1) / QUESTIONS.length) * 100);

  const handleSelect = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (!currentQuestion) return;
    if (!answers[currentQuestion.id]) {
      setStatus({ type: "info", message: "Select the option that best fits your mood." });
      return;
    }
    const isFinalStep = step === QUESTIONS.length - 1;
    if (isFinalStep) {
      setResultId(scoreAnswers(answers));
    } else {
      setStep((prev) => Math.min(prev + 1, QUESTIONS.length - 1));
    }
  };

  const handlePrev = () => {
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const handleRestart = () => {
    setResultId(null);
    setAnswers({});
    setStep(0);
  };

  const handleAddRitualToBag = () => {
    if (!result) return;
    setCartItems((prev) => {
      let updated = [...prev];
      result.products.forEach((productId) => {
        const product = PRODUCT_INDEX[productId];
        if (product) {
          updated = addCartItem(updated, product);
        }
      });
      writeCart(updated);
      return updated;
    });
    setStatus({ type: "success", message: "Your ritual was added to the NaturaGloss bag." });
  };

  const goToCart = () => {
    window.location.href = "?view=cart";
  };

  return (
    <div className="ritual-finder-page">
      <Navbar
        sticky
        cartCount={totalItems}
        onMenuToggle={() => setDrawerOpen(true)}
      />
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className="ritual-finder-shell">
        <header className="finder-hero">
          <p className="finder-eyebrow">Personal Ritual Consultation</p>
          <h1>Find your NaturaGloss ritual in 4 steps</h1>
          <p>
            Answer a few sensory-focused prompts and we will sketch the trio that matches your skin mood,
            aromatic preference, and available time tonight.
          </p>
        </header>

        <section className="finder-grid">
          {!result && currentQuestion && (
            <article className="finder-quiz-card" aria-live="polite">
              <div className="finder-progress">
                <p>
                  Step {step + 1} of {QUESTIONS.length}
                </p>
                <div className="finder-progress-bar" role="presentation">
                  <span style={{ width: `${progress}%` }} />
                </div>
              </div>
              <div className="finder-question">
                <p className="finder-question-title">{currentQuestion.title}</p>
                <p className="finder-question-desc">{currentQuestion.description}</p>
              </div>
              <div className="finder-options">
                {currentQuestion.options.map((option) => {
                  const isSelected = answers[currentQuestion.id] === option.value;
                  return (
                    <button
                      type="button"
                      key={option.value}
                      className={`finder-option ${isSelected ? "is-selected" : ""}`}
                      onClick={() => handleSelect(currentQuestion.id, option.value)}
                    >
                      <span className="finder-option-title">{option.label}</span>
                      <span className="finder-option-helper">{option.helper}</span>
                    </button>
                  );
                })}
              </div>
              <div className="finder-controls">
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={handlePrev}
                  disabled={step === 0}
                >
                  Back
                </button>
                <button type="button" className="cta-btn" onClick={handleNext}>
                  {step === QUESTIONS.length - 1 ? "Reveal ritual" : "Continue"}
                </button>
              </div>
            </article>
          )}

          {result && (
            <article className="finder-result-card" aria-live="polite">
              <div className="finder-progress">
                <p>Curated ritual ready</p>
                <div className="finder-progress-bar" role="presentation">
                  <span style={{ width: `${progress}%` }} />
                </div>
              </div>
              <p className="finder-result-label">Your tailored ritual</p>
              <h2>{result.title}</h2>
              <p className="finder-result-summary">{result.summary}</p>
              <ul className="finder-phases">
                {result.phases.map((phase) => (
                  <li key={phase}>
                    <span>✷</span>
                    {phase}
                  </li>
                ))}
              </ul>
              <section className="finder-products">
                <header>
                  <p>Ritual companions</p>
                  <span>{resultProducts.length} items</span>
                </header>
                <ul>
                  {resultProducts.map((product) => (
                    <li key={product.id}>
                      <div>
                        <p className="finder-product-name">{product.title}</p>
                        <p className="finder-product-desc">{product.desc}</p>
                      </div>
                      <span>{product.price}</span>
                    </li>
                  ))}
                </ul>
              </section>
              <div className="finder-result-actions">
                <button type="button" className="cta-btn" onClick={handleAddRitualToBag}>
                  Add ritual to bag
                </button>
                <button type="button" className="ghost-btn" onClick={goToCart}>
                  Review bag
                </button>
                <button type="button" className="ghost-btn ghost-btn--compact" onClick={handleRestart}>
                  Retake Ritual Finder
                </button>
              </div>
              <p className="finder-mantra">
                <strong>Mantra:</strong> {result.mantra}
              </p>
            </article>
          )}

          <aside className="finder-aside">
            <div className="finder-aside-card">
              <p className="finder-eyebrow">Studio notes</p>
              <h3>How we match you</h3>
              <ul>
                <li>Sensory prompts translate to ingredient families and textures.</li>
                <li>Every ritual balances cleanse, treat, and finish for harmony.</li>
                <li>Our concierge can fine-tune your kit after checkout.</li>
              </ul>
            </div>
          </aside>
        </section>

        {status && (
          <div className={`finder-status finder-status--${status.type}`} role="status">
            {status.message}
          </div>
        )}
      </main>
    </div>
  );
}
