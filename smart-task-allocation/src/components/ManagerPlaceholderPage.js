"use client";

export default function ManagerPlaceholderPage({ eyebrow, title, description, children }) {
  return (
    <section className="manager-reference-panel h-full min-h-[560px] overflow-hidden rounded-2xl border border-[#BBE1FA] bg-white shadow-sm">
      <div className="h-full overflow-y-auto px-8 py-8">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#5d7290]">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-4xl font-black text-[#07183b]">{title}</h1>
        <p className="mt-3 max-w-2xl text-base font-medium text-[#52627a]">
          {description}
        </p>
        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </section>
  );
}
