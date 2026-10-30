export const site = {
  name: "Kuber Maheshwari",
  nameHi: "कुबेर माहेश्वरी",
  legalName: "Ankit Maheshwari",
  tagline: "Bhajan · Sundarkand · Bhakti Fusion",
  city: "Indore, Madhya Pradesh",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  phones: [
    { display: "+91 98277 51400", tel: "+919827751400", wa: "919827751400" },
  ],
  // Official handles (from his Instagram bio). Env vars can still override them.
  social: {
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://www.instagram.com/kuber_maheshwari_bhajan/",
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL || "https://www.facebook.com/maheshwariankit21",
    youtube: process.env.NEXT_PUBLIC_YOUTUBE_URL || "https://www.youtube.com/@KuberMaheshwariBhajan",
  },
  keywords: [
    "Kuber Maheshwari",
    "Kuber Maheshwari Indore",
    "कुबेर माहेश्वरी",
    "Sundarkand singer",
    "Sundarkand singer Indore",
    "Musical Sundarkand",
    "Bhajan singer Indore",
    "Bhajan Clubbing",
    "Bhakti Fusion",
    "Indore singer",
    "Mata Jagran singer",
    "Shyam Kirtan",
  ],
};

export const waLink = (text = "नमस्ते कुबेर जी, मुझे एक आयोजन के लिए जानकारी चाहिए।", i = 0) =>
  `https://wa.me/${site.phones[i].wa}?text=${encodeURIComponent(text)}`;

// Six visually different, high-resolution photos (2000px+), so no two services look alike.
// `focus` is the CSS object-position that keeps his face in frame when cropped.
export const services = [
  {
    slug: "sundarkand",
    hi: "संगीतमय श्री सुन्दरकाण्ड",
    en: "Musical Sundarkand",
    note: "भावार्थ सहित",
    desc: "Shri Sundarkand as a live musical presentation, with the meaning (bhavarth) explained so every devotee understands, not just listens.",
    image: "/images/gallery/kuber-40.webp",
    focus: "50% 62%",
    signature: true,
  },
  {
    slug: "bhajan-sandhya",
    hi: "भजन संध्या",
    en: "Bhajan Sandhya",
    desc: "An evening of classic and new bhajans, sung live, for temples, societies and family gatherings.",
    image: "/images/gallery/kuber-25.webp",
    focus: "48% 22%",
  },
  {
    slug: "bhajan-clubbing",
    hi: "भजन क्लबिंग",
    en: "Bhajan Clubbing",
    desc: "Devotion with concert energy: big sound, lights and a crowd that sings and dances along. Made for youth festivals and big stages.",
    image: "/images/gallery/kuber-02.webp",
    focus: "42% 22%",
  },
  {
    slug: "bhakti-fusion",
    hi: "भक्ति फ्यूज़न",
    en: "Bhakti Fusion",
    desc: "Traditional bhajans in modern arrangements, mixing Indian roots with contemporary sounds.",
    image: "/images/gallery/kuber-39.webp",
    focus: "50% 18%",
  },
  {
    slug: "jagran-kirtan",
    hi: "माता जागरण · श्याम कीर्तन",
    en: "Jagran & Kirtan",
    desc: "All-night jagrans and Shyam kirtans, performed with the discipline and bhaav of the tradition.",
    image: "/images/gallery/kuber-14.webp",
    focus: "50% 35%",
  },
  {
    slug: "weddings",
    hi: "वैवाहिक एवं पारिवारिक आयोजन",
    en: "Weddings & Family Functions",
    desc: "Devotional and celebratory music for weddings and the family's special occasions.",
    image: "/images/gallery/kuber-28.webp",
    focus: "45% 18%",
  },
];

export const journey = [
  {
    year: "बचपन",
    title: "पिताजी के साथ भजन-कीर्तन",
    text: "बचपन से ही पिताजी के साथ भजन-कीर्तन में आना-जाना लगा रहता था। अन्य आयोजनों की अपेक्षा धार्मिक आयोजनों में उपस्थिति अधिक रहती थी। यही कारण था कि कक्षा 9वीं–10वीं तक आते-आते संगीत के प्रति रुचि बहुत प्रबल हो चुकी थी।",
  },
  {
    year: "2008",
    title: "सिंथेसाइज़र वादक के रूप में शुरुआत",
    text: "12वीं की परीक्षा के बाद से ही संगीतमय आयोजनों में सिंथेसाइज़र बजाना शुरू किया: भजन, सुंदरकांड, माता जागरण, श्याम कीर्तन एवं वैवाहिक आयोजन।",
  },
  {
    year: "2014–18",
    title: "देश के दिग्गज भजन गायकों के साथ",
    text: "लखबीर सिंह लक्खा, बाबा रसिका पागल, उमा लहरी, रेशमी शर्मा जैसे देश के सुप्रसिद्ध भजन गायक-गायिकाओं के साथ सिंथेसाइज़र वादक के रूप में देश के कोने-कोने में अपनी सेवाएँ दीं।",
    quote: "इतने समय में मैंने अच्छे-बुरे, छोटे-बड़े, सिद्ध-प्रसिद्ध बहुत से गायक-गायिकाओं को देखा, सुना और समझा।",
  },
  {
    year: "2018 से आज",
    title: "एक व्यवस्थित भजन गायक",
    text: "2018 से अब तक, स्वयं को एक व्यवस्थित भजन गायक के रूप में स्थापित करने की साधना जारी है। आज इनकी विशेष पहचान है संगीतमय श्री सुन्दरकाण्ड प्रस्तुति (भावार्थ सहित)।",
  },
];
