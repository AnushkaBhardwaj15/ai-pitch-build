import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

type RouteParams = {
  params: Promise<{ id: string }>;
};

/** Get one deck with its slides (ordered). */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const deck = await prisma.deck.findUnique({
      where: { id },
      include: {
        slides: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    return NextResponse.json(deck);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch deck details" },
      { status: 500 },
    );
  }
}
