import Link from "next/link";
import { Headphones } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-[#e5e5e5] bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black">
                <Headphones className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-[#1a1a1a]">
                tsucast
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#737373]">
              Turn any article into a podcast with AI. Listen to your reading
              list while you walk, commute, or relax.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="mb-4 font-medium text-[#1a1a1a]">
              Product
            </h4>
            <ul className="space-y-3 text-sm text-[#737373]">
              <li>
                <Link href="#features" className="transition-colors hover:text-[#1a1a1a]">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="transition-colors hover:text-[#1a1a1a]">
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="https://apps.apple.com/app/tsucast"
                  className="transition-colors hover:text-[#1a1a1a]"
                >
                  Download iOS
                </Link>
              </li>
              <li>
                <Link
                  href="https://play.google.com/store/apps/details?id=app.tsucast"
                  className="transition-colors hover:text-[#1a1a1a]"
                >
                  Download Android
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-4 font-medium text-[#1a1a1a]">
              Legal
            </h4>
            <ul className="space-y-3 text-sm text-[#737373]">
              <li>
                <Link href="/privacy" className="transition-colors hover:text-[#1a1a1a]">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="transition-colors hover:text-[#1a1a1a]">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="mailto:support@tsucast.app"
                  className="transition-colors hover:text-[#1a1a1a]"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-16 border-t border-[#e5e5e5] pt-8 text-center text-sm text-[#737373]">
          <p>&copy; {new Date().getFullYear()} tsucast. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
