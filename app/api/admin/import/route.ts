import { NextRequest, NextResponse } from "next/server";
import { getAllEditions, saveEdition, StoredEdition } from "@/lib/edition-store";

// POST: Import editions (merge with existing)
export async function POST(request: NextRequest) {
  try {
    const { editions } = await request.json() as { editions: StoredEdition[] };

    if (!editions || !Array.isArray(editions)) {
      return NextResponse.json({ error: "editions must be an array" }, { status: 400 });
    }

    const existing = getAllEditions();
    const existingIds = new Set(existing.map((e) => e.id));
    let imported = 0;

    for (const ed of editions) {
      if (!existingIds.has(ed.id)) {
        saveEdition(ed);
        imported++;
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      total: getAllEditions().length,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
