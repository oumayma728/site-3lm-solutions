import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

// /robots.txt: everything public is open to search engines; the team area and its login are not.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/public/login'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
