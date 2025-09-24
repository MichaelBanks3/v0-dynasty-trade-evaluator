import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Ensure a test user exists
    const user = await prisma.user.upsert({
      where: { id: "test_user" },
      update: {},
      create: { id: "test_user", email: "test@example.com" },
    });

    // Create a test trade (fields aligned with your schema)
    const trade = await prisma.trade.create({
      data: {
        userId: user.id,
        // Just pass plain arrays for JSON columns
        teamAIds: ["Amon-Ra St. Brown"],
        teamBIds: ["Garrett Wilson"],
        totalA: 58,
        totalB: 52,
        verdict: "FAVORS_A",
        diff: 58 - 52,
      },
    });

    const totals = await prisma.trade.count({
      where: { userId: user.id },
    });

    return NextResponse.json({
      ok: true,
      userId: user.id,
      createdTradeId: trade.id,
      tradesForUser: totals,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message },
      { status: 500 }
    );
  }
}
