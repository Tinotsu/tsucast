import { Sidebar, BottomNav } from "@/components/navigation";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Desktop Sidebar - hidden on mobile */}
      <Sidebar />

      {/* Main content area - offset for sidebar on desktop, padding for player + nav on mobile */}
      <main className="pb-36 lg:ml-60 lg:pb-16">
        {children}
      </main>

      {/* Mobile Bottom Nav - below the player, hidden on desktop */}
      <BottomNav />
    </div>
  );
}
