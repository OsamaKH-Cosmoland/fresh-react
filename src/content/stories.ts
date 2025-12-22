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
  titleAr?: string;
  date: string;
  summary: string;
  summaryAr?: string;
  body: string;
  bodyAr?: string;
  image: string;
  readTimeMinutes?: number;
  tags?: string[];
  tagsAr?: string[];
};

type SupportedLocale = "en" | "ar";

export const localizeStory = (story: RitualStory, locale: SupportedLocale): RitualStory => ({
  ...story,
  title: locale === "ar" ? story.titleAr ?? story.title : story.title,
  summary: locale === "ar" ? story.summaryAr ?? story.summary : story.summary,
  body: locale === "ar" ? story.bodyAr ?? story.body : story.body,
  tags: locale === "ar" ? story.tagsAr ?? story.tags : story.tags,
});

export const ritualStories: RitualStory[] = [
  {
    slug: "the-silk-blossom-moment",
    title: "The Silk Blossom Moment",
    titleAr: "لحظة زهرة الحرير",
    date: "2025-01-18",
    summary:
      "A tender, feminine routine with the Silk Blossom Body Soap — capturing softness, elegance, and a feeling of quiet beauty.",
    summaryAr:
      "روتين أنثوي رقيق مع صابون الجسم زهرة الحرير — يلتقط النعومة والأناقة وإحساس الجمال الهادئ.",
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
    bodyAr: `
في دفء الاستحمام تمد يدها نحو صابون الجسم زهرة الحرير —  
رائحة تشبه بدايات الربيع وبتلات ناعمة.

الرغوة تتكوّن بسلاسة،  
وتنساب على البشرة بلمسة كريمية فاخرة.  
تغمض عينيها وتتنفّس —  
هروب صغير، وهدوء خفيف.

اللحظة بسيطة،  
لكن نعومتها تبقى معها بعد توقف الماء.  
أناقة هادئة تستقر في مزاجها،  
وترافقها طوال اليوم.
    `,
    image: bodySoapTwo,
    readTimeMinutes: 2,
    tags: ["body-care", "luxury", "softness"],
    tagsAr: ["عناية-الجسم", "ترف", "نعومة"]
  },

  {
    slug: "morning-clarity-with-calm-and-glow-soap",
    title: "Morning Clarity with Calm & Glow Soap",
    titleAr: "صفاء الصباح مع صابون الهدوء والتوهّج",
    date: "2025-01-15",
    summary:
      "A refreshing morning cleanse that brightens the skin while steadying the spirit — a calm glow from the very first touch of water.",
    summaryAr:
      "تنظيف صباحي منعش يضيء البشرة ويوازن الروح — توهّج هادئ منذ أول لمسة ماء.",
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
    bodyAr: `
ضوء الصباح يتسلّل إلى الحمّام بنعومة.  
تُرغي صابون الهدوء والتوهّج بين يديها،  
وترتفع الرائحة — مشرقة، نظيفة، مُطمئِنة.

الرغوة الكريمية تلامس بشرتها كإعادة ضبط هادئة.  
ثِقل النوم يزول،  
ويبدأ إشراق لطيف بالظهور — بلا استعجال ولا قسوة.  

هذه اللحظة لها وحدها.  
ماء دافئ، نفس عميق، ذهن صافٍ.  
بداية جديدة تمتد لبقية اليوم.
    `,
    image: bodySoapOne,
    readTimeMinutes: 2,
    tags: ["body-care", "morning", "clarity"],
    tagsAr: ["عناية-الجسم", "صباح", "صفاء"]
  },

  {
    slug: "the-evening-body-balm-ritual",
    title: "The Evening Body Balm Routine",
    titleAr: "روتين بلسم الجسم المسائي",
    date: "2025-01-05",
    summary:
      "A slow evening moment that softens the skin and settles the mind — captured through the warmth of the Body Balm.",
    summaryAr:
      "لحظة مسائية هادئة تُلين البشرة وتُهدّئ الذهن — تتجلّى بدفء بلسم الجسم.",
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
    bodyAr: `
في سكون المساء، حين يبدأ العالم بالهدوء، تفتح علبة بلسم الجسم.  
دفء لطيف يعلو بينما تستقر الرائحة في الهواء — هادئة، ثابتة، ومُطمئِنة بعمق.  

تدفئ كمية صغيرة بين يديها وتتنفّس ببطء.  
ومع كل حركة على الجلد، يخفّ وطء اليوم.  
التوتر يذوب، والنَفَس يتعمّق، والجسد يشعر بالاحتواء.  

هذا الروتين ليس سباقًا نحو اللمعان —  
إنه عودة الجسد إلى نفسه بهدوء.

تظهر لمعة خفيفة، لكن ما يبقى أطول هو السكينة.  
وللحظة، يصبح كل شيء دافئًا، مُغذّى، وساكنًا على نحو جميل.
    `,
    image: bodyBalmImage,
    readTimeMinutes: 2,
    tags: ["body-care", "routine", "relaxation"],
    tagsAr: ["عناية-الجسم", "روتين", "استرخاء"]
  },

  {
    slug: "the-hands-that-do-so-much",
    title: "The Hands That Do So Much",
    titleAr: "اليدان اللتان تفعلان الكثير",
    date: "2025-01-22",
    summary:
      "A restoring routine with the Hand Balm — honoring the hands that carry responsibility, warmth, and everyday strength.",
    summaryAr:
      "روتين مُرمّم مع بلسم اليدين — تكريم لليدين اللتين تحملان المسؤولية والدفء والقوة اليومية.",
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
    bodyAr: `
يديها تحملان قصصًا —  
عملًا، ورعاية، ومسؤولية، وأفعال حب هادئة.

تدفئ كمية صغيرة من بلسم اليدين،  
وتدع الرائحة الناعمة ترتفع بينما تدلّك كل إصبع ببطء.  

البشرة تسترخي.  
الجفاف يتلاشى.  
ويعود شعور بالراحة.

ليست مجرد رطوبة —  
بل اعتراف.  
لحظة امتنان ليدين تفعلان الكثير،  
وتطلبان القليل في المقابل.

تُنهي الروتين بنَفَس عميق،  
وتشعر بالترميم والحضور والتجدد الهادئ.
    `,
    image: handBalmImage,
    readTimeMinutes: 2,
    tags: ["hand-care", "restoration", "routine"],
    tagsAr: ["عناية-اليدين", "ترميم", "روتين"]
  },

  {
    slug: "the-lip-balm-pause",
    title: "The Lip Balm Pause",
    titleAr: "وقفة بلسم الشفاه",
    date: "2025-01-20",
    summary:
      "A tiny moment of nourishment — using the Lip Balm as a reminder to slow down and breathe throughout the day.",
    summaryAr:
      "لحظة تغذية صغيرة — بلسم الشفاه كتذكير للتمهّل والتنفس طوال اليوم.",
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
    bodyAr: `
ليس كل روتين ضخمًا.  
بعضها صغير بما يكفي ليُحمل في راحة اليد.

تفتح بلسم الشفاه،  
ولثانية هادئة يتوقف اليوم.  

تمريرة لطيفة على الشفاه —  
ترطيب وراحة وعودة رقيقة للنعومة.  

يصبح طقسًا واعيًا:  
كل استخدام تذكير بالتمهّل،  
والتنفّس، وإعادة الضبط، والمتابعة بسهولة.

العالم يسرع،  
وروتينها ليس مضطرًا لذلك.
    `,
    image: lipBalmImage,
    readTimeMinutes: 1,
    tags: ["lip-care", "mindfulness", "hydration"],
    tagsAr: ["عناية-الشفاه", "ذهن-صافٍ", "ترطيب"]
  },

  {
    slug: "the-hair-growth-journey",
    title: "The Hair Growth Journey",
    titleAr: "رحلة نمو الشعر",
    date: "2025-01-08",
    summary:
      "A quiet self-care commitment — discovering strength, patience, and confidence through the Hair Growth Oil routine.",
    summaryAr:
      "التزام هادئ بالعناية الذاتية — اكتشاف القوة والصبر والثقة عبر روتين زيت نمو الشعر.",
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
    bodyAr: `
النمو نادرًا ما يكون صاخبًا.  
غالبًا يحدث في لحظات صغيرة وهادئة —  
كدفء قطرات من زيت نمو الشعر بين الكفين.

تدلّك فروة الرأس ببطء مع أنفاسها.  
رائحة الأعشاب ترتفع بهدوء وتثبّت الحواس.  
ومع كل حركة دائرية لطيفة، تدعو للدورة الدموية والدفء والتجدد.  

يتحوّل الأمر إلى أكثر من روتين للشعر.  
إنه وعد للنفس — بالثبات، والرعاية، والثقة في المسار.  

تمرّ الأسابيع، تعود الثقة، ويبدأ المرآة بسرد القصة:  
خصلات أقوى… جذور أكثر صحة… ونعومة مكتسَبة.  
    `,
    image: hairGrowthImage,
    readTimeMinutes: 3,
    tags: ["hair-care", "growth", "routine"],
    tagsAr: ["عناية-الشعر", "نمو", "روتين"]
  },

  {
    slug: "the-shine-and-confidence-ritual",
    title: "The Shine & Confidence Routine",
    titleAr: "روتين اللمعان والثقة",
    date: "2025-01-12",
    summary:
      "A moment of softness and control — using the Hair Shine & Anti-Frizz Oil to reveal natural, effortless confidence.",
    summaryAr:
      "لحظة نعومة وتحكّم — مع زيت لمعان الشعر ومضاد الهيشان لإبراز ثقة طبيعية وسهلة.",
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
    bodyAr: `
بعض الصباحات تبدأ بهدوء، مع لمس الشمس لأطراف الغرفة.  
تمد يدها لزيت لمعان الشعر ومضاد الهيشان — خفيف، حريري، بلا مجهود.

ضغطة صغيرة تنساب عبر الشعر.  
الهيشان يهدأ.  
الخصلات تلتقط الضوء.  

لا عطر ثقيل ولا لمسة قاسية —  
فقط لمعان أنيق طبيعي يرافقها طوال اليوم.  

لا تُصفّف من أجل الآخرين.  
تُصفّف من أجل الإحساس —  
تلك الثقة الهادئة التي تأتي حين تستقر الأشياء بلا إجبار.

يصبح شعرها انعكاسًا للسكينة التي تحملها.
    `,
    image: hairShineImage,
    readTimeMinutes: 2,
    tags: ["hair-care", "shine", "confidence"],
    tagsAr: ["عناية-الشعر", "لمعان", "ثقة"]
  }
];
