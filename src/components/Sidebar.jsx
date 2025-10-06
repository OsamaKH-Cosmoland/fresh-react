export default function Sidebar({ open, onClose }) {
  return (
    <>
      <div className={`drawer ${open ? "open" : ""}`} role="dialog" aria-modal="true">
        <aside className="drawer-panel">
          <button className="drawer-close" onClick={onClose} aria-label="Close menu">✕</button>
          <a href="#home" onClick={onClose}>Home</a>
          <a href="#grid" onClick={onClose}>Card Grid</a>
          <a href="#forms" onClick={onClose}>Forms</a>
          <a href="#about" onClick={onClose}>About</a>
        </aside>
      </div>
      {open && <div className="backdrop" onClick={onClose} aria-hidden="true" />}
    </>
  );
}
