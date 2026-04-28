import { NextResponse } from "next/server";
import { isWhatsAppReady } from "@/lib/whatsapp-client";

export async function GET() {
  return NextResponse.json({ connected: isWhatsAppReady() });
}
