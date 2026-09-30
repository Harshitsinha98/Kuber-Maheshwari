export const site = {
  name: "Kuber Maheshwari",
  nameHi: "कुबेर माहेश्वरी",
  legalName: "Ankit Maheshwari",
  studio: "K M Audio Productions",
  tagline: "Bhajan · Sundarkand · Bhakti Fusion",
  city: "Indore, Madhya Pradesh",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  phones: [
    { display: "+91 98277 51400", tel: "+919827751400", wa: "919827751400" },
    { display: "+91 94253 31165", tel: "+919425331165", wa: "919425331165" },
  ],
  // Update these to the real handles — used for follow buttons, the embeds and SEO.
  social: {
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://www.instagram.com/",
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL || "https://www.facebook.com/",
    youtube: process.env.NEXT_PUBLIC_YOUTUBE_URL || "https://www.youtube.com/",
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
    "K M Audio Productions",
  ],
};

export const waLink = (text = "नमस्ते कुबेर जी, मुझे एक आयोजन के लिए जानकारी चाहिए।", i = 0) =>
  `https://wa.me/${site.phones[i].wa}?text=${encodeURIComponent(text)}`;

export const services = [
  {
    slug: "sundarkand",
    hi: "संगीतमय श्री सुन्दरकाण्ड",
    en: "Musical Sundarkand",
    note: "भावार्थ सहित",
    desc: "Shri Sundarkand as a live musical presentation, with the meaning (bhavarth) explained so every devotee understands, not just listens.",
    image: "/images/gallery/kuber-06.webp",
    signature: true,
  },
  {
    slug: "bhajan-sandhya",
    hi: "भजन संध्या",
    en: "Bhajan Sandhya",
    desc: "An evening of classic and new bhajans, sung live, for temples, societies and family gatherings.",
    image: "/images/gallery/kuber-04.webp",
  },
  {
    slug: "bhajan-clubbing",
    hi: "भजन क्लबिंग",
    en: "Bhajan Clubbing",
    desc: "Devotion with concert energy: big sound, lights and a crowd that sings and dances along. Made for youth festivals and big stages.",
    image: "/images/gallery/kuber-01.webp",
  },
  {
    slug: "bhakti-fusion",
    hi: "भक्ति फ्यूज़न",
    en: "Bhakti Fusion",
    desc: "Traditional bhajans in modern arrangements, mixing Indian roots with contemporary sounds.",
    image: "/images/gallery/kuber-43.webp",
  },
  {
    slug: "jagran-kirtan",
    hi: "माता जागरण · श्याम कीर्तन",
    en: "Jagran & Kirtan",
    desc: "All-night jagrans and Shyam kirtans, performed with the discipline and bhaav of the tradition.",
    image: "/images/gallery/kuber-14.webp",
  },
  {
    slug: "weddings",
    hi: "वैवाहिक एवं पारिवारिक आयोजन",
    en: "Weddings & Family Functions",
    desc: "Devotional and celebratory music for weddings and the family's special occasions.",
    image: "/images/gallery/kuber-41.webp",
  },
  {
    slug: "studio",
    hi: "K M Audio Productions",
    en: "Recording Studio",
    desc: "Recording, music production and arrangement for bhajans, albums and devotional content at K M Audio Productions.",
    image: "/images/gallery/kuber-08.webp",
  },
];

export const journey = [
  {
    year: "बचपन",
    title: "पिताजी के साथ भजन-कीर्तन",
    text: "Grew up going to bhajan-kirtans with his father. Religious gatherings, more than anything else, shaped his ear. By class 9th–10th, music had become his calling.",
  },
  {
    year: "2008",
    title: "सिंथेसाइज़र वादक के रूप में शुरुआत",
    text: "Right after the 12th board exams, he started playing synthesizer at bhajans, Sundarkand, Mata Jagran, Shyam Kirtan and weddings.",
  },
  {
    year: "2014 – 2018",
    title: "देश के दिग्गज भजन गायकों के साथ",
    text: "Toured every corner of the country as synthesizer player for renowned bhajan singers including Lakhbir Singh Lakkha, Baba Rasika Pagal, Uma Lahari and Reshmi Sharma. He saw, heard and learnt from singers of every kind.",
  },
  {
    year: "2018 — आज",
    title: "एक व्यवस्थित भजन गायक",
    text: "Stepped forward as a bhajan singer in his own right, known today for Sangeetmay Shri Sundarkand (with bhavarth). He also runs his recording studio, K M Audio Productions.",
  },
];
