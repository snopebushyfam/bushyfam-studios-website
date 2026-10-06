/*
 * Feste Oberflächentexte (Navigation, Buttons, Formular) und Adressen je Sprache.
 * Inhalte wie Projekte, Leistungen und Studio-Texte kommen aus content/ (Admin).
 */
// Englisch ist die Hauptsprache (Wurzel "/"), Deutsch liegt unter "/de/".
export const DEFAULT_LANG = "en";
export const ROUTES = {
  en: { home: "/", work: "/work/", project: "/work/", cast: "/cast/", person: "/cast/", studio: "/studio/", contact: "/contact/", thanks: "/contact/thanks/", imprint: "/imprint/", privacy: "/privacy/" },
  de: { home: "/de/", work: "/de/arbeiten/", project: "/de/arbeiten/", cast: "/de/besetzung/", person: "/de/besetzung/", studio: "/de/studio/", contact: "/de/kontakt/", thanks: "/de/kontakt/danke/", imprint: "/de/impressum/", privacy: "/de/datenschutz/" },
  tr: { home: "/tr/", work: "/tr/isler/", project: "/tr/isler/", cast: "/tr/kadro/", person: "/tr/kadro/", studio: "/tr/studyo/", contact: "/tr/iletisim/", thanks: "/tr/iletisim/tesekkurler/", imprint: "/tr/kunye/", privacy: "/tr/gizlilik/" }
};
/* Sprachauswahl: Kürzel und Name in der jeweiligen Sprache */
export const LANG_NAMES = { en: "English", de: "Deutsch", tr: "Türkçe" };

/* Kategorien für Projekte – id wird im Admin gewählt */
export const CATEGORIES = [
  { id: "video", de: "Film", en: "Film", tr: "Film" },
  { id: "foto", de: "Fotografie", en: "Photography", tr: "Fotoğraf" },
  { id: "branding", de: "Logos & Branding", en: "Logos & branding", tr: "Logo & marka" },
  { id: "digital", de: "Websites & Digital", en: "Websites & digital", tr: "Web & dijital" }
];

export const T = {
  de: {
    skip: "Zum Inhalt springen", homeLabel: "Startseite", mainNav: "Hauptnavigation", mobileNav: "Mobile Navigation", footerNav: "Fußzeile",
    nav: { home: "Start", work: "Arbeiten", services: "Leistungen", studio: "Studio", contact: "Kontakt", cast: "Besetzung" },
    servicesId: "leistungen",
    cta: "Projekt anfragen", ctaSmall: "Lust auf ein Projekt?", menu: "Menü", switchTo: "Sprache wählen", language: "Sprache", legalInEnglish: "",
    seeWork: "Arbeiten ansehen", allWork: "Alle Arbeiten", seeAllWork: "Alle Arbeiten ansehen", moreAbout: "Mehr über Taha",
    film: "Film", play: "Abspielen", withSound: "mit Ton", noSound: "ohne Ton", media: "Bilder und Filme",
    portfolio: "Portfolio", workLead: "Werbeclips, Fotografie und Markengestaltung für Unternehmen.",
    castHomeTitle: "Models & Talents", castLead: "Idee, Dreh – und die passenden Gesichter dazu. Models und Talents, mit denen BushyFam Studios zusammenarbeitet.", exploreCast: "Besetzung ansehen",
    objectsTitle: "Objekte in Bewegung", objectsLead: "Produkt- und Food-Fotografie, freigestellt vor Schwarz.", pauseMotion: "Bewegung pausieren", resumeMotion: "Bewegung fortsetzen",
    viewCase: "Case ansehen", discoverStory: "Die Geschichte lesen", allProjects: "Alle Projekte",
    chooseRole: "Rolle wählen", castStatus: "{n} Personen in {cat}", castStatusOne: "1 Person in {cat}",
    allCast: "Alle in der Besetzung", nextPerson: "Weiter in der Besetzung", bookThis: "Diese Person anfragen", showreel: "Showreel", factCity: "Stadt", photos: "Fotos",
    chooseCat: "Kategorie wählen", all: "Alle", filterStatus: "{n} Arbeiten in {cat}", filterStatusOne: "1 Arbeit in {cat}",
    nextProject: "Nächstes Projekt", factClient: "Kunde", factYear: "Jahr", factDisciplines: "Disziplinen", chFilm: "Filme", chPhoto: "Fotografie", chIdentity: "Zeichen", moreWork: "Weitere Arbeiten", clients: "Ausgewählte Kunden & Kooperationen", founder: "Gründer",
    process: "Zusammenarbeit", ending: "Abschluss", newTab: "(öffnet in neuem Tab)",
    direct: "Lieber direkt?",
    backToSite: "Zurück zur Startseite", imprint: "Impressum", privacy: "Datenschutz", inPreparation: "Diese Seite ist in Vorbereitung.",
    notFound: "Seite nicht gefunden", notFoundText: "Diese Adresse gibt es nicht (mehr).", backHome: "Zur Startseite",
    form: {
      name: "Name", email: "E-Mail", company: "Unternehmen", services: "Worum geht es?", talent: "Person aus der Besetzung", message: "Erzähl uns von deinem Projekt",
      timeframe: "Zeitraum", budget: "Budgetrahmen", required: "Pflichtfeld", optional: "optional", submit: "Anfrage senden",
      hp: "Bitte nicht ausfüllen", aboutPerson: "Anfrage zu",
      privacyNote: "Deine Angaben werden nur zur Bearbeitung deiner Anfrage verwendet. Mehr dazu im",
      sending: "Wird gesendet …", successTitle: "Danke – deine Anfrage ist angekommen.", success: "Taha meldet sich persönlich bei dir.",
      failure: "Die Anfrage konnte nicht gesendet werden. Bitte versuch es gleich noch einmal – oder schreib uns direkt:", failureNoWa: "Die Anfrage konnte nicht gesendet werden. Bitte versuch es gleich noch einmal.",
      another: "Weitere Anfrage schreiben",
      summaryOne: "1 Feld braucht noch deine Angabe:", summaryMany: "{n} Felder brauchen noch deine Angabe:",
      errName: "Bitte gib deinen Namen ein.", errEmail: "Bitte gib deine E-Mail-Adresse ein.", errEmailFormat: "Bitte gib eine gültige E-Mail-Adresse ein, z. B. name@firma.de.", errMessage: "Bitte beschreibe kurz dein Projekt."
    }
  },
  en: {
    skip: "Skip to content", homeLabel: "Home", mainNav: "Main navigation", mobileNav: "Mobile navigation", footerNav: "Footer",
    nav: { home: "Home", work: "Work", services: "Services", studio: "Studio", contact: "Contact", cast: "Cast" },
    servicesId: "services",
    cta: "Start a project", ctaSmall: "Have a project in mind?", menu: "Menu", switchTo: "Choose language", language: "Language", legalInEnglish: "",
    seeWork: "See the work", allWork: "All work", seeAllWork: "See all work", moreAbout: "More about Taha",
    film: "Film", play: "Play", withSound: "with sound", noSound: "no sound", media: "Images and films",
    portfolio: "Portfolio", workLead: "Commercials, photography and brand design for businesses.",
    castHomeTitle: "Models & Actors", castLead: "The idea, the shoot – and the right faces for it. Models and talents BushyFam Studios works with.", exploreCast: "Explore the cast",
    objectsTitle: "Objects in Motion", objectsLead: "Product and food photography, isolated against black.", pauseMotion: "Pause motion", resumeMotion: "Resume motion",
    viewCase: "View case", discoverStory: "Discover the story", allProjects: "All projects",
    chooseRole: "Choose a role", castStatus: "{n} people in {cat}", castStatusOne: "1 person in {cat}",
    allCast: "All of the cast", nextPerson: "Next in the cast", bookThis: "Enquire about this person", showreel: "Showreel", factCity: "City", photos: "Photos",
    chooseCat: "Choose a category", all: "All", filterStatus: "{n} projects in {cat}", filterStatusOne: "1 project in {cat}",
    nextProject: "Next project", factClient: "Client", factYear: "Year", factDisciplines: "Disciplines", chFilm: "Films", chPhoto: "Photography", chIdentity: "Marks", moreWork: "More work", clients: "Selected clients & collaborations", founder: "Founder",
    process: "Working together", ending: "Finale", newTab: "(opens in a new tab)",
    direct: "Prefer to go direct?",
    backToSite: "Back to the homepage", imprint: "Imprint", privacy: "Privacy", inPreparation: "This page is being prepared.",
    notFound: "Page not found", notFoundText: "This address does not exist (anymore).", backHome: "Back to the homepage",
    form: {
      name: "Name", email: "Email", company: "Company", services: "What is it about?", talent: "Person from the cast", message: "Tell us about your project",
      timeframe: "Timeframe", budget: "Budget range", required: "required", optional: "optional", submit: "Send enquiry",
      hp: "Please leave empty", aboutPerson: "Enquiry about",
      privacyNote: "Your details are only used to handle your enquiry. More in the",
      sending: "Sending …", successTitle: "Thank you – your enquiry has arrived.", success: "Taha will get back to you personally.",
      failure: "Your enquiry couldn't be sent. Please try again in a moment – or message us directly:", failureNoWa: "Your enquiry couldn't be sent. Please try again in a moment.",
      another: "Send another enquiry",
      summaryOne: "1 field still needs your input:", summaryMany: "{n} fields still need your input:",
      errName: "Please enter your name.", errEmail: "Please enter your email address.", errEmailFormat: "Please enter a valid email address, e.g. name@company.com.", errMessage: "Please briefly describe your project."
    }
  },
  tr: {
    skip: "İçeriğe geç", homeLabel: "Ana sayfa", mainNav: "Ana menü", mobileNav: "Mobil menü", footerNav: "Alt bilgi",
    nav: { home: "Ana sayfa", work: "İşler", services: "Hizmetler", studio: "Stüdyo", contact: "İletişim", cast: "Kadro" },
    servicesId: "hizmetler",
    cta: "Proje başlat", ctaSmall: "Aklında bir proje mi var?", menu: "Menü", switchTo: "Dil seç", language: "Dil",
    seeWork: "İşleri gör", allWork: "Tüm işler", seeAllWork: "Tüm işleri gör", moreAbout: "Taha hakkında daha fazlası",
    film: "Film", play: "Oynat", withSound: "sesli", noSound: "sessiz", media: "Görseller ve filmler",
    portfolio: "Portfolyo", workLead: "İşletmeler için reklam filmleri, fotoğraf ve marka tasarımı.",
    castHomeTitle: "Modeller & Oyuncular", castLead: "Fikir, çekim – ve ona uygun yüzler. BushyFam Studios’un birlikte çalıştığı modeller ve yetenekler.", exploreCast: "Kadroyu keşfet",
    objectsTitle: "Hareketli Objeler", objectsLead: "Siyah fon üzerinde dekupe ürün ve yemek fotoğrafçılığı.", pauseMotion: "Hareketi durdur", resumeMotion: "Hareketi sürdür",
    viewCase: "Projeyi gör", discoverStory: "Hikâyeyi keşfet", allProjects: "Tüm projeler",
    chooseRole: "Rol seç", castStatus: "{cat} içinde {n} kişi", castStatusOne: "{cat} içinde 1 kişi",
    allCast: "Tüm kadro", nextPerson: "Kadrodaki sıradaki", bookThis: "Bu kişi için talepte bulun", showreel: "Showreel", factCity: "Şehir", photos: "Fotoğraflar",
    chooseCat: "Kategori seç", all: "Tümü", filterStatus: "{cat} içinde {n} iş", filterStatusOne: "{cat} içinde 1 iş",
    nextProject: "Sonraki proje", factClient: "Müşteri", factYear: "Yıl", factDisciplines: "Disiplinler", chFilm: "Filmler", chPhoto: "Fotoğraf", chIdentity: "İşaretler", moreWork: "Diğer işler", clients: "Seçilmiş müşteriler & iş birlikleri", founder: "Kurucu",
    process: "Birlikte çalışmak", ending: "Final", newTab: "(yeni sekmede açılır)",
    direct: "Doğrudan mı yazmak istersin?",
    backToSite: "Ana sayfaya dön", imprint: "Künye", privacy: "Gizlilik", inPreparation: "Bu sayfa hazırlanıyor.", legalInEnglish: "Bu sayfa şu anda yalnızca İngilizce olarak mevcuttur.",
    notFound: "Sayfa bulunamadı", notFoundText: "Bu adres mevcut değil (artık).", backHome: "Ana sayfaya dön",
    form: {
      name: "Ad", email: "E-posta", company: "Şirket", services: "Konu ne?", talent: "Kadrodan kişi", message: "Bize projeni anlat",
      timeframe: "Zaman aralığı", budget: "Bütçe aralığı", required: "zorunlu", optional: "isteğe bağlı", submit: "Talebi gönder",
      hp: "Lütfen boş bırak", aboutPerson: "Talep konusu",
      privacyNote: "Bilgilerin yalnızca talebini işlemek için kullanılır. Ayrıntılar:",
      sending: "Gönderiliyor …", successTitle: "Teşekkürler – talebin ulaştı.", success: "Taha sana bizzat dönüş yapacak.",
      failure: "Talebin gönderilemedi. Lütfen birazdan tekrar dene – ya da bize doğrudan yaz:", failureNoWa: "Talebin gönderilemedi. Lütfen birazdan tekrar dene.",
      another: "Yeni bir talep yaz",
      summaryOne: "1 alan hâlâ bilgi bekliyor:", summaryMany: "{n} alan hâlâ bilgi bekliyor:",
      errName: "Lütfen adını gir.", errEmail: "Lütfen e-posta adresini gir.", errEmailFormat: "Lütfen geçerli bir e-posta adresi gir, ör. ad@firma.com.", errMessage: "Lütfen projeni kısaca anlat."
    }
  }
};
