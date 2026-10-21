import type { Metadata } from "next";
import ChatWidget from "@/components/ChatWidget";
import { getLang } from "@/lib/i18n-server";

const META = {
  fr: {
    default: "3LM Solutions — Studio tech Ariana, Tunisie",
    description:
      "3LM Solutions conçoit et déploie des plateformes web, applications mobiles, agents IA et infrastructures cloud pour des entreprises qui veulent avancer vite, sans sacrifier la fiabilité.",
  },
  en: {
    default: "3LM Solutions — Tech studio in Ariana, Tunisia",
    description:
      "3LM Solutions designs and ships web platforms, mobile apps, AI agents and cloud infrastructure for companies that want to move fast without sacrificing reliability.",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const m = META[await getLang()];
  return {
    title: { default: m.default, template: "%s — 3LM Solutions" },
    description: m.description,
  };
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      {children}
      <ChatWidget />
    </div>
  );
}
