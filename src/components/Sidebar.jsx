export default function Sidebar ({ open, onClose}) {
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
       <a href="#grid" onClick={onClose}>Card Grid</a>
       <a href="#about" onClick={onClose}>About</a>
       <a href="?view=cart" onClick={onClose}>Cart</a>
      </aside>
    </div>
    {open && <div className="backdrop" onClick={onClose} aria-hidden="true" />}
    </>
  )
}
