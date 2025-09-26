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
  // If your Clerk version returns sync data here, remove 'await'. For @clerk/nextjs/server it's async.
  const session = await auth();
  const userId = session.userId;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // IMPORTANT: Do NOT filter on settingsHash unless it exists in your Prisma model
  const valuations = await prisma.valuation.findMany({
    // where: { ... }, // add real filters only if they exist in Prisma
    include: { player: true },  // so v.player is available
    take: 100,
  });

  const recs: Recommendation[] = valuations.map((v) => {
    const nowScore = v.projNow ?? v.marketValue ?? null;
    const futureScore = v.projFuture ?? v.marketValue ?? null;
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