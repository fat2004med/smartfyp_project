/**
 * Unified Portal Base URL Resolver
 * Determines the exact live portal URL for email notifications, password resets, and account invitations.
 * Dynamically resolves to the current active environment (Cloud Run, Railway, custom domain, or local preview).
 */

export const DEFAULT_FALLBACK_URL = "https://smartfypproject-production.up.railway.app";

/**
 * Validates and sanitizes a candidate URL string
 */
const sanitizeUrl = (candidate) => {
  if (!candidate || typeof candidate !== "string") return null;
  const trimmed = candidate.trim().replace(/\/+$/, "");
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return null;
  }
  try {
    const parsed = new URL(trimmed);
    return `${parsed.protocol}//${parsed.host}`;
  } catch (e) {
    return null;
  }
};

export const getPortalBaseUrl = (req = null, explicitOrigin = null) => {
  // 1. Highest Priority: Explicit origin passed directly by the caller or request payload
  const cleanExplicit = sanitizeUrl(explicitOrigin);
  if (cleanExplicit) return cleanExplicit;

  const cleanBodyOrigin = sanitizeUrl(req?.body?.origin);
  if (cleanBodyOrigin) return cleanBodyOrigin;

  const cleanQueryOrigin = sanitizeUrl(req?.query?.origin);
  if (cleanQueryOrigin) return cleanQueryOrigin;

  // 2. Request Headers from live browser interaction
  if (req) {
    // Check standard Origin header
    const originHeader = typeof req.get === "function" ? req.get("origin") : req.headers?.origin;
    const cleanOriginHeader = sanitizeUrl(originHeader);
    if (cleanOriginHeader) return cleanOriginHeader;

    // Check Referer header (extract origin)
    const refererHeader = typeof req.get === "function" ? req.get("referer") : req.headers?.referer;
    if (refererHeader) {
      try {
        const parsedReferer = new URL(refererHeader).origin;
        const cleanReferer = sanitizeUrl(parsedReferer);
        if (cleanReferer) return cleanReferer;
      } catch (e) {
        // ignore invalid URL
      }
    }

    // Check X-Forwarded-Host (used by Cloud Run, reverse proxies, and Railway)
    const forwardedHost = typeof req.get === "function" ? req.get("x-forwarded-host") : req.headers?.["x-forwarded-host"];
    if (forwardedHost) {
      const forwardedProto = (typeof req.get === "function" ? req.get("x-forwarded-proto") : req.headers?.["x-forwarded-proto"]) || "https";
      const cleanForwarded = sanitizeUrl(`${forwardedProto}://${forwardedHost.split(",")[0].trim()}`);
      if (cleanForwarded) return cleanForwarded;
    }

    // Check standard Host header
    const hostHeader = typeof req.get === "function" ? req.get("host") : req.headers?.host;
    if (hostHeader) {
      const proto = req.secure || (typeof req.get === "function" && req.get("x-forwarded-proto") === "https") ? "https" : (req.protocol || "https");
      const cleanHost = sanitizeUrl(`${proto}://${hostHeader}`);
      if (cleanHost) return cleanHost;
    }
  }

  // 3. Explicit Environment Variables (configured in deployment)
  const envUrl = process.env.APP_URL || process.env.CLIENT_URL || process.env.FRONTEND_URL || process.env.PUBLIC_URL || process.env.BASE_URL;
  const cleanEnvUrl = sanitizeUrl(envUrl);
  if (cleanEnvUrl) return cleanEnvUrl;

  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    const cleanRailway = sanitizeUrl(`https://${process.env.RAILWAY_PUBLIC_DOMAIN}`);
    if (cleanRailway) return cleanRailway;
  }

  // 4. Default Fallback
  return DEFAULT_FALLBACK_URL;
};

export default getPortalBaseUrl;


