import { AppHeader } from "@/components/app/AppHeader";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <AppHeader />
      <main>{children}</main>
    </div>
  );
}
