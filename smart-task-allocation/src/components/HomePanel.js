export default function HomePanel({ title, description }) {
  return (
    <section className="dashboard-card p-6">
      <p className="dashboard-eyebrow">Workflow summary</p>
      <h2 className="mt-1 text-xl font-black text-slate-950">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
    </section>
  );
}
