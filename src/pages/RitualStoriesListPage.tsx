import { ritualStories } from "../content/stories";
import type { CSSProperties } from "react";
import { Button, Card, SectionTitle } from "@/components/ui";

export default function RitualStoriesListPage() {
  return (
    <main id="main-content" tabIndex={-1} className="ritual-stories-page stories-page">
      <SectionTitle
        title="Our Journal"
        subtitle="Slow, sensory routines to weave NaturaGloss into your daily life."
        align="left"
        className="stories-page__title"
      />
      <p className="stories-page__intro" data-animate="fade-up">
        Each routine is captured in a story field filled with warmth, scent, and steady breath so you
        can step into your care practice with intention.
      </p>
      <div className="stories-grid">
        {ritualStories.map((story, index) => (
          <Card
            key={story.slug}
            className="story-card hover-lift"
            data-animate="fade-up"
            style={{ "--motion-delay": `${0.1 + index * 0.09}s` } as CSSProperties}
          >
            <div className="story-card__media">
              <img src={story.image} alt={story.title} loading="lazy" />
            </div>
            <div className="story-card__content">
              <div className="story-card__field-row">
                <span className="story-card__field-label">Date</span>
                <span className="story-card__field-value">
                  {new Date(story.date).toLocaleDateString()}
                </span>
              </div>
              <div className="story-card__field-row">
                <span className="story-card__field-label">Read time</span>
                <span className="story-card__field-value">
                  {story.readTimeMinutes ?? 3} min
                </span>
              </div>
              <h3 className="story-card__title">{story.title}</h3>
              <p className="story-card__summary">{story.summary}</p>
              {story.tags?.length ? (
                <div className="story-card__tags" aria-label="Story tags">
                  {story.tags.map((tag) => (
                    <span key={`${story.slug}-${tag}`} className="story-card__tag">
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="story-card__actions">
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => {
                    window.location.href = `/stories/${story.slug}`;
                  }}
                >
                  Read story
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
