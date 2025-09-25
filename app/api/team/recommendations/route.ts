import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

type Recommendation =
  | {
      id: number;
      type: "player";
      name: string;
      position: string;
      age: number | null;
      team: string | null;
      nowScore: number | null;
      futureScore: number | null;
      composite: number | null;
    }
  | {
      id: number;
      type: "pick";
      name: string;         // e.g., "2026 2nd"
      position: "PICK";
      age: number | null;
      team: string | null;
      nowScore: number;
      futureScore: number;
      composite: number;
    };

export async function GET() {
  // Await auth() to get the session
  const session = await auth();
  const userId = session?.userId;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get valuations with player relation included
  const valuations = await prisma.valuation.findMany({
    include: { player: true },
    take: 100,
  });

  const recs: Recommendation[] = valuations.map((v) => {
    const nowScore = v.nowScore ?? v.projNow ?? v.marketValue ?? null;
    const futureScore = v.futureScore ?? v.projFuture ?? v.marketValue ?? null;
    const composite =
      nowScore !== null && futureScore !== null
        ? Number(((nowScore + futureScore) / 2).toFixed(2))
        : nowScore ?? futureScore ?? null;

    return {
      id: v.playerId,
      type: "player",
      name: v.player?.name ?? `Player #${v.playerId}`,
      position: v.player?.position ?? "UNK",
      age: v.player?.age ?? null,
      team: v.player?.team ?? null,
      nowScore,
      futureScore,
      composite,
    };
  });

  return NextResponse.json({
    userId,
    count: recs.length,
    recommendations: recs,
  });
}