import React from "react";
import { Button, Card } from "@/components/ui";
import { FavoriteToggle } from "@/components/FavoriteToggle";
import { RitualBundle } from "@/content/bundles";
import { PRODUCT_DETAIL_MAP } from "@/content/productDetails";

export interface BundleCardProps {
  bundle: RitualBundle;
  onAddBundle?: (bundle: RitualBundle) => void;
  onViewDetails?: (bundle: RitualBundle) => void;
  heroImage?: string;
}

export function BundleCard({ bundle, onAddBundle, onViewDetails, heroImage }: BundleCardProps) {
  return (
    <Card className="bundle-card hover-lift" data-animate="fade-up">
      <FavoriteToggle id={bundle.id} type="bundle" />
      {heroImage && (
        <div className="bundle-card__hero">
          <img src={heroImage} alt={bundle.name} />
        </div>
      )}
      <header className="bundle-card__header">
        <p className="bundle-card__tagline">{bundle.tagline}</p>
        <h3>{bundle.name}</h3>
        {bundle.highlight && <p className="bundle-card__highlight">{bundle.highlight}</p>}
      </header>

      <p className="bundle-card__description">{bundle.description}</p>
      <ul className="bundle-card__products">
        {bundle.products.map((entry) => {
          const name = PRODUCT_DETAIL_MAP[entry.productId]?.productName ?? entry.productId;
          return <li key={entry.productId}>{name}</li>;
        })}
      </ul>

      <div className="bundle-card__actions">
        {onAddBundle && (
          <Button variant="primary" size="md" onClick={() => onAddBundle(bundle)}>
            Add ritual to bag
          </Button>
        )}
        {onViewDetails && (
          <button
            type="button"
            className="bundle-card__details"
            onClick={() => onViewDetails(bundle)}
          >
            View ritual
          </button>
        )}
      </div>
    </Card>
  );
}
