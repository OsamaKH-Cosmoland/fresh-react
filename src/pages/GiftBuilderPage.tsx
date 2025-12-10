import { useState } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { Button, SectionTitle } from "@/components/ui";
import { usePageAnalytics } from "@/analytics/usePageAnalytics";
import { useSeo } from "@/seo/useSeo";
import { buildAppUrl } from "@/utils/navigation";

export default function GiftBuilderPage() {
  usePageAnalytics("gift_builder");
  useSeo({ route: "gift_builder" });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const shopUrl = buildAppUrl("/shop");

  return (
    <div className="gift-builder-page gift-builder-coming-soon-page">
      <Navbar
        sticky
        showSectionLinks={false}
        compactSearch
        onMenuToggle={() => setSidebarOpen(true)}
        menuOpen={sidebarOpen}
      />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main id="main-content" tabIndex={-1} className="gift-builder-page__content ng-mobile-shell">
        <SectionTitle
          title="Build your gift"
          subtitle="Coming soon"
          align="center"
          as="h1"
          className="gift-builder-coming-soon__title"
        />
        <div className="gift-builder-coming-soon__card">
          <p>
            We are polishing the gift builder experience so your curated care rituals arrive as
            magic bundles. Check back soon for the first release.
          </p>
          <p className="gift-builder-coming-soon__note">
            In the meantime, explore the collection and add your favorites to a ritual set.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={() => {
              window.location.href = shopUrl;
            }}
          >
            Browse the collection
          </Button>
        </div>
      </main>
    </div>
  );
}
