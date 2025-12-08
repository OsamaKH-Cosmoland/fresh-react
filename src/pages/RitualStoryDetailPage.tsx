import { useMemo } from "react";
import { Button, Card, SectionTitle } from "@/components/ui";
import { FadeIn, RevealOnScroll, SlideUp } from "@/components/animate";
import { ritualStories } from "../content/stories";

interface RitualStoryDetailPageProps {
  slug: string;
}

export default function RitualStoryDetailPage({ slug }: RitualStoryDetailPageProps) {
  const story = useMemo(() => ritualStories.find((item) => item.slug === slug), [slug]);
  if (!story) {
    return (
      <main className="ritual-story-detail">
        <SlideUp>
          <SectionTitle title="Story not found" subtitle="Return to the Routine Stories library." />
        </SlideUp>
        <FadeIn delay={0.1}>
          <div className="ritual-story-detail__cta">
            <Button variant="ghost" onClick={() => (window.location.href = "/stories")}>
              Back to stories
            </Button>
          </div>
        </FadeIn>
      </main>
    );
  }

  const bodyParagraphs = story.body.split("\n\n").filter(Boolean);

  return (
    <main className="ritual-story-detail">
      <SlideUp>
        <SectionTitle
          title={story.title}
          subtitle={`${new Date(story.date).toLocaleDateString()} · ${story.readTimeMinutes ?? 4} min read`}
        />
      </SlideUp>
      <Card className="ritual-story-detail__card">
        {bodyParagraphs.map((paragraph, index) => (
          <RevealOnScroll key={`${slug}-${index}`}>
            <p className="ritual-story-detail__paragraph">{paragraph}</p>
          </RevealOnScroll>
        ))}
        <FadeIn delay={0.1}>
          <div className="ritual-story-detail__cta">
            <Button variant="secondary" onClick={() => (window.location.href = "/stories")}>
              Back to stories
            </Button>
          </div>
        </FadeIn>
      </Card>
    </main>
  );
}
