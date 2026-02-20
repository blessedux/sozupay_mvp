import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  listWalls,
  createWall,
} from "@/lib/walls";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const includeArchived = searchParams.get("archived") === "1";
  const walls = listWalls(includeArchived);
  return NextResponse.json({ walls });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "Unnamed wall";
  const defaultAmount = typeof body.defaultAmount === "string" ? body.defaultAmount : "0";
  const reference = typeof body.reference === "string" ? body.reference.trim() : "";

  const wall = createWall(name, defaultAmount, reference);
  return NextResponse.json({ wall });
}
