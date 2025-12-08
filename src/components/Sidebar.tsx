import { useTranslation } from "@/localization/locale";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { t } = useTranslation();
  return (
    <>
    <div
    className={`drawer ${open ? "open" : ""}`} >
      <aside className="drawer-panel">
       <button
       className="drawer-close"
       onClick={onClose}
       aria-label="Close"
       >
         x
       </button>
       <a href="#home" onClick={onClose}>Home</a>
       <a href="/shop" onClick={onClose}>Shop</a>
       <a href="/favorites" onClick={onClose}>Favourites</a>
       <a href="#grid" onClick={onClose}>Card Grid</a>
       <a href="#about" onClick={onClose}>About</a>
       <a href="/stories" onClick={onClose}>Stories</a>
       <a href="/ritual-guides" onClick={onClose}>Ritual Guides</a>
       <a href="/orders-history" onClick={onClose}>{t("nav.orders")}</a>
       <a href="/ritual-coach" onClick={onClose}>{t("nav.ritualCoach")}</a>
       <a href="/gift-builder" onClick={onClose}>Build a gift</a>
       <a href="?view=cart" onClick={onClose}>Cart</a>
      </aside>
    </div>
    {open && <div className="backdrop" onClick={onClose} aria-hidden="true" />}
    </>
  )
}
