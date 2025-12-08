import { useFavorites, type FavoriteType } from "@/favorites/favoritesStore";

export interface FavoriteToggleProps {
  id: string;
  type: FavoriteType;
  className?: string;
}

export function FavoriteToggle({ id, type, className = "" }: FavoriteToggleProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(id, type);

  const label =
    active && type === "product"
      ? "Remove product from favourites"
      : active
      ? "Remove routine from favourites"
      : type === "product"
      ? "Save product to favourites"
      : "Save routine to favourites";

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
