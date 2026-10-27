import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';
import { getOffres } from '@/lib/offres';
import { getServices } from './public/expertise/serviceData';

// /sitemap.xml: the pages search engines should know about. The home page has the highest
// priority, so it is the one shown first when people search "3LM Solutions".
export const dynamic = 'force-dynamic'; // offers change: always list the current ones

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const page = (path: string, priority: number, changeFrequency: 'weekly' | 'monthly' | 'yearly' = 'monthly') => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  });

  // getOffres never throws: if the API is down, the sitemap simply lists no offers
  const [stages, emplois] = await Promise.all([getOffres('stage'), getOffres('emploi')]);

  return [
    page('/', 1, 'weekly'),
    page('/public/expertise', 0.8),
    ...getServices('fr').map((s) => page(`/public/expertise/${s.slug}`, 0.7)),
    page('/public/nearshore', 0.8),
    page('/public/stages', 0.7, 'weekly'),
    page('/public/carrieres', 0.6, 'weekly'),
    page('/public/contact', 0.6),
    page('/public/rendez-vous', 0.5),
    page('/public/confidentialite', 0.2, 'yearly'),
    ...[...stages, ...emplois].map((o) => page(`/public/carrieres/${o.slug}`, 0.5, 'weekly')),
  ];
}
