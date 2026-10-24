import { AppError } from '../errors/appError.js';

/**
 * Validates that a user-provided URL is syntactically valid and points to a safe public host.
 * Protects against Server-Side Request Forgery (SSRF) and access to local/private network resources.
 *
 * @param {string} rawUrl - The input URL string from user
 * @returns {string} - Clean, validated URL string
 * @throws {AppError} - If the URL is invalid or unsafe
 */
export function validatePublicUrl(rawUrl, allowLocalhost = false) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw AppError.badRequest('A valid website URL is required.', 'INVALID_URL');
  }

  const trimmed = rawUrl.trim();
  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw AppError.badRequest('Invalid URL format. Please provide a complete URL including http:// or https://', 'INVALID_URL_SYNTAX');
  }

  // Must only allow http or https protocols
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw AppError.badRequest('Only HTTP and HTTPS URLs are supported.', 'UNSUPPORTED_PROTOCOL');
  }

  const hostname = parsed.hostname.toLowerCase();

  // If localhost is explicitly allowed (Localhost mode)
  if (allowLocalhost && (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1')) {
    return parsed.toString();
  }

  // Block localhost and standard loopback hostnames
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '0.0.0.0' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    throw AppError.badRequest(
      'Analysis of localhost and local machine addresses is disabled in Public URL mode. Switch to Localhost mode to test local apps.',
      'SSRF_PROHIBITED'
    );
  }

  // Check IPv4 private and link-local ranges
  // 10.0.0.0 - 10.255.255.255
  // 172.16.0.0 - 172.31.255.255
  // 192.168.0.0 - 192.168.255.255
  // 169.254.0.0 - 169.254.255.255 (Link-local & cloud metadata)
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = hostname.match(ipv4Regex);

  if (match) {
    const [, o1, o2] = match.map(Number);

    if (
      o1 === 10 ||
      o1 === 127 ||
      o1 === 0 ||
      (o1 === 172 && o2 >= 16 && o2 <= 31) ||
      (o1 === 192 && o2 === 168) ||
      (o1 === 169 && o2 === 254)
    ) {
      throw AppError.badRequest(
        'Private and local IP addresses are not permitted. Please provide a publicly accessible website URL.',
        'SSRF_PROHIBITED'
      );
    }
  }

  return parsed.toString();
}
