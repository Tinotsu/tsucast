import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export function Footer() {
  return (
    <footer data-testid="footer-section" className="border-t border-[var(--border)] bg-[var(--background)] py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--background)] border border-[var(--border)]">
                <Logo size={28} className="text-[var(--foreground)]" />
              </div>
              <span className="text-xl font-bold tracking-tight text-[var(--foreground)]">
                tsucast
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--muted)]">
              Turn any article into a podcast with AI. Listen to your reading
              list while you walk, commute, or relax.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="mb-4 font-medium text-[var(--foreground)]">
              Product
            </h4>
            <ul className="space-y-3 text-sm text-[var(--muted)]">
              <li>
                <Link
                  href="#features"
                  className="transition-colors hover:text-[var(--foreground)]"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="#pricing"
                  className="transition-colors hover:text-[var(--foreground)]"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="https://apps.apple.com/app/tsucast"
                  className="transition-colors hover:text-[var(--foreground)]"
                >
                  Download iOS
                </Link>
              </li>
              <li>
                <Link
                  href="https://play.google.com/store/apps/details?id=app.tsucast"
                  className="transition-colors hover:text-[var(--foreground)]"
                >
                  Download Android
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-4 font-medium text-[var(--foreground)]">Legal</h4>
            <ul className="space-y-3 text-sm text-[var(--muted)]">
              <li>
                <Link
                  href="/privacy"
                  data-testid="footer-privacy"
                  className="transition-colors hover:text-[var(--foreground)]"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="transition-colors hover:text-[var(--foreground)]"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="mailto:support@tsucast.app"
                  className="transition-colors hover:text-[var(--foreground)]"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-16 border-t border-[var(--border)] pt-8 text-center text-sm text-[var(--muted)]">
          <p>
            &copy; {new Date().getFullYear()} tsucast. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
