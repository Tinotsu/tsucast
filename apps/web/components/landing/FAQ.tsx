"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Loader2 } from "lucide-react";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  position: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Fallback FAQ items if API unavailable
const FALLBACK_FAQ: FAQItem[] = [
  {
    id: "1",
    question: "What links work with tsucast?",
    answer:
      "tsucast works with most article URLs including news sites, blogs, Medium posts, Substack newsletters, and PDF documents. As long as the content is publicly accessible, we can convert it.",
    position: 1,
  },
  {
    id: "2",
    question: "What doesn't work?",
    answer:
      "Paywalled content, login-required pages, and heavily JavaScript-rendered sites may not work. We also don't support video-only content or image galleries.",
    position: 2,
  },
  {
    id: "3",
    question: "How long can articles be?",
    answer:
      "Articles up to 50,000 words are supported. That's about 4-5 hours of audio. Longer articles may be truncated.",
    position: 3,
  },
  {
    id: "4",
    question: "Is there a free trial?",
    answer:
      "Yes! You can listen to our free samples without signing up. When you create an account, you get credits to try the full experience.",
    position: 4,
  },
];

/**
 * FAQ - Frequently Asked Questions with accordion
 */
export function FAQ() {
  const [items, setItems] = useState<FAQItem[]>(FALLBACK_FAQ);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Fetch FAQ items
  useEffect(() => {
    async function fetchFAQ() {
      try {
        const res = await fetch(`${API_URL}/api/faq`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          setItems(data.items);
        }
      } catch {
        // Keep fallback items on error
      } finally {
        setIsLoading(false);
      }
    }
    fetchFAQ();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  if (isLoading) {
    return (
      <section data-testid="faq-section" className="bg-[var(--background)] py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--muted)]" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section data-testid="faq-section" className="bg-[var(--background)] py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <h2 className="mb-10 text-center text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
          Frequently Asked Questions
        </h2>

        {/* FAQ Items */}
        <div className="space-y-4">
          {items.map((item) => {
            const isExpanded = expandedId === item.id;

            return (
              <div
                key={item.id}
                data-testid="faq-item"
                className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden"
              >
                {/* Question button */}
                <button
                  data-testid="faq-question"
                  onClick={() => toggleExpand(item.id)}
                  className="flex w-full items-center justify-between p-5 text-left font-medium text-[var(--foreground)] hover:bg-[var(--border)]/10 transition-colors"
                  aria-expanded={isExpanded}
                >
                  <span>{item.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 flex-shrink-0 text-[var(--muted)] transition-transform duration-300 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Answer - animated height */}
                <div
                  data-testid="faq-answer"
                  data-expanded={isExpanded}
                  className="grid transition-all duration-300 ease-out"
                  style={{
                    gridTemplateRows: isExpanded ? "1fr" : "0fr",
                  }}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 pb-5 text-[var(--muted)]">
                      {item.answer}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
