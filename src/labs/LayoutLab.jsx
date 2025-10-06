import { useState } from "react";
import Navbar from "../components/Navbar.jsx";
import Sidebar from "../components/Sidebar.jsx";
import CardGrid from "../components/CardGrid.jsx";

export default function LayoutLab() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div>
      {/* Sticky variant demo */}
      <Navbar sticky onMenuToggle={() => setDrawerOpen(true)} />
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className="container">
        <section className="hero">
          <h1>Structure & Layout Lab</h1>
          <p>Responsive navbar, grid cards with interactions, and a mobile sidebar.</p>
        </section>

        <CardGrid />

        <section id="forms" className="stack-lg">
          <h2>Responsive 2-Column Form (Stretch Goal)</h2>
          <form className="form-grid" onSubmit={(e) => e.preventDefault()}>
            <label>
              First Name
              <input type="text" placeholder="Jane" required />
            </label>
            <label>
              Last Name
              <input type="text" placeholder="Doe" required />
            </label>
            <label className="span-2">
              Email
              <input type="email" placeholder="jane@doe.com" required />
            </label>
            <label>
              City
              <input type="text" placeholder="Alexandria" />
            </label>
            <label>
              Country
              <input type="text" placeholder="Egypt" />
            </label>
            <label className="span-2">
              Message
              <textarea rows="4" placeholder="Write your message..." />
            </label>

            <div className="span-2 form-actions">
              <button className="ghost-btn" type="reset">Reset</button>
              <button className="cta-btn" type="submit">Submit</button>
            </div>
          </form>
        </section>
      </main>

      {/* Non-sticky variant demo */}
      <section className="container stack-lg">
        <h2>Navbar (Non-Sticky Variant)</h2>
        <div className="demo-box">
          <Navbar sticky={false} onMenuToggle={() => setDrawerOpen(true)} brand="LayoutLab (Static)" />
        </div>
      </section>
    </div>
  );
}
