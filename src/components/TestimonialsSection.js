"use client";

import { useEffect, useState } from "react";
import { TestimonialsColumn } from "@/components/TestimonialsColumn";
import { feedbackItems } from "@/lib/feedbackData";

function feedbackToTestimonial(item) {
  return {
    id: item.id,
    text: item.details || item.quote,
    quote: item.quote,
    name: item.name,
    role: [item.role, item.company].filter(Boolean).join(", "),
    rating: item.rating,
    category: item.category,
  };
}

const fallbackTestimonials = feedbackItems.map(feedbackToTestimonial);

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState(fallbackTestimonials);

  useEffect(() => {
    let active = true;

    fetch("/api/public-feedback?limit=12", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (!active) return;

        const publishedFeedback = Array.isArray(data.feedback)
          ? data.feedback.map(feedbackToTestimonial)
          : [];

        if (publishedFeedback.length) {
          setTestimonials(publishedFeedback);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  if (!testimonials.length) {
    return null;
  }

  const columns = [
    testimonials.filter((_, i) => i % 3 === 0),
    testimonials.filter((_, i) => i % 3 === 1),
    testimonials.filter((_, i) => i % 3 === 2),
  ];

  return (
    <section className="w-full bg-white py-16">
      <div className="mx-auto max-w-[600px] px-4 text-center">
        <div className="flex justify-center">
          <span className="rounded-lg border border-[#0D1E4C]/15 px-4 py-1 text-sm font-medium text-[#0D1E4C]">
            User feedback
          </span>
        </div>
        <h2 className="mt-5 text-4xl font-bold tracking-tight text-[#0D1E4C] lg:text-5xl">
          Loved by the Community
        </h2>
        <p className="mt-4 text-[#0D1E4C]/70">Approved feedback from managers, employees, and admins using Optima</p>
      </div>

      <div className="relative mx-auto mt-12 flex max-h-[740px] max-w-6xl justify-center gap-6 overflow-hidden px-4 [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_82%,transparent)]">
        <TestimonialsColumn testimonials={columns[0]} duration={15} />
        {columns[1].length ? (
          <TestimonialsColumn testimonials={columns[1]} duration={19} className="hidden md:block" />
        ) : null}
        {columns[2].length ? (
          <TestimonialsColumn testimonials={columns[2]} duration={17} className="hidden lg:block" />
        ) : null}
      </div>
    </section>
  );
}
