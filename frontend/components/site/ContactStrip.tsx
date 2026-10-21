import Link from 'next/link';
import type { Lang } from '@/lib/i18n';

// "Get in touch" call to action shown at the bottom of most public pages.
const T = {
  fr: {
    marker: 'Entrer en contact',
    title: 'Votre prochain projet mérite une base solide.',
    text: 'Expliquez-nous votre besoin en 15 minutes et repartez avec une approche claire, chiffrée et réaliste.',
    cta: 'Programmer un appel →',
  },
  en: {
    marker: 'Get in touch',
    title: 'Your next project deserves a solid foundation.',
    text: 'Tell us about your needs in 15 minutes and leave with a clear, costed and realistic approach.',
    cta: 'Schedule a call →',
  },
};

export default function ContactStrip({ lang, title, text }: { lang: Lang; title?: string; text?: string }) {
  const t = T[lang];
  return (
    <section className="home-contact-strip">
      <div>
        <div className="section-marker"><span />{t.marker}</div>
        <h2>{title ?? t.title}</h2>
        <p>{text ?? t.text}</p>
      </div>
      <Link href="/public/rendez-vous" className="gradient-button">{t.cta}</Link>
    </section>
  );
}
