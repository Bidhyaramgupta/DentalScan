import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type CreateScanRequest = {
  status?: unknown;
  images?: unknown;
};

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

    const status = typeof body.status === "string" ? body.status.trim() : "";
    const images = Array.isArray(body.images)
      ? body.images.filter((image): image is string => typeof image === "string" && image.trim().length > 0)
      : [];

    if (!status) {
      return NextResponse.json(
        { success: false, message: "Missing required field: status." },
        { status: 400 }
      );
    }

    if (status !== "completed") {
      return NextResponse.json(
        { success: false, message: "Invalid status. Expected 'completed'." },
        { status: 400 }
      );
    }

    if (images.length === 0) {
      return NextResponse.json(
        { success: false, message: "At least one captured image is required." },
        { status: 400 }
      );
    }

    const scan = await prisma.scan.create({
      data: {
        status: "completed",
        images: JSON.stringify(images),
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Scan submitted successfully.",
      scan,
    });
  } catch (err) {
    console.error("[scan][POST] Unexpected server error", {
      error: err instanceof Error ? err.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
