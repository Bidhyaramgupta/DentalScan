import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type CreateScanNotificationRequest = {
  scanId?: unknown;
  userId?: unknown;
  status?: unknown;
};

/**
 * Quick Manual Backend Test Checklist
 * 1) POST /api/notify with { userId, status: "completed" } -> 200 success + notification payload.
 * 2) POST /api/notify with invalid status -> 400.
 * 3) POST /api/notify with missing userId/status -> 400.
 * 4) POST /api/notify with scanId that does not exist -> 404.
 * 5) Verify DB row exists in Notification table after valid POST (read should default to false).
 * 6) GET /api/notify?userId=<id> -> returns newest-first notifications for that user.
 * 7) PATCH /api/notify with { id } -> 200 and read=true; unknown id -> 404.
 */

export async function GET(req: Request) {
  try {
    console.info("[notify][GET] Request received");
    const { searchParams } = new URL(req.url);
    const userIdParam = searchParams.get("userId");
    const userId = userIdParam?.trim() || "";

    const notifications = await prisma.notification.findMany({
      where: userId ? { userId } : undefined,
      orderBy: { createdAt: "desc" },
    });

    console.info("[notify][GET] Notifications fetched", {
      userId: userId || null,
      count: notifications.length,
    });

    return NextResponse.json({
      success: true,
      message: "Notifications fetched successfully.",
      notifications,
    });
  } catch (err) {
    console.error("[notify][GET] Database failure", {
      error: err instanceof Error ? err.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    console.info("[notify][PATCH] Request received");
    let body: { id?: unknown };
    try {
      body = (await req.json()) as { id?: unknown };
    } catch {
      console.warn("[notify][PATCH] Validation failure: invalid JSON body");
      return NextResponse.json(
        { success: false, message: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      console.warn("[notify][PATCH] Validation failure: missing request body");
      return NextResponse.json(
        { success: false, message: "Request body is required." },
        { status: 400 }
      );
    }

    const id = typeof body.id === "string" ? body.id.trim() : "";
    if (!id) {
      console.warn("[notify][PATCH] Validation failure: missing id");
      return NextResponse.json(
        { success: false, message: "Missing required field: id." },
        { status: 400 }
      );
    }

    const updated = await prisma.notification.updateMany({
      where: { id },
      data: { read: true },
    });

    if (updated.count === 0) {
      console.warn("[notify][PATCH] Notification not found", { id });
      return NextResponse.json(
        { success: false, message: "Notification not found." },
        { status: 404 }
      );
    }

    console.info("[notify][PATCH] Notification marked as read", { id });

    return NextResponse.json({
      success: true,
      message: "Notification marked as read.",
      notification: {
        id,
        read: true,
      },
    });
  } catch (err) {
    console.error("[notify][PATCH] Database failure", {
      error: err instanceof Error ? err.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * CHALLENGE: NOTIFICATION SYSTEM
 * 
 * Your goal is to implement a robust notification logic.
 * 1. When a scan is "completed", create a record in the Notification table.
 * 2. Return a success status to the client.
 * 3. Bonus: Handle potential errors (e.g., database connection issues).
 */

export async function POST(req: Request) {
  try {
    console.info("[notify][POST] Request received");
    let body: CreateScanNotificationRequest;
    try {
      body = (await req.json()) as CreateScanNotificationRequest;
    } catch {
      console.warn("[notify][POST] Validation failure: invalid JSON body");
      return NextResponse.json(
        { success: false, message: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      console.warn("[notify][POST] Validation failure: missing request body");
      return NextResponse.json(
        { success: false, message: "Request body is required." },
        { status: 400 }
      );
    }

    const scanId = typeof body.scanId === "string" ? body.scanId.trim() : "";
    const status = typeof body.status === "string" ? body.status.trim() : "";
    const userId = typeof body.userId === "string" ? body.userId.trim() : "";

    if (!status) {
      console.warn("[notify][POST] Validation failure: missing status");
      return NextResponse.json(
        { success: false, message: "Missing required field: status." },
        { status: 400 }
      );
    }

    if (status !== "completed") {
      console.warn("[notify][POST] Validation failure: invalid status", { status });
      return NextResponse.json(
        {
          success: false,
          message: "Invalid status for notification creation. Expected 'completed'.",
        },
        { status: 400 }
      );
    }

    if (!userId) {
      console.warn("[notify][POST] Validation failure: missing userId");
      return NextResponse.json(
        {
          success: false,
          message: "Missing required field: userId.",
        },
        { status: 400 }
      );
    }

    if (scanId) {
      const scan = await prisma.scan.findUnique({
        where: { id: scanId },
        select: { id: true },
      });

      if (!scan) {
        console.warn("[notify][POST] Validation failure: scan not found", { scanId });
        return NextResponse.json(
          { success: false, message: "Scan not found." },
          { status: 404 }
        );
      }
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        title: "Scan Completed",
        message: "Your dental scan is complete and ready for review.",
      },
    });

    console.info("[notify][POST] Notification created", {
      notificationId: notification.id,
      userId: notification.userId,
      scanId: scanId || null,
    });

    return NextResponse.json({
      success: true,
      message: "Scan completed notification created.",
      notification: {
        id: notification.id,
        userId: notification.userId,
        scanId: scanId || null,
        title: notification.title,
        message: notification.message,
        read: notification.read,
        createdAt: notification.createdAt,
      },
    });
  } catch (err) {
    console.error("[notify][POST] Database failure", {
      error: err instanceof Error ? err.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
