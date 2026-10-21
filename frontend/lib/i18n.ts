// Languages of the public site. French is the default; English is chosen with the FR | EN switch
// in the navbar and remembered in the `lang` cookie (read on the server, so pages render directly
// in the right language). The team admin stays in French.

export type Lang = 'fr' | 'en';

export const LANG_COOKIE = 'lang';

export function toLang(value: string | null | undefined): Lang {
  return value === 'en' ? 'en' : 'fr';
}

// Texts of a page in both languages. Write the French object first, then type the English one
// with it, so a missing translation is a compile error:
//   const fr = { title: 'Bonjour' };
//   const T: Translations<typeof fr> = { fr, en: { title: 'Hello' } };
export type Translations<T> = Record<Lang, T>;
