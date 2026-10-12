import type { Metadata } from "next";
import ChatWidget from "@/components/ChatWidget";

export const metadata: Metadata = {
  title: {
    default: "3LM Solutions — Studio tech Ariana, Tunisie",
    template: "%s — 3LM Solutions",
  },
  description:
    "3LM Solutions conçoit et déploie des plateformes web, applications mobiles, agents IA et infrastructures cloud pour des entreprises qui veulent avancer vite, sans sacrifier la fiabilité.",
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      {children}
      <ChatWidget />
    </div>
  );
}