import { randomBytes } from "node:crypto";
import {
  ALLOWED_ATTACHMENT_TYPES,
  MAX_ATTACHMENT_BYTES,
} from "@/lib/events/constants";

export class AttachmentError extends Error {}

/**
 * Validates and stores a request attachment. Uses Vercel Blob when
 * BLOB_READ_WRITE_TOKEN is set; otherwise the file is accepted but not
 * stored (development), and null is returned.
 */
export async function storeAttachment(
  file: File | null,
): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new AttachmentError("Attachment must be 10 MB or smaller");
  }
  const ext = ALLOWED_ATTACHMENT_TYPES[file.type];
  if (!ext) {
    throw new AttachmentError(
      "Attachment must be a PDF, Office document, image, or text file",
    );
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.info(`[storage] skipped storing ${file.name} (no blob token)`);
    return null;
  }
  const { put } = await import("@vercel/blob");
  const key = `requests/${randomBytes(16).toString("hex")}.${ext}`;
  const blob = await put(key, file, {
    access: "private",
    contentType: file.type,
    addRandomSuffix: false,
  });
  return blob.url;
}
