import React from "react";
import { Button, Card, SectionTitle } from "@/components/ui";

export type HeroSummaryBullet = string;

export interface RitualStep {
  title: string;
  description: string;
}

export interface IngredientHighlight {
  name: string;
  description: string;
}

export interface Pairing {
  name: string;
  slug: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface ProductDetailLayoutProps {
  productName: string;
  shortTagline: string;
  heroSummaryBullets: HeroSummaryBullet[];
  heroImage?: string;
  priceLabel?: string;
  whatItsMadeFor: string;
  ritualSteps: RitualStep[];
  ingredients: IngredientHighlight[];
  sensoryExperience: string[];
  pairsWellWith: Pairing[];
  faq?: FAQItem[];
  onAddToBag: () => void;
  heroActions?: React.ReactNode;
}

export function ProductDetailLayout({
  productName,
  shortTagline,
  heroSummaryBullets,
  heroImage,
  priceLabel,
  whatItsMadeFor,
  ritualSteps,
  ingredients,
  sensoryExperience,
  pairsWellWith,
  faq,
  onAddToBag,
  heroActions,
}: ProductDetailLayoutProps) {
  return (
    <main className="product-detail-page">
      <section className="product-detail-hero" data-animate="fade-up">
        <div className="product-detail-hero__copy">
          <p className="product-detail-hero__tagline">{shortTagline}</p>
          <h1 className="product-detail-hero__title">{productName}</h1>
          {priceLabel && (
            <p className="product-detail-hero__price">{priceLabel}</p>
          )}
          <ul className="product-detail-hero__bullets">
            {heroSummaryBullets.map((bullet) => (
              <li key={bullet}>
                <span className="product-detail-hero__bullet-dot" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
          <div className="product-detail-hero__actions">
            <Button variant="primary" size="lg" onClick={onAddToBag}>
              Add to bag
            </Button>
            {heroActions}
          </div>
        </div>
        {heroImage && (
          <figure className="product-detail-hero__visual" data-animate="fade-in">
            <img src={heroImage} alt={productName} />
          </figure>
        )}
      </section>

      <section className="product-detail-grid">
        <div className="product-detail-main">
          <article className="product-detail-section" data-animate="fade-up">
            <SectionTitle title="What it’s made for" />
            <p className="product-detail-section__copy">{whatItsMadeFor}</p>
          </article>

          <article className="product-detail-section" data-animate="fade-up">
            <SectionTitle title="Ritual" subtitle="A slow, sensory sequence" />
            <ol className="product-detail-steps">
              {ritualSteps.map((step) => (
                <li key={step.title}>
                  <p className="product-detail-steps__label">{step.title}</p>
                  <p className="product-detail-steps__detail">{step.description}</p>
                </li>
              ))}
            </ol>
          </article>

          <article className="product-detail-section" data-animate="fade-up">
            <SectionTitle title="Ingredients spotlight" />
            <div className="product-detail-ingredients">
              {ingredients.map((ingredient) => (
                <Card className="product-detail-ingredient" key={ingredient.name}>
                  <h3>{ingredient.name}</h3>
                  <p>{ingredient.description}</p>
                </Card>
              ))}
            </div>
          </article>

          <article className="product-detail-section" data-animate="fade-up">
            <SectionTitle title="Sensory experience" />
            <ul className="product-detail-sensory">
              {sensoryExperience.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </article>

          <article className="product-detail-section" data-animate="fade-up">
            <SectionTitle title="Pairs well with" subtitle="Complete the ritual" />
            <div className="product-detail-pairings">
              {pairsWellWith.map((item) => (
                <a key={item.name} href={item.slug} className="product-detail-pairing">
                  {item.name}
                </a>
              ))}
            </div>
          </article>

          {faq && faq.length > 0 && (
            <article className="product-detail-section" data-animate="fade-up">
              <SectionTitle title="FAQ" subtitle="Your questions answered" />
              <div className="product-detail-faq">
                {faq.map((entry) => (
                  <details key={entry.question} className="product-detail-faq__item">
                    <summary>{entry.question}</summary>
                    <p>{entry.answer}</p>
                  </details>
                ))}
              </div>
            </article>
          )}
        </div>

        <aside className="product-detail-aside" data-animate="fade-up">
          <Card className="product-detail-aside__card">
            <p className="product-detail-aside__label">Order this ritual</p>
            <h3>{productName}</h3>
            {priceLabel && <p className="product-detail-aside__price">{priceLabel}</p>}
            <p className="product-detail-aside__hint">
              Crafted for nightly calm and a luminous morning finish.
            </p>
            <Button variant="secondary" size="lg" onClick={onAddToBag}>
              Add to bag
            </Button>
          </Card>
        </aside>
      </section>
    </main>
  );
}
