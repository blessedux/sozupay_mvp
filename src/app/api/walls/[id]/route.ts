import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getWall, updateWall } from "@/lib/walls";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const wall = getWall(id);
  if (!wall) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ wall });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const wall = updateWall(id, {
    name: typeof body.name === "string" ? body.name : undefined,
    defaultAmount: typeof body.defaultAmount === "string" ? body.defaultAmount : undefined,
    reference: typeof body.reference === "string" ? body.reference : undefined,
    archived: typeof body.archived === "boolean" ? body.archived : undefined,
  });
  if (!wall) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ wall });
}
