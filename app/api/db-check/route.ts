import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

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
        payload: {
          teamAAssets: ["1", "2"],
          teamBAssets: ["3", "4"],
          settings: { scoring: "PPR", superflex: false, tePremium: 1.0 }
        },
        sideAPlayerIds: ["1", "2"], // Player IDs as strings
        sideBPlayerIds: ["3", "4"],
        teamATotal: 58,
        teamBTotal: 52,
        verdict: "FAVORS_A",
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
