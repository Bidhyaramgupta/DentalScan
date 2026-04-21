import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

const CAPTURED_VIEWS = [
  "Front View",
  "Left View",
  "Right View",
  "Upper Teeth",
  "Lower Teeth",
];

export default function ResultsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-black to-zinc-950 text-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          <section className="space-y-4">
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/75 p-4 shadow-[0_14px_32px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-500/15">
                    <CheckCircle2 size={18} className="text-emerald-300" />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold tracking-tight sm:text-xl">Scan Complete</h1>
                    <p className="mt-1 text-sm text-zinc-300">
                      Your scan images are ready. AI dental insights will appear here.
                    </p>
                  </div>
                </div>
                <Link
                  href="/"
                  className="rounded-full border border-cyan-300/35 bg-cyan-500/15 px-3 py-1.5 text-xs font-medium text-cyan-100 transition-colors hover:bg-cyan-500/25"
                >
                  New Scan
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/65 p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold tracking-wide text-zinc-100">Captured Thumbnails</h2>
                <span className="text-xs text-zinc-400">{CAPTURED_VIEWS.length} views</span>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {CAPTURED_VIEWS.map((view, idx) => (
                  <div
                    key={view}
                    className="overflow-hidden rounded-lg border border-zinc-700/80 bg-zinc-900"
                  >
                    <div className="flex aspect-[4/5] items-center justify-center bg-gradient-to-b from-zinc-800 to-zinc-900 text-[11px] text-zinc-400">
                      {idx + 1}
                    </div>
                    <p className="truncate border-t border-zinc-800 px-2 py-1 text-[10px] text-zinc-400">
                      {view}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/65 p-4 sm:p-5">
              <h2 className="text-sm font-semibold tracking-wide text-zinc-100">Dental Results</h2>
              <div className="mt-3 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/60 p-4 text-sm text-zinc-400">
                Placeholder: AI findings, risk highlights, and recommended follow-up actions will be
                shown here.
              </div>
            </div>
          </section>

          <aside className="rounded-2xl border border-zinc-800/80 bg-zinc-900/55 p-4 sm:p-5">
            <h2 className="text-sm font-semibold tracking-wide text-zinc-100">Messaging Sidebar</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Reserved for patient-chat and clinician messaging in the next phase.
            </p>
            <div className="mt-4 min-h-56 rounded-xl border border-dashed border-zinc-700/80 bg-zinc-950/45 p-3 text-xs text-zinc-500">
              Coming soon
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
