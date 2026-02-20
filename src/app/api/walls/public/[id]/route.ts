import { NextResponse } from "next/server";
import { getWall } from "@/lib/walls";

/**
 * Public read-only wall info for payment page (no auth).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const wall = getWall(id);
  if (!wall || wall.archived) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ wall });
}
