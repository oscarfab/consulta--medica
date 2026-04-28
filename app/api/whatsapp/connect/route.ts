import { NextResponse } from "next/server";
import {
  connectWhatsApp,
  disconnectWhatsApp,
  getWhatsAppStatus,
  getCurrentQR,
} from "@/lib/whatsapp-client";

export async function GET() {
  return NextResponse.json({
    status: getWhatsAppStatus(),
    qr: getCurrentQR(),
  });
}

export async function POST() {
  connectWhatsApp();
  return NextResponse.json({ status: "connecting" });
}

export async function DELETE() {
  await disconnectWhatsApp();
  return NextResponse.json({ status: "disconnected" });
}
