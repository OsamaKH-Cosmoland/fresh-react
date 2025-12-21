import { useState } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { Button, SectionTitle } from "@/components/ui";
import { usePageAnalytics } from "@/analytics/usePageAnalytics";
import { useSeo } from "@/seo/useSeo";
import { buildAppUrl } from "@/utils/navigation";
import { useTranslation } from "@/localization/locale";

export default function GiftBuilderPage() {
  usePageAnalytics("gift_builder");
  useSeo({ route: "gift_builder" });
  const { t } = useTranslation();
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
          title={t("giftBuilder.comingSoon.title")}
          subtitle={t("giftBuilder.comingSoon.subtitle")}
          align="center"
          as="h1"
          className="gift-builder-coming-soon__title"
        />
        <div className="gift-builder-coming-soon__card">
          <p>
            {t("giftBuilder.comingSoon.body")}
          </p>
          <p className="gift-builder-coming-soon__note">
            {t("giftBuilder.comingSoon.note")}
          </p>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={() => {
              window.location.href = shopUrl;
            }}
          >
            {t("giftBuilder.comingSoon.action")}
          </Button>
        </div>
      </main>
    </div>
  );
}
