import { NextResponse } from "next/server";
import { getAllEditions } from "@/lib/edition-store";

export async function GET() {
  const editions = await getAllEditions();
  return NextResponse.json({ editions });
}
