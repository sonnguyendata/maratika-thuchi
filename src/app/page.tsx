import Link from "next/link";

export default function Home() {
  return (
    <div className="relative isolate flex min-h-screen flex-col overflow-hidden px-6 pb-12 pt-10 sm:px-10">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(140%_100%_at_15%_-20%,rgba(228,168,104,0.18)_0%,rgba(21,13,40,0.85)_45%,#080513_100%)]" />
        <div className="absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-[#2d9fa3]/25 blur-[120px]" />
        <div className="absolute right-[-10%] bottom-[-25%] h-[26rem] w-[26rem] rounded-full bg-[#da6d6d]/25 blur-[200px]" />
      </div>

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 rounded-full border border-white/10 bg-white/[0.04] px-6 py-4 shadow-[0_30px_60px_-40px_rgba(8,5,19,0.9)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#f2c98d]/25 via-[#f2a65a]/20 to-[#2d9fa3]/40 font-display text-xl text-[#f5efe0] shadow-[0_15px_35px_rgba(8,5,19,0.4)] ring-1 ring-white/20">
            ☸
          </div>
          <div className="leading-tight">
            <p className="font-display text-xl text-[#f7ecda]">Maratika Thuchi</p>
            <p className="text-[0.65rem] uppercase tracking-[0.5em] text-[#cbbedd]">
              Vajrayana Intelligence
            </p>
          </div>
        </div>
        <nav className="hidden items-center gap-6 text-sm text-[#dcd5f0] md:flex">
          <Link className="transition-colors hover:text-[#f2c98d]" href="/dashboard">
            Dashboard
          </Link>
          <Link className="transition-colors hover:text-[#f2c98d]" href="/admin">
            Practices
          </Link>
          <Link className="transition-colors hover:text-[#f2c98d]" href="/login">
            Support
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Open navigation"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-sm text-[#f5efe0] shadow-[0_10px_30px_rgba(8,5,19,0.45)] transition hover:bg-white/[0.08] md:hidden"
          >
            ☰
          </button>
          <Link
            className="inline-flex items-center justify-center rounded-full border border-[#f2c98d]/50 bg-[#f2c98d]/10 px-5 py-2 text-sm font-semibold text-[#f8f2e7] shadow-[0_0_20px_rgba(242,201,141,0.18)] transition hover:-translate-y-0.5 hover:bg-[#f2c98d]/20"
            href="/login"
          >
            Launch app
          </Link>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 items-center gap-16 py-16 md:grid-cols-[1.05fr_0.95fr] md:py-24">
        <div className="space-y-10 text-center md:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1 text-xs uppercase tracking-[0.45em] text-[#f2c98d]/90 md:self-start">
            Vajrayana platform
          </span>
          <div className="space-y-6">
            <h1 className="font-display text-4xl leading-tight text-[#f7ecda] sm:text-5xl md:text-6xl">
              Harmonize insight, finance, and service into one luminous mandala.
            </h1>
            <p className="mx-auto max-w-xl text-base text-[#d8d3ee]/90 md:mx-0 md:text-lg">
              Maratika Thuchi streamlines operations for modern sanghas—bringing offerings, retreat logistics, and practitioner care into a single compassionate workflow.
            </p>
          </div>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-start">
            <Link
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#f2c98d] via-[#f2a65a] to-[#da6d6d] px-8 py-3 text-sm font-semibold text-[#1b132d] shadow-[0_20px_60px_-20px_rgba(242,169,106,0.7)] transition hover:-translate-y-0.5"
              href="/dashboard"
            >
              Enter dashboard
            </Link>
            <Link
              className="inline-flex items-center justify-center rounded-full border border-white/20 px-8 py-3 text-sm font-semibold text-[#f5efe6] transition hover:border-[#f2c98d]/60 hover:text-[#f2c98d]"
              href="/admin"
            >
              Discover the vision
            </Link>
          </div>
          <dl className="grid grid-cols-1 gap-6 text-left sm:grid-cols-3">
            <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-5 py-4 shadow-[0_20px_60px_-30px_rgba(8,5,19,0.8)]">
              <dt className="text-xs uppercase tracking-[0.45em] text-[#cbbedd]">Donor growth</dt>
              <dd className="mt-3 font-display text-3xl text-[#f2c98d]">+72%</dd>
              <p className="mt-2 text-xs text-[#b9b2d5]">After unifying regional treasuries</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-5 py-4 shadow-[0_20px_60px_-30px_rgba(8,5,19,0.8)]">
              <dt className="text-xs uppercase tracking-[0.45em] text-[#cbbedd]">Retreat clarity</dt>
              <dd className="mt-3 font-display text-3xl text-[#f2c98d]">18 regions</dd>
              <p className="mt-2 text-xs text-[#b9b2d5]">One timetable across the entire mandala</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-5 py-4 shadow-[0_20px_60px_-30px_rgba(8,5,19,0.8)]">
              <dt className="text-xs uppercase tracking-[0.45em] text-[#cbbedd]">Care response</dt>
              <dd className="mt-3 font-display text-3xl text-[#f2c98d]">&lt;3 hrs</dd>
              <p className="mt-2 text-xs text-[#b9b2d5]">Average teacher follow-up time</p>
            </div>
          </dl>
        </div>

        <div className="relative flex justify-center md:justify-end">
          <div className="absolute -left-8 top-4 h-40 w-40 rounded-full bg-[#2d9fa3]/30 blur-3xl" />
          <div className="absolute -right-6 bottom-10 h-44 w-44 rounded-full bg-[#f2a65a]/25 blur-[140px]" />
          <div className="relative w-full max-w-md rounded-[32px] border border-white/10 bg-white/[0.05] p-8 shadow-[0_40px_120px_-40px_rgba(8,5,19,0.9)] backdrop-blur-2xl">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-2xl text-[#f7ecda]">Sangha Pulse</h2>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#2d9fa3]/40 bg-[#2d9fa3]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-[#84e6e9]">
                Live
              </span>
            </div>
            <p className="mt-3 text-sm text-[#cbbedd]">
              A living mandala of the community’s wellbeing updated in real time.
            </p>
            <div className="mt-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-[#cbbedd]">Offerings today</p>
                  <p className="mt-1 font-display text-2xl text-[#f2c98d]">₿ 18.4k</p>
                </div>
                <span className="rounded-full border border-[#f2c98d]/40 bg-[#f2c98d]/15 px-3 py-1 text-xs text-[#f2c98d]">+18%</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[0.65rem] uppercase tracking-[0.35em] text-[#b9b2d5]">
                  <span>Retreat capacity</span>
                  <span>82%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                  <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-[#2d9fa3] via-[#6ed1d4] to-[#f2c98d]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/5 bg-white/[0.06] p-3">
                  <p className="text-[0.65rem] uppercase tracking-[0.35em] text-[#b9b2d5]">
                    Practitioner focus
                  </p>
                  <p className="mt-2 font-display text-xl text-[#f7ecda]">Meditation</p>
                  <p className="mt-1 text-xs text-[#9087b7]">43% completing ngöndro</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/[0.06] p-3">
                  <p className="text-[0.65rem] uppercase tracking-[0.35em] text-[#b9b2d5]">
                    Care alerts
                  </p>
                  <p className="mt-2 font-display text-xl text-[#f7ecda]">3</p>
                  <p className="mt-1 text-xs text-[#9087b7]">Guiding teachers notified</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <section className="mx-auto w-full max-w-5xl rounded-[40px] border border-white/10 bg-white/[0.05] px-8 py-10 shadow-[0_40px_120px_-50px_rgba(8,5,19,0.9)] sm:px-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#f2c98d]/40 via-[#f2a65a]/30 to-[#da6d6d]/40 text-sm font-semibold text-[#1b132d]">
              1
            </div>
            <h3 className="font-display text-xl text-[#f7ecda]">Unified treasuries</h3>
            <p className="text-sm text-[#cbbedd]">
              Synchronize offerings from temples, retreats, and digital portals with ceremonial transparency.
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#2d9fa3]/40 via-[#6ed1d4]/30 to-[#f2c98d]/35 text-sm font-semibold text-[#1b132d]">
              2
            </div>
            <h3 className="font-display text-xl text-[#f7ecda]">Compassionate journeys</h3>
            <p className="text-sm text-[#cbbedd]">
              Track practitioner progress and design supportive check-ins grounded in lineage guidance.
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#f2a65a]/35 via-[#da6d6d]/30 to-[#2d9fa3]/35 text-sm font-semibold text-[#1b132d]">
              3
            </div>
            <h3 className="font-display text-xl text-[#f7ecda]">Illuminated governance</h3>
            <p className="text-sm text-[#cbbedd]">
              Translate complex compliance into simple rituals with dynamic approvals and audit trails.
            </p>
          </div>
        </div>
      </section>

      <footer className="mx-auto mt-16 flex w-full max-w-6xl flex-col items-center gap-4 border-t border-white/10 pt-8 text-[0.65rem] uppercase tracking-[0.45em] text-[#a49bc8] sm:flex-row sm:justify-between">
        <span>© 2024 Maratika Thuchi Sangha Systems</span>
        <div className="flex gap-4">
          <Link className="transition-colors hover:text-[#f2c98d]" href="/privacy">
            Privacy
          </Link>
          <Link className="transition-colors hover:text-[#f2c98d]" href="/support">
            Sangha guidelines
          </Link>
          <Link className="transition-colors hover:text-[#f2c98d]" href="/contact">
            Contact
          </Link>
        </div>
      </footer>
    </div>
  );
}
