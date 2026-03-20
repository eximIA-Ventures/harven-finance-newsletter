import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "data");
const SUBSCRIBERS_FILE = join(DATA_DIR, "subscribers.json");

export interface Subscriber {
  email: string;
  subscribedAt: string;
  active: boolean;
}

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getAllSubscribers(): Subscriber[] {
  ensureDataDir();
  if (!existsSync(SUBSCRIBERS_FILE)) return [];
  try {
    return JSON.parse(readFileSync(SUBSCRIBERS_FILE, "utf-8"));
  } catch {
    return [];
  }
}

export function getActiveSubscribers(): Subscriber[] {
  return getAllSubscribers().filter((s) => s.active);
}

export function addSubscriber(email: string): { success: boolean; message: string } {
  const normalized = email.toLowerCase().trim();

  if (!normalized || !normalized.includes("@")) {
    return { success: false, message: "Email inválido." };
  }

  const subscribers = getAllSubscribers();
  const existing = subscribers.find((s) => s.email === normalized);

  if (existing) {
    if (existing.active) {
      return { success: false, message: "Este email já está inscrito." };
    }
    // Reactivate
    existing.active = true;
    existing.subscribedAt = new Date().toISOString();
    writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2), "utf-8");
    return { success: true, message: "Inscrição reativada!" };
  }

  subscribers.push({
    email: normalized,
    subscribedAt: new Date().toISOString(),
    active: true,
  });

  writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2), "utf-8");
  return { success: true, message: "Inscrito com sucesso!" };
}

export function removeSubscriber(email: string): boolean {
  const normalized = email.toLowerCase().trim();
  const subscribers = getAllSubscribers();
  const sub = subscribers.find((s) => s.email === normalized);

  if (!sub) return false;

  sub.active = false;
  writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2), "utf-8");
  return true;
}
