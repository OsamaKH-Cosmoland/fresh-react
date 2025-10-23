import Navbar from "../components/Navbar.jsx";
import collectionImage from "../assets/collection.png";

const ANNOUNCEMENT_TEXT = "Inspired by European cosmetic standards, handcrafted in Egypt";

const openPlanner = () => {
  const base = import.meta.env.BASE_URL ?? "/";
  const plannerUrl = new URL(base, window.location.origin);
  plannerUrl.searchParams.set("view", "ritualplanner");
  plannerUrl.hash = "";
  window.location.href = plannerUrl.toString();
};

export default function LayoutLab() {
  return (
    <div className="landing-page">
      <div className="announcement-bar announcement-bar--single" role="status" aria-live="polite">
        <span className="announcement-message announcement-message--primary is-active">
          {ANNOUNCEMENT_TEXT}
        </span>
      </div>
      <Navbar sticky={false} onMenuToggle={() => {}} onGetStarted={openPlanner} />

      <main className="landing-hero">
        <div className="landing-hero__copy">
          <h1>Luxury Inspired by Nature’s Essence</h1>
          <p>
            Indulge in a world of serenity and sophistication, natural care designed for those who
            value beauty with soul.
          </p>
        </div>
        <figure className="landing-hero__media">
          <img src={collectionImage} alt="NaturaGloss collection of botanical care" />
        </figure>
      </main>
    </div>
  );
}
