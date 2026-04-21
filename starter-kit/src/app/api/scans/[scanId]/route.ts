import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: {
    scanId?: string;
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

export async function GET(_req: Request, context: RouteContext) {
  try {
    const scanId = context.params.scanId?.trim() ?? "";

    if (!scanId) {
      return NextResponse.json(
        { success: false, message: "Missing required route parameter: scanId." },
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
        updatedAt: true,
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
        id: scan.id,
        status: scan.status,
        createdAt: scan.createdAt,
        updatedAt: scan.updatedAt,
        imageCount: parsedImages.length,
        images: parsedImages,
      },
    });
  } catch (err) {
    console.error("[scans][scanId][GET] Unexpected server error", {
      error: err instanceof Error ? err.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
