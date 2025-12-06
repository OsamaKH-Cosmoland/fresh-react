import { useMemo } from "react";
import { Button, Card, SectionTitle } from "../components/ui";
import { ritualStories } from "../content/stories";

interface RitualStoryDetailPageProps {
  slug: string;
}

export default function RitualStoryDetailPage({ slug }: RitualStoryDetailPageProps) {
  const story = useMemo(() => ritualStories.find((item) => item.slug === slug), [slug]);
  if (!story) {
    return (
      <main className="ritual-story-detail" style={{ padding: "32px" }}>
        <SectionTitle title="Story not found" subtitle="Return to the Ritual Stories library." />
        <Button variant="ghost" onClick={() => (window.location.href = "/stories")}>
          Back to stories
        </Button>
      </main>
    );
  }

  const bodyParagraphs = story.body.split("\n\n").filter(Boolean);

  return (
    <main className="ritual-story-detail" style={{ padding: "32px", minHeight: "100vh" }}>
      <SectionTitle
        title={story.title}
        subtitle={`${new Date(story.date).toLocaleDateString()} · ${story.readTimeMinutes ?? 4} min read`}
      />
      <Card className="mt-6" style={{ gap: "16px" }}>
        {bodyParagraphs.map((paragraph, index) => (
          <p key={`${slug}-${index}`} className="text-gray-700 leading-relaxed">
            {paragraph}
          </p>
        ))}
        <div className="mt-4">
          <Button variant="secondary" onClick={() => (window.location.href = "/stories")}>
            Back to stories
          </Button>
        </div>
      </Card>
    </main>
  );
}
