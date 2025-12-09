import { useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { Button, SectionTitle } from "@/components/ui";
import { listAudience } from "@/utils/audienceStorage";
import type { AudienceContact, ConsentChannel } from "@/types/audience";
import { useTranslation, type AppTranslationKey } from "@/localization/locale";

const CONSENT_CHANNELS: ConsentChannel[] = [
  "newsletter",
  "product_updates",
  "offers",
  "research",
];

const ORDER_FILTERS = [
  { id: "all", labelKey: "audience.filters.orders.all" },
  { id: "withOrders", labelKey: "audience.filters.orders.withOrders" },
  { id: "withoutOrders", labelKey: "audience.filters.orders.withoutOrders" },
] as const;

const CONSENT_LABELS: Record<ConsentChannel, AppTranslationKey> = {
  newsletter: "audience.consentChannels.newsletter",
  product_updates: "audience.consentChannels.productUpdates",
  offers: "audience.consentChannels.offers",
  research: "audience.consentChannels.research",
};

const SOURCE_LABELS: Record<AudienceContact["consents"][number]["source"], AppTranslationKey> = {
  newsletter_form: "audience.sources.newsletter_form",
  checkout: "audience.sources.checkout",
  onboarding: "audience.sources.onboarding",
  account: "audience.sources.account",
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return value;
  return new Date(parsed).toLocaleString();
};

const toCsv = (contacts: AudienceContact[]) => {
  const header = [
    "Email",
    "Locale",
    "Concerns",
    "Orders",
    "Last Order",
    "Consents",
    "Created At",
    "Updated At",
  ];
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const rows = contacts.map((contact) => {
    const concerns = contact.concerns?.join("; ") ?? "";
    const consents = contact.consents
      .map((consent) => `${consent.channel}:${consent.source}`)
      .join("; ");
    return [
      contact.email,
      contact.locale,
      concerns,
      String(contact.ordersCount ?? 0),
      contact.lastOrderAt ?? "",
      consents,
      contact.createdAt,
      contact.updatedAt,
    ].map((value) => escape(String(value ?? "")));
  });
  return [header.map(escape).join(","), ...rows.map((row) => row.join(","))].join("\n");
};

export default function AudiencePage() {
  const { t } = useTranslation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [channelFilter, setChannelFilter] = useState<"all" | ConsentChannel>("all");
  const [ordersFilter, setOrdersFilter] = useState<(typeof ORDER_FILTERS)[number]["id"]>("all");

  const audience = useMemo(() => listAudience(), []);
  const filteredAudience = useMemo(() => {
    return audience.filter((contact) => {
      const matchesChannel =
        channelFilter === "all"
          ? true
          : contact.consents.some((consent) => consent.channel === channelFilter);
      if (!matchesChannel) return false;
      if (ordersFilter === "withOrders") {
        return (contact.ordersCount ?? 0) > 0;
      }
      if (ordersFilter === "withoutOrders") {
        return (contact.ordersCount ?? 0) === 0;
      }
      return true;
    });
  }, [audience, channelFilter, ordersFilter]);

  const handleExport = (format: "json" | "csv") => {
    if (typeof window === "undefined") return;
    const payload =
      format === "json" ? JSON.stringify(filteredAudience, null, 2) : toCsv(filteredAudience);
    const blob = new Blob([payload], {
      type: format === "json" ? "application/json" : "text/csv",
    });
    const filename = format === "json" ? "audience.json" : "audience.csv";
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="audience-page">
      <Navbar sticky onMenuToggle={() => setDrawerOpen(true)} menuOpen={drawerOpen} />
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <main id="main-content" tabIndex={-1} className="audience-page__shell ng-mobile-shell">
        <header className="audience-page__hero" data-animate="fade-up">
          <SectionTitle
            title={t("audience.hero.title")}
            subtitle={t("audience.hero.subtitle")}
            align="center"
          />
        </header>

        <section className="audience-page__filters" data-animate="fade-up">
          <div className="audience-page__filter">
            <label htmlFor="audience-channel-filter">{t("audience.filters.channel")}</label>
            <select
              id="audience-channel-filter"
              value={channelFilter}
              onChange={(event) => setChannelFilter(event.target.value as "all" | ConsentChannel)}
            >
              <option value="all">{t("audience.filters.allChannels")}</option>
              {CONSENT_CHANNELS.map((channel) => (
                <option key={channel} value={channel}>
                  {t(CONSENT_LABELS[channel])}
                </option>
              ))}
            </select>
          </div>
          <div className="audience-page__filter">
            <label htmlFor="audience-orders-filter">{t("audience.filters.orders.label")}</label>
            <select
              id="audience-orders-filter"
              value={ordersFilter}
              onChange={(event) => setOrdersFilter(event.target.value as typeof ORDER_FILTERS[number]["id"])}
            >
              {ORDER_FILTERS.map((option) => (
                <option key={option.id} value={option.id}>
                  {t(option.labelKey)}
                </option>
              ))}
            </select>
          </div>
          <div className="audience-page__exports">
            <Button variant="ghost" size="md" onClick={() => handleExport("json")}>
              {t("audience.actions.exportJson")}
            </Button>
            <Button variant="secondary" size="md" onClick={() => handleExport("csv")}>
              {t("audience.actions.exportCsv")}
            </Button>
          </div>
        </section>

        <section className="audience-page__table" data-animate="fade-up">
          {filteredAudience.length === 0 ? (
            <p className="audience-page__empty">{t("audience.emptyState")}</p>
          ) : (
            <div className="audience-page__table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>{t("audience.table.email")}</th>
                    <th>{t("audience.table.locale")}</th>
                    <th>{t("audience.table.concerns")}</th>
                    <th>{t("audience.table.orders")}</th>
                    <th>{t("audience.table.lastOrder")}</th>
                    <th>{t("audience.table.consents")}</th>
                    <th>{t("audience.table.created")}</th>
                    <th>{t("audience.table.updated")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAudience.map((contact) => (
                    <tr key={contact.id}>
                      <td>{contact.email}</td>
                      <td>{contact.locale}</td>
                      <td>{contact.concerns?.join(", ") || "—"}</td>
                      <td>{contact.ordersCount ?? 0}</td>
                      <td>{formatDate(contact.lastOrderAt)}</td>
                      <td>
                        <div className="audience-page__consents">
                          {contact.consents.map((consent, index) => (
                            <span className="audience-page__consent-pill" key={`${consent.channel}-${consent.source}-${index}`}>
                              {t(CONSENT_LABELS[consent.channel])}
                              <span className="audience-page__consent-source">
                                {t(SOURCE_LABELS[consent.source])}
                              </span>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>{formatDate(contact.createdAt)}</td>
                      <td>{formatDate(contact.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
