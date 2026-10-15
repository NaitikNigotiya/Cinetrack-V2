/**
 * Computes a deterministic short hex hash for an FCM token to use as a document ID.
 */
export async function hashToken(token: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder()
    const data = encoder.encode(token)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32)
  }

  // Fallback simple hash for environments without crypto.subtle
  let hash = 0
  for (let i = 0; i < token.length; i++) {
    hash = (hash << 5) - hash + token.charCodeAt(i)
    hash |= 0
  }
  return `fallback_${Math.abs(hash).toString(16)}`
}
