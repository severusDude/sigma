import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { updateTag } from "next/cache";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BATCH_SIZE = 100;

export async function GET(request: Request) {
  const isVercelCron = request.headers.get("x-vercel-cron-schedule") !== null;
  const authHeader = request.headers.get("authorization");

  if (!isVercelCron && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalDeactivated = 0;
    let hasMore = true;
    let batchCount = 0;

    while (hasMore) {
      const expiredInterns = await prisma.internProfile.findMany({
        where: {
          status: "active",
          periodEnd: { lt: today },
          deletedAt: null,
          deactivatedAt: null,
        },
        select: { id: true, userId: true, periodEnd: true },
        take: BATCH_SIZE,
      });

      if (expiredInterns.length === 0) {
        hasMore = false;
        break;
      }

      const internIds = expiredInterns.map((i) => i.id);
      const userIds = expiredInterns.map((i) => i.userId);

      const affectedSupervisors = await prisma.internSupervisor.findMany({
        where: { internProfileId: { in: internIds }, endedAt: null },
        select: { supervisorProfileId: true },
      });

      await prisma.$transaction(async (tx) => {
        await tx.user.updateMany({
          where: { id: { in: userIds } },
          data: { banned: true, banReason: "Masa magang telah berakhir" },
        });

        await tx.internProfile.updateMany({
          where: { id: { in: internIds } },
          data: { status: "completed", deactivatedAt: new Date() },
        });

        await tx.internSupervisor.updateMany({
          where: {
            internProfileId: { in: internIds },
            endedAt: null,
          },
          data: { endedAt: new Date() },
        });

        await tx.auditLog.create({
          data: {
            action: "deactivate_interns",
            actorId: "system",
            metadata: {
              count: expiredInterns.length,
              internIds,
              batch: batchCount + 1,
              periodEnds: expiredInterns.map((i) => i.periodEnd.toISOString()),
            },
          },
        });
      });

      const uniqueSupervisorIds = [
        ...new Set(affectedSupervisors.map((s) => s.supervisorProfileId)),
      ];
      for (const sid of uniqueSupervisorIds) {
        updateTag(`assessment-list-${sid}`);
        updateTag(`assessment-period-${sid}`);
      }

      batchCount++;
      totalDeactivated += expiredInterns.length;
      hasMore = expiredInterns.length === BATCH_SIZE;
    }

    return NextResponse.json({
      success: true,
      message: "Cron deactivate interns executed",
      deactivated: totalDeactivated,
      batches: batchCount,
    });
  } catch (error) {
    await prisma.auditLog.create({
      data: {
        action: "deactivate_interns_error",
        actorId: "system",
        metadata: {
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Cron job failed",
      },
      { status: 500 },
    );
  }
}
