import Link from "next/link";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";

export const metadata = {
  title: "Terms of Service - tsucast",
  description: "Terms of Service for tsucast - AI-powered article to podcast conversion",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="mb-2 text-4xl font-bold text-white">Terms of Service</h1>
        <p className="mb-12 text-sm text-zinc-400">Last updated: January 22, 2026</p>

        <div className="prose prose-invert prose-zinc max-w-none">
          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-white">1. Acceptance of Terms</h2>
            <p className="text-zinc-300">
              By accessing or using tsucast (&quot;the Service&quot;), you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-white">2. Description of Service</h2>
            <p className="text-zinc-300">
              tsucast is an AI-powered service that converts web articles and text content into audio podcasts.
              The Service includes:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-zinc-300">
              <li>Article-to-audio conversion using text-to-speech technology</li>
              <li>Personal audio library management</li>
              <li>Playback position synchronization across devices</li>
              <li>Web and mobile applications</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-white">3. User Accounts</h2>
            <p className="text-zinc-300">
              To use certain features of the Service, you must create an account. You are responsible for:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-zinc-300">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use</li>
              <li>Providing accurate and complete registration information</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-white">4. Acceptable Use</h2>
            <p className="text-zinc-300">You agree not to:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-zinc-300">
              <li>Use the Service for any illegal purpose or in violation of any laws</li>
              <li>Convert content you do not have the right to reproduce or distribute</li>
              <li>Attempt to circumvent any usage limits or access controls</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Use automated systems to access the Service without permission</li>
              <li>Redistribute or resell converted audio content commercially</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-white">5. Intellectual Property</h2>
            <p className="text-zinc-300">
              The Service, including its original content, features, and functionality, is owned by tsucast
              and is protected by international copyright, trademark, and other intellectual property laws.
            </p>
            <p className="mt-3 text-zinc-300">
              You retain ownership of any content you submit for conversion. By using the Service, you grant
              us a limited license to process your content solely for the purpose of providing the Service.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-white">6. Subscription and Payments</h2>
            <p className="text-zinc-300">
              tsucast offers both free and paid subscription tiers. For paid subscriptions:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-zinc-300">
              <li>Payments are processed through the App Store (iOS) or Google Play (Android)</li>
              <li>Subscriptions automatically renew unless cancelled before the renewal date</li>
              <li>Refunds are handled according to the respective app store policies</li>
              <li>Prices may change with reasonable notice</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-white">7. Limitation of Liability</h2>
            <p className="text-zinc-300">
              To the maximum extent permitted by law, tsucast shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages, including but not limited to
              loss of profits, data, or other intangible losses resulting from:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-zinc-300">
              <li>Your use or inability to use the Service</li>
              <li>Any unauthorized access to your data</li>
              <li>Any interruption or cessation of the Service</li>
              <li>Any bugs, viruses, or errors in the Service</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-white">8. Service Availability</h2>
            <p className="text-zinc-300">
              We strive to maintain high availability but do not guarantee uninterrupted access to the Service.
              We may modify, suspend, or discontinue the Service at any time without notice. We are not liable
              for any modification, suspension, or discontinuation of the Service.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-white">9. Termination</h2>
            <p className="text-zinc-300">
              We may terminate or suspend your account and access to the Service immediately, without prior
              notice or liability, for any reason, including if you breach these Terms. Upon termination,
              your right to use the Service will cease immediately.
            </p>
            <p className="mt-3 text-zinc-300">
              You may delete your account at any time through the Settings page. Account deletion is permanent
              and all your data will be removed.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-white">10. Changes to Terms</h2>
            <p className="text-zinc-300">
              We reserve the right to modify these Terms at any time. We will notify users of any material
              changes by posting the new Terms on this page and updating the &quot;Last updated&quot; date. Your
              continued use of the Service after such changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-white">11. Governing Law</h2>
            <p className="text-zinc-300">
              These Terms shall be governed by and construed in accordance with applicable laws, without
              regard to conflict of law principles.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-white">12. Contact Information</h2>
            <p className="text-zinc-300">
              If you have any questions about these Terms, please contact us at:
            </p>
            <p className="mt-3 text-zinc-300">
              Email:{" "}
              <a href="mailto:legal@tsucast.app" className="text-amber-500 hover:underline">
                legal@tsucast.app
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 border-t border-zinc-800 pt-8">
          <p className="text-sm text-zinc-400">
            See also:{" "}
            <Link href="/privacy" className="text-amber-500 hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
