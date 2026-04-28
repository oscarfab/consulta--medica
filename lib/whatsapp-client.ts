import { Client, LocalAuth } from "whatsapp-web.js";

const isBuildTime = process.env.NEXT_PHASE === "phase-production-build";

declare global {
  // eslint-disable-next-line no-var
  var __whatsappClient: Client | null;
  // eslint-disable-next-line no-var
  var __whatsappReady: boolean;
  // eslint-disable-next-line no-var
  var __whatsappInitPromise: Promise<Client> | null;
  // eslint-disable-next-line no-var
  var __whatsappQR: string | null;
}

global.__whatsappClient = global.__whatsappClient || null;
global.__whatsappReady = global.__whatsappReady || false;
global.__whatsappInitPromise = global.__whatsappInitPromise || null;
global.__whatsappQR = global.__whatsappQR || null;

function makeClient(): Client {
  const c = new Client({
    authStrategy: new LocalAuth({ dataPath: "/tmp/.wwebjs_auth" }),
    puppeteer: {
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium",
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--no-first-run",
        "--disable-gpu",
      ],
    },
    webVersionCache: {
      type: "remote",
      remotePath:
        "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
    },
  });

  c.on("qr", async (qr: string) => {
    const QRCode = await import("qrcode");
    global.__whatsappQR = await QRCode.toDataURL(qr);
    console.log("QR generado para la UI");
  });

  c.on("ready", () => {
    global.__whatsappQR = null;
    global.__whatsappReady = true;
    console.log("✅ WhatsApp listo");
  });

  c.on("authenticated", () => {
    global.__whatsappReady = true;
    console.log("🔐 WhatsApp autenticado");
  });

  c.on("auth_failure", (msg: string) => {
    console.error("❌ auth_failure:", msg);
    global.__whatsappReady = false;
    global.__whatsappClient = null;
    global.__whatsappInitPromise = null;
    global.__whatsappQR = null;
  });

  c.on("loading_screen", (percent: number, message: string) => {
    console.log(`⏳ Cargando: ${percent}% - ${message}`);
  });

  c.on("disconnected", () => {
    global.__whatsappReady = false;
    global.__whatsappClient = null;
    global.__whatsappInitPromise = null;
    global.__whatsappQR = null;
  });

  return c;
}

export type WhatsAppStatus = "disconnected" | "connecting" | "connected";

export function getWhatsAppStatus(): WhatsAppStatus {
  if (global.__whatsappReady) return "connected";
  if (global.__whatsappInitPromise) return "connecting";
  return "disconnected";
}

export function getCurrentQR(): string | null {
  return global.__whatsappQR || null;
}

export function isWhatsAppReady(): boolean {
  return global.__whatsappReady || false;
}

export function connectWhatsApp(): void {
  if (isBuildTime) return;
  if (global.__whatsappReady || global.__whatsappInitPromise) return;

  const client = makeClient();
  global.__whatsappClient = client;

  global.__whatsappInitPromise = (async (): Promise<Client> => {
    try {
      await client.initialize();
      return client;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("already running")) {
        const fresh = makeClient();
        global.__whatsappClient = fresh;
        await fresh.initialize();
        return fresh;
      }
      global.__whatsappInitPromise = null;
      throw err;
    }
  })();
}

export async function disconnectWhatsApp(): Promise<void> {
  const client = global.__whatsappClient;
  global.__whatsappClient = null;
  global.__whatsappReady = false;
  global.__whatsappInitPromise = null;
  global.__whatsappQR = null;
  if (client) {
    try {
      await client.destroy();
    } catch {
      // ignore
    }
  }
}

export async function getWhatsAppClient(): Promise<Client> {
  if (isBuildTime) throw new Error("WhatsApp no disponible durante build");
  if (global.__whatsappClient && global.__whatsappReady) return global.__whatsappClient;
  if (!global.__whatsappInitPromise) throw new Error("WhatsApp no está conectado");
  return global.__whatsappInitPromise;
}

export async function waitForReady(maxWait = 15000): Promise<void> {
  const start = Date.now();
  while (!global.__whatsappReady) {
    if (Date.now() - start > maxWait) {
      throw new Error("WhatsApp no está listo, intenta en unos segundos");
    }
    await new Promise<void>((r) => setTimeout(r, 500));
  }
}
