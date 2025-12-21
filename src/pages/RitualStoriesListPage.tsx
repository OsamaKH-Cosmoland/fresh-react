import { ritualStories } from "../content/stories";
import { buildAppUrl } from "@/utils/navigation";
import type { CSSProperties } from "react";
import { Button, Card, SectionTitle } from "@/components/ui";
import { useTranslation } from "@/localization/locale";

export default function RitualStoriesListPage() {
  const { t } = useTranslation();
  return (
    <main id="main-content" tabIndex={-1} className="ritual-stories-page stories-page">
      <div className="stories-page__title-bar">
        <a className="stories-page__brand-link" href={buildAppUrl("/")}>
          <span className="stories-page__brand-text">NATURAGLOSS</span>
        </a>
        <SectionTitle
          title={t("stories.title")}
          subtitle={t("stories.subtitle")}
          align="center"
          className="stories-page__title"
        />
      </div>
      <p className="stories-page__intro" data-animate="fade-up">
        {t("stories.intro")}
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
                <span className="story-card__field-label">{t("stories.labels.date")}</span>
                <span className="story-card__field-value">
                  {new Date(story.date).toLocaleDateString()}
                </span>
              </div>
              <div className="story-card__field-row">
                <span className="story-card__field-label">{t("stories.labels.readTime")}</span>
                <span className="story-card__field-value">
                  {story.readTimeMinutes ?? 3} {t("stories.labels.minutes")}
                </span>
              </div>
              <h3 className="story-card__title">{story.title}</h3>
              <p className="story-card__summary">{story.summary}</p>
              {story.tags?.length ? (
                <div className="story-card__tags" aria-label={t("stories.labels.tags")}>
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
                  {t("stories.actions.readStory")}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
