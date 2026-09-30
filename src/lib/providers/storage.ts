import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export interface StorageProvider {
  put(key: string, data: Buffer): Promise<void>;
  get(key: string): Promise<Buffer | null>;
}
export class NotConfiguredError extends Error {}

/** Development only. Files live outside /public, and are only readable through admin-checked routes. */
class LocalStorage implements StorageProvider {
  private root = path.resolve(process.cwd(), ".private-uploads");
  private safe(key: string) {
    const p = path.resolve(this.root, key);
    if (!p.startsWith(this.root + path.sep)) throw new Error("Invalid storage key");
    return p;
  }
  async put(key: string, data: Buffer) { const p = this.safe(key); await mkdir(path.dirname(p), { recursive: true }); await writeFile(p, data); }
  async get(key: string) { try { return await readFile(this.safe(key)); } catch { return null; } }
}

export function getStorage(): StorageProvider {
  const kind = process.env.STORAGE_PROVIDER;
  if (kind === "local") {
    if (process.env.NODE_ENV === "production") throw new NotConfiguredError("Local storage is not allowed in production.");
    return new LocalStorage();
  }
  // TODO: S3-compatible provider (R2/S3) implementing StorageProvider.
  throw new NotConfiguredError("Document storage is not configured yet.");
}
