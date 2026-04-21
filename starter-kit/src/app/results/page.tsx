import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import MessageSidebar from "@/components/MessageSidebar";
import { MessagingThreadId } from "@/components/messaging/types";
import { prisma } from "@/lib/prisma";

const CAPTURED_VIEWS = ["Front View", "Left View", "Right View", "Upper Teeth", "Lower Teeth"];
const DEMO_PATIENT_ID = "demo-patient";

type ResultsPageProps = {
  searchParams?: {
    scanId?: string | string[];
    threadId?: MessagingThreadId | MessagingThreadId[];
  };
};

function parseStoredImages(images: string): string[] {
  const raw = images.trim();
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    }
  } catch {
    // Fall back to comma-separated values.
  }

  return raw
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const scanIdParam = searchParams?.scanId;
  const scanId =
    typeof scanIdParam === "string"
      ? scanIdParam
      : Array.isArray(scanIdParam)
        ? scanIdParam[0]
        : undefined;
  const threadIdParam = searchParams?.threadId;
  const threadIdFromParams: MessagingThreadId | undefined =
    typeof threadIdParam === "string"
      ? threadIdParam
      : Array.isArray(threadIdParam)
        ? threadIdParam[0]
        : undefined;
  const demoThread = threadIdFromParams
    ? null
    : await prisma.thread.findFirst({
        where: { patientId: DEMO_PATIENT_ID },
        orderBy: { updatedAt: "desc" },
        select: { id: true },
      });
  const initialThreadId: MessagingThreadId | undefined =
    threadIdFromParams ?? demoThread?.id;
  const scan = scanId
    ? await prisma.scan.findUnique({
        where: { id: scanId },
        select: {
          id: true,
          status: true,
          images: true,
          createdAt: true,
        },
      })
    : null;
  const scanImages = scan ? parseStoredImages(scan.images) : [];
  const createdAtLabel = scan
    ? new Date(scan.createdAt).toLocaleString()
    : null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-black to-zinc-950 text-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <section className="space-y-4" aria-label="Scan results content">
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/75 p-4 shadow-[0_14px_32px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-500/15">
                    <CheckCircle2 size={18} className="text-emerald-300" />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold tracking-tight sm:text-xl">Scan Results</h1>
                    <p className="mt-1 text-sm text-zinc-300">
                      Your scan has been uploaded successfully. Review the summary below and use
                      messaging to ask follow-up questions.
                    </p>
                    {scanId && (
                      <p className="mt-2 text-xs text-zinc-400">Submission ID: {scanId}</p>
                    )}
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
              <h2 className="text-sm font-semibold tracking-wide text-zinc-100">Latest Scan Context</h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">Scan ID</p>
                  <p className="mt-1 truncate text-sm text-zinc-200">{scan?.id ?? scanId ?? "Not provided"}</p>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">Status</p>
                  <p className="mt-1 text-sm text-zinc-200">{scan?.status ?? "Unavailable"}</p>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">Captured Images</p>
                  <p className="mt-1 text-sm text-zinc-200">{scanImages.length}</p>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 sm:col-span-3">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">Created</p>
                  <p className="mt-1 text-sm text-zinc-200">{createdAtLabel ?? "Unavailable"}</p>
                </div>
              </div>
            </div>

            {!scan && (
              <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 sm:p-5">
                <h2 className="text-sm font-semibold tracking-wide text-amber-100">Scan not found</h2>
                <p className="mt-2 text-sm text-amber-50/90">
                  We could not find a matching scan for this result view. Start a new scan to continue.
                </p>
              </div>
            )}

            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/65 p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold tracking-wide text-zinc-100">Scan Summary</h2>
                <span className="text-xs text-zinc-400">Placeholder</span>
              </div>
              <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-950/60 p-4">
                <p className="text-sm text-zinc-300">
                  Initial scan findings will be shown here once analysis is complete.
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3">
                    <p className="text-xs uppercase tracking-wide text-zinc-500">Overall Status</p>
                    <p className="mt-1 text-sm text-zinc-200">Pending clinical review</p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3">
                    <p className="text-xs uppercase tracking-wide text-zinc-500">Priority</p>
                    <p className="mt-1 text-sm text-zinc-200">Routine follow-up</p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 sm:col-span-2">
                    <p className="text-xs uppercase tracking-wide text-zinc-500">
                      Provider Notes
                    </p>
                    <p className="mt-1 text-sm text-zinc-300">
                      Placeholder note area for dentist comments and recommendations.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/65 p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold tracking-wide text-zinc-100">
                  Captured Thumbnails
                </h2>
                <span className="text-xs text-zinc-400">{scanImages.length || CAPTURED_VIEWS.length} views</span>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {scanImages.length > 0
                  ? scanImages.map((image, idx) => (
                      <div
                        key={`${idx}-${image.slice(0, 24)}`}
                        className="overflow-hidden rounded-lg border border-zinc-700/80 bg-zinc-900"
                      >
                        <img
                          src={image}
                          alt={`Captured view ${idx + 1}`}
                          className="aspect-[4/5] w-full object-cover"
                        />
                        <p className="truncate border-t border-zinc-800 px-2 py-1 text-[10px] text-zinc-400">
                          View {idx + 1}
                        </p>
                      </div>
                    ))
                  : CAPTURED_VIEWS.map((view, idx) => (
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
          </section>

          <MessageSidebar
            initialThreadId={initialThreadId}
            scanId={scan?.id ?? scanId}
          />
        </div>
      </div>
    </main>
  );
}
