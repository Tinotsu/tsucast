import Link from "next/link";
import { Headphones } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-900 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500">
                <Headphones className="h-5 w-5 text-black" />
              </div>
              <span className="text-xl font-bold text-white">
                tsucast
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-zinc-400">
              Turn any article into a podcast with AI. Listen to your reading
              list while you walk, commute, or relax.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="mb-4 font-semibold text-white">
              Product
            </h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li>
                <Link href="#features" className="hover:text-amber-500">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="hover:text-amber-500">
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="https://apps.apple.com/app/tsucast"
                  className="hover:text-amber-500"
                >
                  Download iOS
                </Link>
              </li>
              <li>
                <Link
                  href="https://play.google.com/store/apps/details?id=app.tsucast"
                  className="hover:text-amber-500"
                >
                  Download Android
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-4 font-semibold text-white">
              Legal
            </h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li>
                <Link href="/privacy" className="hover:text-amber-500">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-amber-500">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="mailto:support@tsucast.app"
                  className="hover:text-amber-500"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 border-t border-zinc-800 pt-8 text-center text-sm text-zinc-400">
          <p>&copy; {new Date().getFullYear()} tsucast. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
