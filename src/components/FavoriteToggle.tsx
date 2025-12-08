import { useFavorites, type FavoriteType } from "@/favorites/favoritesStore";
import { useTranslation } from "@/localization/locale";

export interface FavoriteToggleProps {
  id: string;
  type: FavoriteType;
  className?: string;
  itemLabel?: string;
}

export function FavoriteToggle({ id, type, className = "", itemLabel }: FavoriteToggleProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { t } = useTranslation();
  const active = isFavorite(id, type);

  const label =
    active
      ? type === "product"
        ? t("accessibility.favorite.product.remove", {
            item: itemLabel ?? t("accessibility.favorite.genericItem"),
          })
        : t("accessibility.favorite.bundle.remove", {
            item: itemLabel ?? t("accessibility.favorite.genericItem"),
          })
      : type === "product"
      ? t("accessibility.favorite.product.add", {
          item: itemLabel ?? t("accessibility.favorite.genericItem"),
        })
      : t("accessibility.favorite.bundle.add", {
          item: itemLabel ?? t("accessibility.favorite.genericItem"),
        });

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      className={`favorite-toggle ${active ? "is-active" : ""} ${className}`.trim()}
      onClick={(event) => {
        event.stopPropagation();
        toggleFavorite({ id, type });
      }}
    >
      <span aria-hidden="true">{active ? "♥" : "♡"}</span>
    </button>
  );
}
