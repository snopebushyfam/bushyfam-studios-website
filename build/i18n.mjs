/*
 * Feste Oberflächentexte (Navigation, Buttons, Formular) und Adressen je Sprache.
 * Inhalte wie Projekte, Leistungen und Studio-Texte kommen aus content/ (Admin).
 */
// Englisch ist die Hauptsprache (Wurzel "/"), Deutsch liegt unter "/de/".
export const DEFAULT_LANG = "en";
export const ROUTES = {
  en: { home: "/", work: "/work/", project: "/work/", cast: "/cast/", person: "/cast/", studio: "/studio/", contact: "/contact/", thanks: "/contact/thanks/", imprint: "/imprint/", privacy: "/privacy/" },
  de: { home: "/de/", work: "/de/arbeiten/", project: "/de/arbeiten/", cast: "/de/besetzung/", person: "/de/besetzung/", studio: "/de/studio/", contact: "/de/kontakt/", thanks: "/de/kontakt/danke/", imprint: "/de/impressum/", privacy: "/de/datenschutz/" }
};

/* Kategorien für Projekte – id wird im Admin gewählt */
export const CATEGORIES = [
  { id: "video", de: "Film", en: "Film" },
  { id: "foto", de: "Fotografie", en: "Photography" },
  { id: "branding", de: "Logos & Branding", en: "Logos & branding" },
  { id: "digital", de: "Websites & Digital", en: "Websites & digital" }
];

export const T = {
  de: {
    skip: "Zum Inhalt springen", homeLabel: "Startseite", mainNav: "Hauptnavigation", mobileNav: "Mobile Navigation", footerNav: "Fußzeile",
    nav: { home: "Start", work: "Arbeiten", services: "Leistungen", studio: "Studio", contact: "Kontakt", cast: "Besetzung" },
    servicesId: "leistungen",
    cta: "Projekt anfragen", ctaSmall: "Lust auf ein Projekt?", menu: "Menü", switchTo: "English version",
    seeWork: "Arbeiten ansehen", allWork: "Alle Arbeiten", seeAllWork: "Alle Arbeiten ansehen", moreAbout: "Mehr über Taha",
    film: "Film", play: "Abspielen", withSound: "mit Ton", noSound: "ohne Ton", media: "Bilder und Filme",
    portfolio: "Portfolio", workLead: "Werbeclips, Fotografie und Markengestaltung für Unternehmen.",
    castLead: "Models und Talents, mit denen BushyFam Studios zusammenarbeitet. Sag einfach, wer zu deinem Projekt passt.",
    objectsTitle: "Objekte in Bewegung", objectsLead: "Produkt- und Food-Fotografie, freigestellt vor Schwarz.", pauseMotion: "Bewegung pausieren", resumeMotion: "Bewegung fortsetzen",
    viewCase: "Case ansehen", discoverStory: "Die Geschichte lesen", allProjects: "Alle Projekte",
    chooseRole: "Rolle wählen", castStatus: "{n} Personen in {cat}", castStatusOne: "1 Person in {cat}",
    allCast: "Alle in der Besetzung", nextPerson: "Weiter in der Besetzung", bookThis: "Diese Person anfragen", photos: "Fotos",
    chooseCat: "Kategorie wählen", all: "Alle", filterStatus: "{n} Arbeiten in {cat}", filterStatusOne: "1 Arbeit in {cat}",
    nextProject: "Nächstes Projekt", factClient: "Kunde", factYear: "Jahr", factDisciplines: "Disziplinen", chFilm: "Filme", chPhoto: "Fotografie", chIdentity: "Zeichen", moreWork: "Weitere Arbeiten", clients: "Ausgewählte Kunden & Kooperationen", founder: "Gründer",
    process: "Zusammenarbeit", ending: "Abschluss", newTab: "(öffnet in neuem Tab)",
    direct: "Lieber direkt? Schreib uns:",
    backToSite: "Zurück zur Startseite", imprint: "Impressum", privacy: "Datenschutz", inPreparation: "Diese Seite ist in Vorbereitung.",
    notFound: "Seite nicht gefunden", notFoundText: "Diese Adresse gibt es nicht (mehr).", backHome: "Zur Startseite",
    form: {
      name: "Name", email: "E-Mail", company: "Unternehmen", services: "Was brauchst du?", message: "Projektbeschreibung",
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
    cta: "Start a project", ctaSmall: "Have a project in mind?", menu: "Menu", switchTo: "Deutsche Version",
    seeWork: "See the work", allWork: "All work", seeAllWork: "See all work", moreAbout: "More about Taha",
    film: "Film", play: "Play", withSound: "with sound", noSound: "no sound", media: "Images and films",
    portfolio: "Portfolio", workLead: "Commercials, photography and brand design for businesses.",
    castLead: "Models and talents BushyFam Studios works with. Just tell us who fits your project.",
    objectsTitle: "Objects in Motion", objectsLead: "Product and food photography, isolated against black.", pauseMotion: "Pause motion", resumeMotion: "Resume motion",
    viewCase: "View case", discoverStory: "Discover the story", allProjects: "All projects",
    chooseRole: "Choose a role", castStatus: "{n} people in {cat}", castStatusOne: "1 person in {cat}",
    allCast: "All of the cast", nextPerson: "Next in the cast", bookThis: "Enquire about this person", photos: "Photos",
    chooseCat: "Choose a category", all: "All", filterStatus: "{n} projects in {cat}", filterStatusOne: "1 project in {cat}",
    nextProject: "Next project", factClient: "Client", factYear: "Year", factDisciplines: "Disciplines", chFilm: "Films", chPhoto: "Photography", chIdentity: "Marks", moreWork: "More work", clients: "Selected clients & collaborations", founder: "Founder",
    process: "Working together", ending: "Finale", newTab: "(opens in a new tab)",
    direct: "Prefer to go direct? Message us:",
    backToSite: "Back to the homepage", imprint: "Imprint", privacy: "Privacy", inPreparation: "This page is being prepared.",
    notFound: "Page not found", notFoundText: "This address does not exist (anymore).", backHome: "Back to the homepage",
    form: {
      name: "Name", email: "Email", company: "Company", services: "What do you need?", message: "About your project",
      timeframe: "Timeframe", budget: "Budget range", required: "required", optional: "optional", submit: "Send enquiry",
      hp: "Please leave empty", aboutPerson: "Enquiry about",
      privacyNote: "Your details are only used to handle your enquiry. More in the",
      sending: "Sending …", successTitle: "Thank you – your enquiry has arrived.", success: "Taha will get back to you personally.",
      failure: "Your enquiry couldn't be sent. Please try again in a moment – or message us directly:", failureNoWa: "Your enquiry couldn't be sent. Please try again in a moment.",
      another: "Send another enquiry",
      summaryOne: "1 field still needs your input:", summaryMany: "{n} fields still need your input:",
      errName: "Please enter your name.", errEmail: "Please enter your email address.", errEmailFormat: "Please enter a valid email address, e.g. name@company.com.", errMessage: "Please briefly describe your project."
    }
  }
};
