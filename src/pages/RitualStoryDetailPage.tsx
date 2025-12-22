import { useMemo } from "react";
import { Button, Card, SectionTitle } from "@/components/ui";
import { FadeIn, RevealOnScroll, SlideUp } from "@/components/animate";
import { localizeStory, ritualStories } from "../content/stories";
import { useTranslation } from "@/localization/locale";

interface RitualStoryDetailPageProps {
  slug: string;
}

export default function RitualStoryDetailPage({ slug }: RitualStoryDetailPageProps) {
  const { t, locale } = useTranslation();
  const story = useMemo(() => ritualStories.find((item) => item.slug === slug), [slug]);
  const localizedStory = story ? localizeStory(story, locale) : null;
  if (!localizedStory) {
    return (
      <main id="main-content" tabIndex={-1} className="ritual-story-detail">
        <SlideUp>
          <SectionTitle title={t("stories.detail.notFoundTitle")} subtitle={t("stories.detail.notFoundSubtitle")} />
        </SlideUp>
        <FadeIn delay={0.1}>
          <div className="ritual-story-detail__cta">
            <Button variant="ghost" onClick={() => (window.location.href = "/stories")}>
              {t("stories.actions.backToStories")}
            </Button>
          </div>
        </FadeIn>
      </main>
    );
  }

  const bodyParagraphs = localizedStory.body.split("\n\n").filter(Boolean);

  return (
    <main id="main-content" tabIndex={-1} className="ritual-story-detail">
      <SlideUp>
        <SectionTitle
          title={localizedStory.title}
          subtitle={`${new Date(localizedStory.date).toLocaleDateString(locale)} · ${
            localizedStory.readTimeMinutes ?? 4
          } ${t("stories.labels.minutesRead")}`}
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
              {t("stories.actions.backToStories")}
            </Button>
          </div>
        </FadeIn>
      </Card>
    </main>
  );
}
