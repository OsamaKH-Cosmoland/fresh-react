import { ritualStories } from "../content/stories";
import { Button, Card, SectionTitle } from "@/components/ui";
import { RevealOnScroll, SlideUp } from "@/components/animate";

export default function RitualStoriesListPage() {
  return (
    <main className="ritual-stories-page stories-page" style={{ padding: "32px", minHeight: "100vh" }}>
      <SlideUp delay={0.05}>
        <SectionTitle
          title="Our Journal"
          subtitle="Slow, sensory routines to weave NaturaGloss into your daily life."
          align="left"
          className="mb-4 stories-page__title"
        />
      </SlideUp>

      <SlideUp delay={0.1}>
        <p className="stories-page__intro">
          Each ritual is captured in a story field filled with warmth, scent, and steady breath so you
          can step into your care practice with intention.
        </p>
      </SlideUp>

      <RevealOnScroll>
        <div className="stories-grid">
          {ritualStories.map((story, index) => (
            <SlideUp key={story.slug} delay={0.1 + index * 0.05}>
              <Card className="story-card">
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
            </SlideUp>
          ))}
        </div>
      </RevealOnScroll>
    </main>
  );
}
