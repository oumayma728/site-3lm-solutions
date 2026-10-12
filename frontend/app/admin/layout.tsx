// Layout for the admin area
import type { Metadata } from "next";
import AdminGate from "@/components/AdminGate";

export const metadata: Metadata = {
  title: "Espace équipe — 3LM Solutions",
  description: "Espace interne 3LM Solutions : gestion des devis, clients et rendez-vous.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminGate>{children}</AdminGate>;
}