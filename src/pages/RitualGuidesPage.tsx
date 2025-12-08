import { useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { Button, Card, SectionTitle } from "@/components/ui";
import { ritualGuides } from "@/content/ritualGuides";
import { shopFocusLookup } from "@/content/shopCatalog";

const navigateTo = (path: string) => {
  if (typeof window === "undefined") return;
  const base = import.meta.env.BASE_URL ?? "/";
  const destination = new URL(base, window.location.origin);
  destination.pathname = path;
  window.location.href = destination.toString();
};

export default function RitualGuidesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const guides = useMemo(() => ritualGuides, []);

  return (
    <div className="ritual-guides-page">
      <Navbar sticky onMenuToggle={() => setSidebarOpen(true)} showSectionLinks={false} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="ritual-guides-page__content ng-mobile-shell">
        <SectionTitle
          title="Routine Guides"
          subtitle="Calm essays, routines, and gentle know-how to guide every layer."
          align="center"
        />
        <div className="ritual-guides-grid ng-grid-mobile-2">
          {guides.map((guide) => (
            <Card key={guide.id} className="ritual-guides-card hover-lift" data-animate="fade-up">
              {guide.heroImage && (
                <div className="ritual-guides-card__media">
                  <img src={guide.heroImage} alt={guide.title} />
                </div>
              )}
              <div className="ritual-guides-card__body">
                <p className="ritual-guides-card__subtitle">{guide.subtitle}</p>
                <h3>{guide.title}</h3>
                <div className="ritual-guides-card__tags">
                  {[
                    ...(guide.tags ?? []),
                    ...(guide.focusTags ?? []).map((id) => shopFocusLookup[id]).filter(Boolean),
                  ].map((tag) => (
                    <span key={`${guide.id}-${tag}`} className="ritual-guides-card__tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="ritual-guides-card__actions">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => navigateTo(`/ritual-guides/${guide.slug}`)}
                >
                  Read the guide
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
