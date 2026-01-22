import Link from "next/link";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";

export const metadata = {
  title: "Privacy Policy - tsucast",
  description: "Privacy Policy for tsucast - How we collect, use, and protect your data",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="mb-2 text-4xl font-bold text-white">Privacy Policy</h1>
        <p className="mb-12 text-sm text-zinc-400">Last updated: January 22, 2026</p>

        <div className="prose prose-invert prose-zinc max-w-none">
          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-white">1. Introduction</h2>
            <p className="text-zinc-300">
              tsucast (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy
              explains how we collect, use, disclose, and safeguard your information when you use our
              Service, including our website and mobile applications.
            </p>
            <p className="mt-3 text-zinc-300">
              By using tsucast, you consent to the data practices described in this policy. If you do not
              agree with our policies, please do not use the Service.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-white">2. Data We Collect</h2>

            <h3 className="mb-3 mt-6 text-lg font-medium text-white">2.1 Information You Provide</h3>
            <ul className="list-disc space-y-2 pl-6 text-zinc-300">
              <li><strong>Account Information:</strong> Email address, display name, and password when you create an account</li>
              <li><strong>Content URLs:</strong> Web article URLs you submit for conversion</li>
              <li><strong>Payment Information:</strong> Processed securely through App Store or Google Play (we do not store payment details)</li>
            </ul>

            <h3 className="mb-3 mt-6 text-lg font-medium text-white">2.2 Information Collected Automatically</h3>
            <ul className="list-disc space-y-2 pl-6 text-zinc-300">
              <li><strong>Usage Data:</strong> Features used, playback positions, generation history</li>
              <li><strong>Device Information:</strong> Device type, operating system, app version</li>
              <li><strong>Log Data:</strong> IP address, browser type, access times, error logs</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-white">3. How We Use Your Data</h2>
            <p className="text-zinc-300">We use the collected information to:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-zinc-300">
              <li>Provide, maintain, and improve the Service</li>
              <li>Process your article-to-audio conversions</li>
              <li>Sync your library and playback progress across devices</li>
              <li>Manage your account and subscription</li>
              <li>Send important service notifications</li>
              <li>Respond to your inquiries and support requests</li>
              <li>Detect and prevent fraud or abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-white">4. Data Storage and Security</h2>
            <p className="text-zinc-300">
              We implement appropriate technical and organizational measures to protect your personal data:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-zinc-300">
              <li>Data is encrypted in transit (TLS/HTTPS) and at rest</li>
              <li>Authentication uses secure, industry-standard protocols</li>
              <li>Access to personal data is restricted to authorized personnel</li>
              <li>Regular security audits and vulnerability assessments</li>
            </ul>
            <p className="mt-3 text-zinc-300">
              Your data is stored on secure servers. Generated audio files are stored temporarily and
              may be cached to improve performance.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-white">5. Third-Party Services</h2>
            <p className="text-zinc-300">We use trusted third-party services to operate tsucast:</p>

            <div className="mt-4 space-y-4">
              <div className="rounded-lg border border-zinc-800 p-4">
                <h4 className="font-medium text-white">Supabase</h4>
                <p className="mt-1 text-sm text-zinc-400">Authentication and database services</p>
              </div>
              <div className="rounded-lg border border-zinc-800 p-4">
                <h4 className="font-medium text-white">Fish Audio</h4>
                <p className="mt-1 text-sm text-zinc-400">Text-to-speech conversion (article text is processed to generate audio)</p>
              </div>
              <div className="rounded-lg border border-zinc-800 p-4">
                <h4 className="font-medium text-white">RevenueCat</h4>
                <p className="mt-1 text-sm text-zinc-400">Subscription management and analytics</p>
              </div>
              <div className="rounded-lg border border-zinc-800 p-4">
                <h4 className="font-medium text-white">App Store / Google Play</h4>
                <p className="mt-1 text-sm text-zinc-400">Payment processing for subscriptions</p>
              </div>
            </div>

            <p className="mt-4 text-zinc-300">
              These services have their own privacy policies governing their use of your data.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-white">6. Your Rights (GDPR/CCPA)</h2>
            <p className="text-zinc-300">You have the right to:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-zinc-300">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
              <li><strong>Deletion:</strong> Request deletion of your personal data (&quot;right to be forgotten&quot;)</li>
              <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format</li>
              <li><strong>Restriction:</strong> Request limited processing of your data</li>
              <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent at any time where processing is based on consent</li>
            </ul>
            <p className="mt-4 text-zinc-300">
              To exercise these rights, please contact us at{" "}
              <a href="mailto:privacy@tsucast.app" className="text-amber-500 hover:underline">
                privacy@tsucast.app
              </a>{" "}
              or use the account deletion feature in Settings.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-white">7. Data Retention</h2>
            <p className="text-zinc-300">
              We retain your personal data only for as long as necessary to provide the Service and
              fulfill the purposes described in this policy:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-zinc-300">
              <li><strong>Account data:</strong> Retained until you delete your account</li>
              <li><strong>Generated audio:</strong> Cached for performance, deleted after extended inactivity</li>
              <li><strong>Usage logs:</strong> Retained for up to 90 days for security and debugging</li>
              <li><strong>After deletion:</strong> Data is permanently removed within 30 days</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-white">8. Cookie Policy</h2>
            <p className="text-zinc-300">
              We use essential cookies to operate the Service:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-zinc-300">
              <li><strong>Authentication cookies:</strong> Keep you signed in securely</li>
              <li><strong>Session cookies:</strong> Maintain your session state</li>
            </ul>
            <p className="mt-3 text-zinc-300">
              We do not use advertising or tracking cookies. You can manage cookies through your browser
              settings, but disabling essential cookies may affect Service functionality.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-white">9. Children&apos;s Privacy</h2>
            <p className="text-zinc-300">
              tsucast is not intended for children under 13 years of age. We do not knowingly collect
              personal information from children under 13. If you are a parent or guardian and believe
              your child has provided us with personal data, please contact us immediately.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-white">10. International Data Transfers</h2>
            <p className="text-zinc-300">
              Your data may be transferred to and processed in countries other than your own. We ensure
              appropriate safeguards are in place for such transfers, including standard contractual
              clauses where applicable.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-white">11. Changes to This Policy</h2>
            <p className="text-zinc-300">
              We may update this Privacy Policy from time to time. We will notify you of any changes by
              posting the new policy on this page and updating the &quot;Last updated&quot; date. For significant
              changes, we may also notify you via email or in-app notification.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-white">12. Contact Us</h2>
            <p className="text-zinc-300">
              If you have questions about this Privacy Policy or wish to exercise your data rights,
              please contact our Data Protection Officer:
            </p>
            <div className="mt-4 rounded-lg border border-zinc-800 p-4">
              <p className="text-zinc-300">
                <strong>Email:</strong>{" "}
                <a href="mailto:privacy@tsucast.app" className="text-amber-500 hover:underline">
                  privacy@tsucast.app
                </a>
              </p>
              <p className="mt-2 text-zinc-300">
                <strong>General Support:</strong>{" "}
                <a href="mailto:support@tsucast.app" className="text-amber-500 hover:underline">
                  support@tsucast.app
                </a>
              </p>
            </div>
          </section>
        </div>

        <div className="mt-12 border-t border-zinc-800 pt-8">
          <p className="text-sm text-zinc-400">
            See also:{" "}
            <Link href="/terms" className="text-amber-500 hover:underline">
              Terms of Service
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
