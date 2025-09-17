import Link from "next/link";

const features = [
  {
    title: "Statement alchemy",
    description:
      "Transform uploaded PDFs into structured transactions with clarity and ease. The Vajra parser respects your regional formats and avoids duplicates by default.",
    href: "/admin/upload",
    icon: "☸️",
  },
  {
    title: "Mindful categorisation",
    description:
      "Shape categories for dana, operations, and community projects. Inline editing and targets help keep monthly intentions visible.",
    href: "/admin/categories",
    icon: "🪷",
  },
  {
    title: "Insight reports",
    description:
      "Observe the flow of merit with net balances, income/outgoing insights, and gentle variance cues against your aspirations.",
    href: "/api/reports",
    icon: "🔱",
  },
];

export default function Home() {
  return (
    <main className="vajra-shell">
      <div className="vajra-container">
        <section className="vajra-panel" data-tone="sunrise">
          <div className="vajra-ornament" aria-hidden />
          <span className="vajra-kicker">Maratika Treasury</span>
          <h1 className="vajra-heading mt-4">Finance flows guided by Vajrayana clarity</h1>
          <p className="vajra-subtext mt-4">
            A focused workspace for lineage treasurers to ingest statements, care for
            categories, and illuminate reports. Built to feel ceremonial yet
            contemporary, with gentle gradients inspired by Himalayan dawn.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/login" className="vajra-button">
              Admin sign in
            </Link>
            <Link href="/dashboard" className="vajra-button vajra-button--ghost">
              View dashboard
            </Link>
          </div>
        </section>

        <section className="vajra-panel">
          <div className="flex flex-col gap-8">
            <div>
              <p className="vajra-kicker">What’s inside</p>
              <h2 className="vajra-heading mt-4 text-[clamp(1.8rem,4vw,2.25rem)]">
                A simplified ritual for community finance
              </h2>
              <p className="vajra-subtext mt-3">
                Everything you need to steward statements, transactions, and
                monthly insights lives in one place—no spreadsheets required.
              </p>
            </div>

            <div className="vajra-card-grid">
              {features.map(feature => (
                <Link key={feature.title} href={feature.href} className="vajra-card">
                  <span className="vajra-card__icon" aria-hidden>
                    {feature.icon}
                  </span>
                  <span className="vajra-card__title">{feature.title}</span>
                  <span className="vajra-card__desc">{feature.description}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
