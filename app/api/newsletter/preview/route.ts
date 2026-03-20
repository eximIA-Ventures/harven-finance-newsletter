import { NextResponse } from "next/server";
import { generateNewsletter } from "@/lib/newsletter-generator";

// GET: Generate and return raw HTML (for browser preview)
export async function GET() {
  try {
    const edition = await generateNewsletter();

    return new NextResponse(edition.html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Newsletter preview error:", error);
    return NextResponse.json(
      { error: "Failed to generate preview" },
      { status: 500 }
    );
  }
}
