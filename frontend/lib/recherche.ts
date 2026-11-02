// Forgiving search used by every admin list: accents and capitals are ignored, the words can be
// typed in any order, and spaces inside names don't matter.
//   correspond('hela benali', 'Héla Ben Ali', 'hela@x.tn')  → true

export function normaliser(s?: string | null): string {
  return (s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // é → e, ç → c…
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** True when every word of `recherche` appears in one of `champs` (an empty search matches everything). */
export function correspond(recherche: string, ...champs: (string | null | undefined)[]): boolean {
  const mots = normaliser(recherche).split(' ').filter(Boolean);
  if (mots.length === 0) return true;
  const texte = normaliser(champs.join(' '));
  const sansEspaces = texte.replace(/ /g, '');           // "benali" finds "Ben Ali"
  return mots.every((m) => texte.includes(m) || sansEspaces.includes(m));
}
