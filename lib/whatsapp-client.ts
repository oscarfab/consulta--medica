import { Client, LocalAuth } from "whatsapp-web.js";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const qrcode = require("qrcode-terminal") as {
  generate: (qr: string, options?: { small?: boolean }) => void;
};

declare global {
  // eslint-disable-next-line no-var
  var __whatsappClient: Client | null;
  // eslint-disable-next-line no-var
  var __whatsappReady: boolean;
  // eslint-disable-next-line no-var
  var __whatsappInitPromise: Promise<Client> | null;
}

global.__whatsappClient = global.__whatsappClient || null;
global.__whatsappReady = global.__whatsappReady || false;
global.__whatsappInitPromise = global.__whatsappInitPromise || null;

function makeClient(dataPath: string): Client {
  const c = new Client({
    authStrategy: new LocalAuth({ dataPath }),
    puppeteer: {
      executablePath:
        process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium",
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

  c.on("qr", (qr: string) => {
    console.log("=== ESCANEA ESTE QR CON TU WHATSAPP ===");
    qrcode.generate(qr, { small: true });
  });

  c.on("ready", () => {
    console.log("✅ Evento: ready - isReady:", global.__whatsappReady);
    global.__whatsappReady = true;
  });

  c.on("authenticated", () => {
    console.log("🔐 Evento: authenticated - isReady:", global.__whatsappReady);
    global.__whatsappReady = true;
  });

  c.on("auth_failure", (msg: string) => {
    console.log("❌ Evento: auth_failure:", msg);
  });

  c.on("loading_screen", (percent: number, message: string) => {
    console.log(`⏳ Cargando WhatsApp: ${percent}% - ${message}`);
  });

  c.on("disconnected", () => {
    global.__whatsappReady = false;
    global.__whatsappClient = null;
    global.__whatsappInitPromise = null;
  });

  return c;
}

export async function getWhatsAppClient(): Promise<Client> {
  if (global.__whatsappClient && global.__whatsappReady) return global.__whatsappClient;

  if (global.__whatsappInitPromise) return global.__whatsappInitPromise;

  global.__whatsappInitPromise = (async () => {
    global.__whatsappClient = makeClient(".wwebjs_auth");

    try {
      await global.__whatsappClient.initialize();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("already running")) {
        console.log("Reiniciando con nueva sesión...");
        global.__whatsappClient = null;
        global.__whatsappReady = false;
        global.__whatsappInitPromise = null;

        const newClient = makeClient(".wwebjs_auth2");
        await newClient.initialize();
        global.__whatsappClient = newClient;
        return newClient;
      }
      global.__whatsappInitPromise = null;
      throw err;
    }

    console.log("Estado final isReady:", global.__whatsappReady);
    console.log("Cliente existe:", !!global.__whatsappClient);
    return global.__whatsappClient;
  })();

  return global.__whatsappInitPromise;
}

export function isWhatsAppReady(): boolean {
  return global.__whatsappReady;
}

export async function waitForReady(maxWait = 15000): Promise<void> {
  const start = Date.now();
  while (!global.__whatsappReady) {
    if (Date.now() - start > maxWait) {
      throw new Error("WhatsApp no está listo, intenta en unos segundos");
    }
    console.log("Esperando... isReady:", global.__whatsappReady, "tiempo:", Date.now() - start, "ms");
    await new Promise<void>((r) => setTimeout(r, 500));
  }
}
