import { NextRequest, NextResponse } from "next/server";
import { addSubscriber, getActiveSubscribers } from "@/lib/subscriber-store";

// POST: Subscribe an email
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email é obrigatório." },
        { status: 400 }
      );
    }

    const result = addSubscriber(email);

    return NextResponse.json(result, {
      status: result.success ? 200 : 409,
    });
  } catch {
    return NextResponse.json(
      { error: "Erro ao processar inscrição." },
      { status: 500 }
    );
  }
}

// GET: Count subscribers (admin)
export async function GET() {
  const subscribers = getActiveSubscribers();
  return NextResponse.json({ count: subscribers.length });
}
