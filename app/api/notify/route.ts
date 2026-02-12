import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
      return NextResponse.json(
        { ok: false, error: "Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const note = (body?.note ?? "").toString();
    const time = (body?.time ?? "").toString();

    const text =
      `💘 JANHAVI CLICKED YES 💘\n` +
      `Note: ${note || "(no note)"}\n` +
      `Time: ${time || "(unknown)"}\n` +
      `From: Keenan's Valentine site`;

    const telegramURL = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

    const tgRes = await fetch(telegramURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text }),
    });

    const data = await tgRes.json();

    if (!data?.ok) {
      return NextResponse.json(
        { ok: false, error: data?.description || "Telegram failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
