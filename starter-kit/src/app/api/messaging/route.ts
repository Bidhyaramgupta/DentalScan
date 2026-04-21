import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Starter-kit strategy: auto-provision a single demo thread for a fixed demo patient.
const DEMO_PATIENT_ID = "demo-patient";
const LOG_PREFIX = "[messaging]";

function logValidationFailure(reason: string, details?: Record<string, unknown>) {
  console.warn(`${LOG_PREFIX} Validation failure: ${reason}`, details ?? {});
}

/**
 * Quick Manual Messaging Verification Checklist
 * 1) Open /results -> page should load and show the Quick Message sidebar.
 * 2) On first load with no messages -> empty state should show ("No messages yet").
 * 3) Type and send a message -> bubble appears quickly, then persists after request success.
 * 4) Confirm GET /api/messaging returns threadId + messages (200) and sidebar loads them.
 * 5) Refresh /results -> previously sent Prisma-backed messages should still render.
 * 6) Trigger invalid POSTs (e.g., missing sender or blank content) -> expect 400 + safe error JSON.
 * 7) Call GET/POST with an unknown threadId -> expect 404 Thread not found.
 */

async function getOrCreateDemoThread() {
  const existingThread = await prisma.thread.findFirst({
    where: { patientId: DEMO_PATIENT_ID },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });

  if (existingThread) {
    return existingThread;
  }

  return prisma.thread.create({
    data: { patientId: DEMO_PATIENT_ID },
    select: { id: true },
  });
}

async function resolveThread(threadId?: string) {
  const normalizedThreadId = threadId?.trim() ?? "";

  if (!normalizedThreadId) {
    return getOrCreateDemoThread();
  }

  const existingThread = await prisma.thread.findUnique({
    where: { id: normalizedThreadId },
    select: { id: true },
  });

  return existingThread;
}

/**
 * CHALLENGE: MESSAGING SYSTEM
 * 
 * Your goal is to build a basic communication channel between the Patient and Dentist.
 * 1. Implement the POST handler to save a new message into a Thread.
 * 2. Implement the GET handler to retrieve message history for a given thread.
 * 3. Focus on data integrity and proper relations.
 */

export async function GET(req: Request) {
  try {
    console.info(`${LOG_PREFIX}[GET] Request received`);
    const { searchParams } = new URL(req.url);
    const threadIdParam = searchParams.get("threadId") ?? undefined;
    const thread = await resolveThread(threadIdParam);

    if (!thread) {
      console.warn(`${LOG_PREFIX}[GET] Thread not found`, { threadId: threadIdParam ?? null });
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    const messages = await prisma.message.findMany({
      where: { threadId: thread.id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ threadId: thread.id, messages });
  } catch (err) {
    console.error(`${LOG_PREFIX}[GET] Unexpected server error`, {
      error: err instanceof Error ? err.message : "Unknown error",
    });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    console.info(`${LOG_PREFIX}[POST] Request received`);
    const body = await req.json();

    if (!body || typeof body !== "object") {
      logValidationFailure("invalid request body");
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const threadId = typeof body.threadId === "string" ? body.threadId.trim() : "";
    const sender = typeof body.sender === "string" ? body.sender.trim().toLowerCase() : "";
    const content = typeof body.content === "string" ? body.content.trim() : "";

    if (!sender) {
      logValidationFailure("missing sender", { threadId: threadId || null });
      return NextResponse.json({ error: "Missing sender" }, { status: 400 });
    }

    if (sender !== "patient" && sender !== "dentist") {
      logValidationFailure("invalid sender", { sender });
      return NextResponse.json(
        { error: "Invalid sender. Expected 'patient' or 'dentist'" },
        { status: 400 }
      );
    }

    if (!content) {
      logValidationFailure("empty content", { threadId: threadId || null, sender });
      return NextResponse.json({ error: "Message content cannot be empty" }, { status: 400 });
    }

    const thread = await resolveThread(threadId || undefined);

    if (!thread) {
      console.warn(`${LOG_PREFIX}[POST] Thread not found`, { threadId: threadId || null });
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    const message = await prisma.message.create({
      data: {
        threadId: thread.id,
        sender,
        content,
      },
    });

    console.info(`${LOG_PREFIX}[POST] Message created`, {
      messageId: message.id,
      threadId: thread.id,
      sender: message.sender,
    });

    return NextResponse.json({ threadId: thread.id, message }, { status: 201 });
  } catch (err) {
    console.error(`${LOG_PREFIX}[POST] Unexpected server error`, {
      error: err instanceof Error ? err.message : "Unknown error",
    });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
