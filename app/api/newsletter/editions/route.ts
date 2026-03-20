import { NextResponse } from "next/server";
import { getAllEditions } from "@/lib/edition-store";

export async function GET() {
  const editions = getAllEditions();
  return NextResponse.json({ editions });
}
