export type Lang = "en" | "rw" | "fr";

type Dict = Record<string, string>;

const en: Dict = {
  "nav.music": "Music",
  "nav.videos": "Videos",
  "nav.concerts": "Concerts",
  "nav.store": "Store",
  "nav.news": "News",
  "nav.about": "About",
  "nav.contact": "Contact",
  "nav.tickets": "Get tickets",
  "nav.menu": "Menu",
  "nav.close": "Close",
  "hero.eyebrow": "Sinza Universal Company · Kigali, Rwanda",
  "hero.title": "The sound of",
  "hero.titleItalic": "salvation",
  "hero.cta1": "Listen to the new single",
  "hero.cta2": "Get concert tickets",
  "hero.play": "Play the film",
  "section.latest": "Latest release",
  "section.schedule": "The schedule",
  "section.videos": "Watch",
  "section.news": "News & press",
  "section.store": "Merch & albums",
  "section.newsletter": "Join the list",
  "footer.rights": "All rights reserved.",
};

const rw: Dict = {
  "nav.music": "Amashimbo",
  "nav.videos": "Video",
  "nav.concerts": "Inkuru z'abahisi",
  "nav.store": "Isoko",
  "nav.news": "Amakuru",
  "nav.about": "Ibibacu",
  "nav.contact": "Twandikire",
  "nav.tickets": "Gura itike",
  "nav.menu": "Ibikubiyemo",
  "nav.close": "Funga",
  "hero.eyebrow": "Sinza Universal Company · Kigali, Rwanda",
  "hero.title": "Ijwi rya",
  "hero.titleItalic": "agakiza",
  "hero.cta1": "Umva indirimbo nshya",
  "hero.cta2": "Gura itike ya konseri",
  "hero.play": "Reba filamu",
  "section.latest": "Ibyashya",
  "section.schedule": "Igenabihe",
  "section.videos": "Reba",
  "section.news": "Amakuru",
  "section.store": "Ibyagurishwa",
  "section.newsletter": "Andikishe",
  "footer.rights": "Uburenganzira bwose burabitswe.",
};

const fr: Dict = {
  "nav.music": "Musique",
  "nav.videos": "Vidéos",
  "nav.concerts": "Concerts",
  "nav.store": "Boutique",
  "nav.news": "Actualités",
  "nav.about": "À propos",
  "nav.contact": "Contact",
  "nav.tickets": "Billets",
  "nav.menu": "Menu",
  "nav.close": "Fermer",
  "hero.eyebrow": "Sinza Universal Company · Kigali, Rwanda",
  "hero.title": "Le son du",
  "hero.titleItalic": "salut",
  "hero.cta1": "Écouter le nouveau single",
  "hero.cta2": "Réserver un billet",
  "hero.play": "Voir le film",
  "section.latest": "Dernière sortie",
  "section.schedule": "Le programme",
  "section.videos": "Regarder",
  "section.news": "Actus & presse",
  "section.store": "Merch & albums",
  "section.newsletter": "Rejoindre la liste",
  "footer.rights": "Tous droits réservés.",
};

const dicts: Record<Lang, Dict> = { en, rw, fr };

export function normaliseLang(value?: string | null): Lang {
  return value === "rw" || value === "fr" ? value : "en";
}

export function t(lang: Lang | string | undefined, key: string): string {
  const l = normaliseLang(typeof lang === "string" ? lang : "en");
  return dicts[l][key] ?? en[key] ?? key;
}

export const languageNames: Record<Lang, string> = { en: "English", rw: "Kinyarwanda", fr: "Français" };
