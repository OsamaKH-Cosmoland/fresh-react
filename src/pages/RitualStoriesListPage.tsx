import { ritualStories } from "../content/stories";
import { Button, Card, SectionTitle } from "../components/ui";

export default function RitualStoriesListPage() {
  return (
    <main className="ritual-stories-page" style={{ padding: "32px", minHeight: "100vh" }}>
      <SectionTitle
        title="Ritual Stories"
        subtitle="Slow, sensory routines to weave NaturaGloss into your daily life."
        align="left"
        className="mb-8"
      />
      <div
        className="stories-grid"
        style={{ display: "grid", gap: "20px", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}
      >
        {ritualStories.map((story) => (
          <Card key={story.slug} className="story-card">
            <img
              src={story.image}
              alt={story.title}
              className="story-card__image"
              loading="lazy"
            />
            <div className="story-card__content">
              <p className="text-sm text-gray-500 story-card__meta">
                {new Date(story.date).toLocaleDateString()} · {story.readTimeMinutes ?? 3} min read
              </p>
              <h3 className="text-xl font-semibold text-emerald-900">{story.title}</h3>
              <p className="mt-2 text-gray-700">{story.summary}</p>
              <div className="mt-6">
                <Button
                  variant="ghost"
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
