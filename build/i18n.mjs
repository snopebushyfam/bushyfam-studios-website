/*
 * Feste Oberflächentexte (Navigation, Buttons, Formular) und Adressen je Sprache.
 * Inhalte wie Projekte, Leistungen und Studio-Texte kommen aus content/ (Admin).
 */
// Deutsch ist die Hauptsprache (Wurzel "/"), Englisch liegt unter "/en/".
// Türkisch (/tr/) ist eingefroren: erreichbar, aber noindex, nicht in Sitemap und Sprachwahl.
export const DEFAULT_LANG = "de";
export const PUBLIC_LANGS = ["de", "en"];
export const ROUTES = {
  en: { home: "/en/", work: "/en/work/", project: "/en/work/", cast: "/en/cast/", person: "/en/cast/", studio: "/en/studio/", contact: "/en/contact/", thanks: "/en/contact/thanks/", imprint: "/en/imprint/", privacy: "/en/privacy/" },
  de: { home: "/", work: "/arbeiten/", project: "/arbeiten/", cast: "/besetzung/", person: "/besetzung/", studio: "/studio/", contact: "/kontakt/", thanks: "/kontakt/danke/", imprint: "/impressum/", privacy: "/datenschutz/" },
  tr: { home: "/tr/", work: "/tr/isler/", project: "/tr/isler/", cast: "/tr/kadro/", person: "/tr/kadro/", studio: "/tr/studyo/", contact: "/tr/iletisim/", thanks: "/tr/iletisim/tesekkurler/", imprint: "/tr/kunye/", privacy: "/tr/gizlilik/" }
};
/* Frühere Adressen (bis zur Umstellung auf Deutsch als Hauptsprache) – daraus entstehen die 301-Weiterleitungen */
export const LEGACY_ROUTES = {
  en: { work: "/work/", cast: "/cast/", contact: "/contact/", thanks: "/contact/thanks/", imprint: "/imprint/", privacy: "/privacy/" },
  de: { home: "/de/", work: "/de/arbeiten/", cast: "/de/besetzung/", studio: "/de/studio/", contact: "/de/kontakt/", thanks: "/de/kontakt/danke/", imprint: "/de/impressum/", privacy: "/de/datenschutz/" }
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
    ot: { cueTitle: "Steig ein.", cueText: "Scroll, und die Kamera fährt los.", showreel: "Showreel", showreelLong: "Showreel ansehen", close: "Schließen",
      soundOn: "Ton an", soundOff: "Ton aus", soundLabel: "Ton an oder aus", timeline: "Kapitel-Zeitleiste", jumpTo: "Springe zu",
      chIntro: "Einstieg", chWork: "Arbeiten", chServices: "Leistungen", chCast: "Besetzung", chLaunch: "Anfrage", chStudio: "Studio", chExit: "Kontakt",
      workLead: "Hinter der Pupille liegt alles, was wir gedreht, fotografiert und gestaltet haben. Scroll weiter, du fliegst mitten hindurch.",
      moreWork: "Noch mehr Arbeiten", endTitle: "Und was machen wir für dich?", qBudget: "Ungefähres Budget?", budgets: ["Unter 1.000 €", "1.000–3.000 €", "Über 3.000 €", "Weiß ich noch nicht"], budgetMsg: "Budget: {b}.",
      freeCall: "Erstgespräch kostenlos & unverbindlich.", directMe: "Du sprichst direkt mit mir – {name}, Gründer.", sendNow: "Per WhatsApp senden", orMail: "oder per E-Mail",
      clientsLead: "Von Gastronomie bis Immobilienverwaltung – für Unternehmen in ganz Deutschland.", castLeadHome: "Für deinen Dreh: Models und Darsteller aus unserem Netzwerk – ohne eigenes Casting.", mobileWa: "WhatsApp", fromProject: "Aus dem Projekt", ownFilm: "UFO-Cockpit", ownFilmMeta: "Eigenproduktion · Kurzfilm",
      ownFilmText: "Unser eigener Kurzfilm: von der Raumschiff-Kabine bis in die Pupille. Du bist gerade durch ihn hindurchgeflogen.",
      channel: "Kanal {n} von {m}", clientsTitle: "Schon an Bord", castRole: "Model & Schauspiel",
      launchTitle: "Startklar in 48 Stunden", launchLead: "Stell dein Projekt zusammen. Der Flugplan rechnet live mit, wann du was von uns bekommst, und schreibt die Nachricht für dich vor.",
      qWhat: "Was brauchst du?", qWhen: "Wann soll es losgehen?", qNote: "Ein Satz zum Projekt", notePh: "Zum Beispiel: Wir eröffnen im Dezember ein Café und brauchen Reels für Instagram.",
      when: ["So bald wie möglich", "Nächsten Monat", "Ich plane noch"], plan: "Flugplan", now: "Jetzt", today: "Heute, {t} Uhr", mission: "Mission", start: "Start", open: "noch offen",
      launch: "Start­sequenz", ready: "Start­klar", go: "Los!", consoleTitle: "Alles eingestellt?", consoleText: "Drück den Knopf. Danach schickst du die vorgeschriebene Nachricht per WhatsApp oder E-Mail ab.",
      readyText: "Bereit zum Senden. Deine Nachricht:", sendWa: "Per WhatsApp senden", sendMail: "Per E-Mail", copy: "Kopieren", copied: "Kopiert", formLink: "Lieber das ausführliche Formular",
      msg: "Hallo BushyFam, ich interessiere mich für: {list}. Start: {when}.", subject: "Projektanfrage: {list}", locale: "de-DE", draft: "" },
    cta: "Projekt anfragen", ctaSmall: "Lust auf ein Projekt?", menu: "Menü", switchTo: "Sprache wählen", language: "Sprache", legalInEnglish: "",
    seeWork: "Arbeiten ansehen", allWork: "Alle Arbeiten", seeAllWork: "Alle Arbeiten ansehen", moreAbout: "Mehr über Taha",
    film: "Film", play: "Abspielen", withSound: "mit Ton", noSound: "ohne Ton", media: "Bilder und Filme",
    portfolio: "Portfolio", workLead: "Werbeclips, Fotografie und Markengestaltung für Unternehmen.",
    castHomeTitle: "Models & Talents", castLead: "Idee, Dreh – und die passenden Gesichter dazu. Models und Talents, mit denen BushyFam Studios zusammenarbeitet.", exploreCast: "Besetzung ansehen", pkgTitle: "Pakete", pkgEnquire: "Paket anfragen", priceFrom: "ab {p} €", castNote: "Die Talente werden für Produktionen von BushyFam Studios besetzt.",
    objectsTitle: "Objekte in Bewegung", objectsLead: "Produkt- und Food-Fotografie, freigestellt vor Schwarz.", pauseMotion: "Bewegung pausieren", resumeMotion: "Bewegung fortsetzen",
    viewCase: "Case ansehen", discoverStory: "Die Geschichte lesen", allProjects: "Alle Projekte",
    chooseRole: "Rolle wählen", castStatus: "{n} Personen in {cat}", castStatusOne: "1 Person in {cat}",
    allCast: "Alle in der Besetzung", nextPerson: "Weiter in der Besetzung", bookThis: "Diese Person anfragen", showreel: "Showreel", factCity: "Stadt", photos: "Fotos",
    chooseCat: "Kategorie wählen", all: "Alle", filterStatus: "{n} Arbeiten in {cat}", filterStatusOne: "1 Arbeit in {cat}",
    nextProject: "Nächstes Projekt", factClient: "Kunde", factIndustry: "Branche", caseTask: "Aufgabe", caseSolution: "Lösung", caseResult: "Ergebnis", factYear: "Jahr", factDisciplines: "Disziplinen", chFilm: "Filme", chPhoto: "Fotografie", chIdentity: "Zeichen", moreWork: "Weitere Arbeiten", clients: "Ausgewählte Kunden & Kooperationen", founder: "Gründer",
    process: "Zusammenarbeit", ending: "Abschluss", newTab: "(öffnet in neuem Tab)",
    direct: "Lieber direkt?",
    backToSite: "Zurück zur Startseite", imprint: "Impressum", privacy: "Datenschutz", inPreparation: "Diese Seite ist in Vorbereitung.",
    notFound: "Seite nicht gefunden", notFoundText: "Diese Adresse gibt es nicht (mehr).", backHome: "Zur Startseite",
    form: {
      name: "Name", email: "E-Mail", company: "Unternehmen", services: "Worum geht es?", talent: "Person aus der Besetzung", package: "Paket", packageNone: "Kein bestimmtes Paket", message: "Erzähl uns von deinem Projekt",
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
    ot: { cueTitle: "Step in.", cueText: "Scroll and the camera starts moving.", showreel: "Showreel", showreelLong: "Watch the showreel", close: "Close",
      soundOn: "Sound on", soundOff: "Sound off", soundLabel: "Toggle sound", timeline: "Chapter timeline", jumpTo: "Jump to",
      chIntro: "Intro", chWork: "Work", chServices: "Services", chCast: "Cast", chLaunch: "Enquiry", chStudio: "Studio", chExit: "Contact",
      workLead: "Behind the pupil lies everything we have filmed, photographed and designed. Keep scrolling and fly right through it.",
      moreWork: "More work", endTitle: "So what shall we make for you?", qBudget: "Rough budget?", budgets: ["Under €1,000", "€1,000–3,000", "Over €3,000", "Not sure yet"], budgetMsg: "Budget: {b}.",
      freeCall: "First call free and without obligation.", directMe: "You talk directly to me – {name}, founder.", sendNow: "Send via WhatsApp", orMail: "or by email",
      clientsLead: "From hospitality to property management – for businesses across Germany.", castLeadHome: "For your shoot: models and actors from our network – no casting of your own.", mobileWa: "WhatsApp", fromProject: "From the project", ownFilm: "UFO Cockpit", ownFilmMeta: "Own production · Short film",
      ownFilmText: "Our own short film: from the spaceship cabin into the pupil. You just flew through it.",
      channel: "Channel {n} of {m}", clientsTitle: "Already on board", castRole: "Model & acting",
      launchTitle: "Ready in 48 hours", launchLead: "Put your project together. The flight plan works out live when you get what from us and drafts the message for you.",
      qWhat: "What do you need?", qWhen: "When should it start?", qNote: "One sentence about the project", notePh: "For example: we are opening a café in December and need reels for Instagram.",
      when: ["As soon as possible", "Next month", "Still planning"], plan: "Flight plan", now: "Now", today: "Today, {t}", mission: "Mission", start: "Start", open: "still open",
      launch: "Launch sequence", ready: "Ready", go: "Go!", consoleTitle: "All set?", consoleText: "Press the button. Then send the drafted message via WhatsApp or email.",
      readyText: "Ready to send. Your message:", sendWa: "Send via WhatsApp", sendMail: "Send via email", copy: "Copy", copied: "Copied", formLink: "Prefer the full form",
      msg: "Hi BushyFam, I am interested in: {list}. Start: {when}.", subject: "Project enquiry: {list}", locale: "en-GB", draft: "" },
    cta: "Start a project", ctaSmall: "Have a project in mind?", menu: "Menu", switchTo: "Choose language", language: "Language", legalInEnglish: "",
    seeWork: "See the work", allWork: "All work", seeAllWork: "See all work", moreAbout: "More about Taha",
    film: "Film", play: "Play", withSound: "with sound", noSound: "no sound", media: "Images and films",
    portfolio: "Portfolio", workLead: "Commercials, photography and brand design for businesses.",
    castHomeTitle: "Models & Actors", castLead: "The idea, the shoot – and the right faces for it. Models and talents BushyFam Studios works with.", exploreCast: "Explore the cast", pkgTitle: "Packages", pkgEnquire: "Enquire about this package", priceFrom: "from €{p}", castNote: "The talent is cast for productions by BushyFam Studios.",
    objectsTitle: "Objects in Motion", objectsLead: "Product and food photography, isolated against black.", pauseMotion: "Pause motion", resumeMotion: "Resume motion",
    viewCase: "View case", discoverStory: "Discover the story", allProjects: "All projects",
    chooseRole: "Choose a role", castStatus: "{n} people in {cat}", castStatusOne: "1 person in {cat}",
    allCast: "All of the cast", nextPerson: "Next in the cast", bookThis: "Enquire about this person", showreel: "Showreel", factCity: "City", photos: "Photos",
    chooseCat: "Choose a category", all: "All", filterStatus: "{n} projects in {cat}", filterStatusOne: "1 project in {cat}",
    nextProject: "Next project", factClient: "Client", factIndustry: "Industry", caseTask: "The brief", caseSolution: "What we did", caseResult: "Result", factYear: "Year", factDisciplines: "Disciplines", chFilm: "Films", chPhoto: "Photography", chIdentity: "Marks", moreWork: "More work", endTitle: "So what shall we make for you?", qBudget: "Rough budget?", budgets: ["Under €1,000", "€1,000–3,000", "Over €3,000", "Not sure yet"], budgetMsg: "Budget: {b}.",
      freeCall: "First call free and without obligation.", directMe: "You talk directly to me – {name}, founder.", sendNow: "Send via WhatsApp", orMail: "or by email",
      clientsLead: "From hospitality to property management – for businesses across Germany.", castLeadHome: "For your shoot: models and actors from our network – no casting of your own.", mobileWa: "WhatsApp", clients: "Selected clients & collaborations", founder: "Founder",
    process: "Working together", ending: "Finale", newTab: "(opens in a new tab)",
    direct: "Prefer to go direct?",
    backToSite: "Back to the homepage", imprint: "Imprint", privacy: "Privacy", inPreparation: "This page is being prepared.",
    notFound: "Page not found", notFoundText: "This address does not exist (anymore).", backHome: "Back to the homepage",
    form: {
      name: "Name", email: "Email", company: "Company", services: "What is it about?", talent: "Person from the cast", package: "Package", packageNone: "No specific package", message: "Tell us about your project",
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
    ot: { cueTitle: "Step in.", cueText: "Scroll and the camera starts moving.", showreel: "Showreel", showreelLong: "Watch the showreel", close: "Close",
      soundOn: "Sound on", soundOff: "Sound off", soundLabel: "Toggle sound", timeline: "Chapter timeline", jumpTo: "Jump to",
      chIntro: "Intro", chWork: "Work", chServices: "Services", chCast: "Cast", chLaunch: "Enquiry", chStudio: "Studio", chExit: "Contact",
      workLead: "Behind the pupil lies everything we have filmed, photographed and designed. Keep scrolling and fly right through it.",
      moreWork: "More work", endTitle: "So what shall we make for you?", qBudget: "Rough budget?", budgets: ["Under €1,000", "€1,000–3,000", "Over €3,000", "Not sure yet"], budgetMsg: "Budget: {b}.",
      freeCall: "First call free and without obligation.", directMe: "You talk directly to me – {name}, founder.", sendNow: "Send via WhatsApp", orMail: "or by email",
      clientsLead: "From hospitality to property management – for businesses across Germany.", castLeadHome: "For your shoot: models and actors from our network – no casting of your own.", mobileWa: "WhatsApp", fromProject: "From the project", ownFilm: "UFO Cockpit", ownFilmMeta: "Own production · Short film",
      ownFilmText: "Our own short film: from the spaceship cabin into the pupil. You just flew through it.",
      channel: "Channel {n} of {m}", clientsTitle: "Already on board", castRole: "Model & acting",
      launchTitle: "Ready in 48 hours", launchLead: "Put your project together. The flight plan works out live when you get what from us and drafts the message for you.",
      qWhat: "What do you need?", qWhen: "When should it start?", qNote: "One sentence about the project", notePh: "For example: we are opening a café in December and need reels for Instagram.",
      when: ["As soon as possible", "Next month", "Still planning"], plan: "Flight plan", now: "Now", today: "Today, {t}", mission: "Mission", start: "Start", open: "still open",
      launch: "Launch sequence", ready: "Ready", go: "Go!", consoleTitle: "All set?", consoleText: "Press the button. Then send the drafted message via WhatsApp or email.",
      readyText: "Ready to send. Your message:", sendWa: "Send via WhatsApp", sendMail: "Send via email", copy: "Copy", copied: "Copied", formLink: "Prefer the full form",
      msg: "Hi BushyFam, I am interested in: {list}. Start: {when}.", subject: "Project enquiry: {list}", locale: "tr-TR", draft: "" },
    cta: "Proje başlat", ctaSmall: "Aklında bir proje mi var?", menu: "Menü", switchTo: "Dil seç", language: "Dil",
    seeWork: "İşleri gör", allWork: "Tüm işler", seeAllWork: "Tüm işleri gör", moreAbout: "Taha hakkında daha fazlası",
    film: "Film", play: "Oynat", withSound: "sesli", noSound: "sessiz", media: "Görseller ve filmler",
    portfolio: "Portfolyo", workLead: "İşletmeler için reklam filmleri, fotoğraf ve marka tasarımı.",
    castHomeTitle: "Modeller & Oyuncular", castLead: "Fikir, çekim – ve ona uygun yüzler. BushyFam Studios’un birlikte çalıştığı modeller ve yetenekler.", exploreCast: "Kadroyu keşfet", pkgTitle: "Paketler", pkgEnquire: "Bu paketi sor", priceFrom: "{p} € itibaren", castNote: "Yetenekler BushyFam Studios prodüksiyonları için seçilir.",
    objectsTitle: "Hareketli Objeler", objectsLead: "Siyah fon üzerinde dekupe ürün ve yemek fotoğrafçılığı.", pauseMotion: "Hareketi durdur", resumeMotion: "Hareketi sürdür",
    viewCase: "Projeyi gör", discoverStory: "Hikâyeyi keşfet", allProjects: "Tüm projeler",
    chooseRole: "Rol seç", castStatus: "{cat} içinde {n} kişi", castStatusOne: "{cat} içinde 1 kişi",
    allCast: "Tüm kadro", nextPerson: "Kadrodaki sıradaki", bookThis: "Bu kişi için talepte bulun", showreel: "Showreel", factCity: "Şehir", photos: "Fotoğraflar",
    chooseCat: "Kategori seç", all: "Tümü", filterStatus: "{cat} içinde {n} iş", filterStatusOne: "{cat} içinde 1 iş",
    nextProject: "Sonraki proje", factClient: "Müşteri", factIndustry: "Sektör", caseTask: "Görev", caseSolution: "Çözüm", caseResult: "Sonuç", factYear: "Yıl", factDisciplines: "Disiplinler", chFilm: "Filmler", chPhoto: "Fotoğraf", chIdentity: "İşaretler", moreWork: "Diğer işler", clients: "Seçilmiş müşteriler & iş birlikleri", founder: "Kurucu",
    process: "Birlikte çalışmak", ending: "Final", newTab: "(yeni sekmede açılır)",
    direct: "Doğrudan mı yazmak istersin?",
    backToSite: "Ana sayfaya dön", imprint: "Künye", privacy: "Gizlilik", inPreparation: "Bu sayfa hazırlanıyor.", legalInEnglish: "Bu sayfa şu anda yalnızca İngilizce olarak mevcuttur.",
    notFound: "Sayfa bulunamadı", notFoundText: "Bu adres mevcut değil (artık).", backHome: "Ana sayfaya dön",
    form: {
      name: "Ad", email: "E-posta", company: "Şirket", services: "Konu ne?", talent: "Kadrodan kişi", package: "Paket", packageNone: "Belirli bir paket yok", message: "Bize projeni anlat",
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
