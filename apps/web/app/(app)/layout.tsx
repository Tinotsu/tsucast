import { AppHeader } from "@/components/app/AppHeader";
import { Sidebar, BottomNav } from "@/components/navigation";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Desktop Sidebar - hidden on mobile */}
      <Sidebar />

      {/* Mobile Header - hidden on desktop */}
      <div className="lg:hidden">
        <AppHeader />
      </div>

      {/* Main content area - offset for sidebar on desktop, bottom padding for nav on mobile */}
      <main className="pb-20 lg:ml-60 lg:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Nav - hidden on desktop */}
      <BottomNav />
    </div>
  );
}
