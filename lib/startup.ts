import { getWhatsAppClient } from "@/lib/whatsapp-client";

// Inicia WhatsApp Web en background al arrancar el servidor.
// El módulo se carga una sola vez por proceso gracias al caché de Node.js.
void getWhatsAppClient();

export {};
