import { cookies } from 'next/headers';
import { LANG_COOKIE, toLang, type Lang } from './i18n';

// Language of the current request, for Server Components and generateMetadata.
// Reading cookies makes the page render per request (it cannot be prebuilt in one language).
export async function getLang(): Promise<Lang> {
  return toLang((await cookies()).get(LANG_COOKIE)?.value);
}
