import { NextRequest, NextResponse } from "next/server";
import { removeSubscriber } from "@/lib/subscriber-store";

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");

  if (!email) {
    return new NextResponse(
      "<html><body style='font-family:sans-serif;text-align:center;padding:80px'><h2>Link inválido</h2></body></html>",
      { headers: { "Content-Type": "text/html" } }
    );
  }

  const removed = await removeSubscriber(email);

  const message = removed
    ? "Você foi descadastrado da Harven Finance Newsletter."
    : "Este email não foi encontrado.";

  return new NextResponse(
    `<html>
      <body style="font-family:Inter,sans-serif;text-align:center;padding:80px;background:#F8F7F4;color:#1A1A1A">
        <h2 style="font-size:20px;font-weight:700">${message}</h2>
        <p style="margin-top:12px;color:#999;font-size:14px">Harven Finance Newsletter</p>
      </body>
    </html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}
