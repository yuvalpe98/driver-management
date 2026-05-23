/**
 * Signature "storage" — we store the base64 data URI directly in the database
 * instead of uploading to an external service. The DB column is a plain TEXT
 * field and Next.js <Image unoptimized> renders data URIs just fine.
 */
export async function uploadSignature(base64: string): Promise<string> {
  return base64.startsWith("data:") ? base64 : `data:image/png;base64,${base64}`;
}
