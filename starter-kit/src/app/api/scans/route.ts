import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type CreateScanRequest = {
  images?: unknown;
  capturedImages?: unknown;
  status?: unknown;
  userId?: unknown;
  patientId?: unknown;
};

function parseStoredImages(images: string): string[] {
  const raw = images.trim();
  if (!raw) return [];

  // Support both historical JSON-string storage and comma-separated storage.
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    }
  } catch {
    // Fall through to comma-separated parsing.
  }

  return raw
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function normalizeImages(input: unknown): string[] {
  if (!input) return [];

  if (Array.isArray(input)) {
    return input
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) return [];
    return [trimmed];
  }

  return [];
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const scanId = searchParams.get("scanId")?.trim() || "";

    if (!scanId) {
      return NextResponse.json(
        { success: false, message: "Missing required query parameter: scanId." },
        { status: 400 }
      );
    }

    const scan = await prisma.scan.findUnique({
      where: { id: scanId },
      select: {
        id: true,
        status: true,
        images: true,
        createdAt: true,
      },
    });

    if (!scan) {
      return NextResponse.json(
        { success: false, message: "Scan not found." },
        { status: 404 }
      );
    }

    const parsedImages = parseStoredImages(scan.images);

    return NextResponse.json({
      success: true,
      scan: {
        ...scan,
        parsedImages,
        imageCount: parsedImages.length,
      },
    });
  } catch (err) {
    console.error("[scans][GET] Unexpected server error", {
      error: err instanceof Error ? err.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    let body: CreateScanRequest;
    try {
      body = (await req.json()) as CreateScanRequest;
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, message: "Request body is required." },
        { status: 400 }
      );
    }

    const statusInput = typeof body.status === "string" ? body.status.trim() : "";
    const status = statusInput || "completed";
    const userId =
      typeof body.userId === "string"
        ? body.userId.trim()
        : typeof body.patientId === "string"
          ? body.patientId.trim()
          : "";

    const images = normalizeImages(body.images);
    const fallbackImages = normalizeImages(body.capturedImages);
    const finalImages = images.length > 0 ? images : fallbackImages;

    if (status !== "completed") {
      return NextResponse.json(
        { success: false, message: "Invalid status. Expected 'completed'." },
        { status: 400 }
      );
    }

    if (finalImages.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing captured images. Provide images or capturedImages.",
        },
        { status: 400 }
      );
    }

    const scan = await prisma.scan.create({
      data: {
        status: "completed",
        // SQLite model stores images as string, so we keep a simple comma-separated list.
        images: finalImages.join(","),
      },
      select: {
        id: true,
        status: true,
        images: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Scan submitted successfully.",
        scanId: scan.id,
        scan,
        userId: userId || null,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[scans][POST] Unexpected server error", {
      error: err instanceof Error ? err.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
