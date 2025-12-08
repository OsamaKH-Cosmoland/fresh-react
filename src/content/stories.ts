import bodyBalmImage from "../assets/BodyBalmEnhanced1.jpg";
import handBalmImage from "../assets/HandBalmEnhanced.jpg";
import hairGrowthImage from "../assets/HairGrowthEnhanced.jpg";
import hairShineImage from "../assets/HairShineEnhanced.jpg";
import bodySoapOne from "../assets/BodySoap1.jpg";
import bodySoapTwo from "../assets/BodySoap2.png";
import lipBalmImage from "../assets/LipBalm.jpg";

export type RitualStory = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  body: string;
  image: string;
  readTimeMinutes?: number;
  tags?: string[];
};

export const ritualStories: RitualStory[] = [
  {
    slug: "the-silk-blossom-moment",
    title: "The Silk Blossom Moment",
    date: "2025-01-18",
    summary:
      "A tender, feminine routine with the Silk Blossom Body Soap — capturing softness, elegance, and a feeling of quiet beauty.",
    body: `
In the shower’s warmth, she reaches for the Silk Blossom Body Soap —  
a scent that feels like early spring and soft petals.

The lather forms beautifully,  
sliding over the skin with a creamy, luxurious touch.  
She closes her eyes and breathes it in —  
a small escape, a soft reset.

The moment is simple,  
but its softness stays with her long after the water stops.  
A gentle elegance settles into her mood,  
and she carries it with her into the day.
    `,
    image: bodySoapTwo,
    readTimeMinutes: 2,
    tags: ["body-care", "luxury", "softness"]
  },

  {
    slug: "morning-clarity-with-calm-and-glow-soap",
    title: "Morning Clarity with Calm & Glow Soap",
    date: "2025-01-15",
    summary:
      "A refreshing morning cleanse that brightens the skin while steadying the spirit — a calm glow from the very first touch of water.",
    body: `
Morning light drifts into the bathroom, soft and gentle.  
She lathers the Calm & Glow Body Soap between her hands,  
and the fragrance rises — bright, clean, grounding.

The creamy foam meets her skin like a quiet reset.  
The heaviness of sleep lifts,  
and a soft radiance begins to appear — not forced, not rushed.  

This moment belongs to her.  
Warm water, deep breath, clear mind.  
A fresh beginning carried through the rest of the day.
    `,
    image: bodySoapOne,
    readTimeMinutes: 2,
    tags: ["body-care", "morning", "clarity"]
  },

  {
    slug: "the-evening-body-balm-ritual",
    title: "The Evening Body Balm Routine",
    date: "2025-01-05",
    summary:
      "A slow evening moment that softens the skin and settles the mind — captured through the warmth of the Body Balm.",
    body: `
In the quiet of the evening, when the world begins to soften, she opens her jar of Body Balm.  
A gentle warmth rises as the scent settles in the air — calm, grounded, and deeply comforting.  

She warms a small amount between her hands and breathes slowly.  
With each movement across her skin, the day loosens its grip.  
Tension melts. The breath deepens. The body feels held.  

This routine isn’t about rushing toward glow —  
it’s about allowing the body to return to itself.

A soft sheen appears, but what stays longer is the serenity.  
For a moment, everything feels warm, nourished, and beautifully still.
    `,
    image: bodyBalmImage,
    readTimeMinutes: 2,
    tags: ["body-care", "routine", "relaxation"]
  },

  {
    slug: "the-hands-that-do-so-much",
    title: "The Hands That Do So Much",
    date: "2025-01-22",
    summary:
      "A restoring routine with the Hand Balm — honoring the hands that carry responsibility, warmth, and everyday strength.",
    body: `
Her hands carry stories —  
work, care, responsibility, quiet acts of love.

She warms a small amount of Hand Balm,  
letting the soft scent rise as she massages each finger slowly.  

The skin relaxes.  
Dryness fades.  
A sense of comfort returns.

It is not just moisture —  
it's recognition.  
A moment of gratitude for the hands that do so much,  
and ask for so little in return.

She finishes the routine with a deep breath,  
feeling restored, present, and gently renewed.
    `,
    image: handBalmImage,
    readTimeMinutes: 2,
    tags: ["hand-care", "restoration", "routine"]
  },

  {
    slug: "the-lip-balm-pause",
    title: "The Lip Balm Pause",
    date: "2025-01-20",
    summary:
      "A tiny moment of nourishment — using the Lip Balm as a reminder to slow down and breathe throughout the day.",
    body: `
Not every routine is grand.  
Some are small enough to fit in the palm of the hand.

She uncaps the Lip Balm,  
and for a quiet second, the day pauses.  

A soft glide across her lips —  
hydration, comfort, a gentle return to softness.  

It becomes a mindful routine:  
every application a reminder to slow down,  
breathe, recalibrate, and continue with ease.

The world moves fast.  
Her routine doesn’t need to.
    `,
    image: lipBalmImage,
    readTimeMinutes: 1,
    tags: ["lip-care", "mindfulness", "hydration"]
  },

  {
    slug: "the-hair-growth-journey",
    title: "The Hair Growth Journey",
    date: "2025-01-08",
    summary:
      "A quiet self-care commitment — discovering strength, patience, and confidence through the Hair Growth Oil routine.",
    body: `
Growth is rarely loud.  
More often, it happens in small, quiet moments —  
like warming a few drops of Hair Growth Oil between the palms.

She massages her scalp slowly, following her breath.  
The herb-rich aroma rises softly, grounding her senses.  
With every gentle circular motion, she invites circulation, warmth, and renewal.  

It becomes more than a hair routine.  
It's a promise to herself — to stay consistent, to nurture, to trust the process.  

Weeks pass, confidence returns, and the mirror begins to show the story:  
stronger strands… healthier roots… a softness that feels earned.  
    `,
    image: hairGrowthImage,
    readTimeMinutes: 3,
    tags: ["hair-care", "growth", "routine"]
  },

  {
    slug: "the-shine-and-confidence-ritual",
    title: "The Shine & Confidence Routine",
    date: "2025-01-12",
    summary:
      "A moment of softness and control — using the Hair Shine & Anti-Frizz Oil to reveal natural, effortless confidence.",
    body: `
Some mornings begin quietly, with sunlight touching the edges of the room.  
She reaches for the Hair Shine & Anti-Frizz Oil — light, silky, effortless.

One small pump glides through her hair.  
The frizz settles.  
The strands catch the light.  

There’s no heavy perfume, no harsh finish —  
just a natural, elegant sheen that follows her throughout the day.  

She doesn’t style for others.  
She styles for the feeling —  
that soft, quiet confidence that comes when things fall into place without force.

Her hair becomes a reflection of the calm she carries.
    `,
    image: hairShineImage,
    readTimeMinutes: 2,
    tags: ["hair-care", "shine", "confidence"]
  }
];
