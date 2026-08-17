/**
 * Unified Portal Base URL Resolver
 * Determines the live portal URL for email notifications, password resets, and account invitations.
 * 
 * Default Live Domain: https://smartfypproject-production.up.railway.app
 */

export const LIVE_PORTAL_URL = "https://smartfypproject-production.up.railway.app";

export const getPortalBaseUrl = (req = null, explicitOrigin = null) => {
  // 1. Check explicit environment configuration (if user customized it in Railway or server env)
  const envUrl = process.env.APP_URL || process.env.CLIENT_URL || process.env.FRONTEND_URL || process.env.PUBLIC_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.trim() !== "") {
    const trimmed = envUrl.trim().replace(/\/+$/, "");
    if (!trimmed.includes("localhost") && !trimmed.includes("127.0.0.1") && !trimmed.includes(".run.app")) {
      return trimmed;
    }
  }

  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`.replace(/\/+$/, "");
  }

  // 2. Check if request came from a custom production domain or Railway domain
  const checkUrl = (candidate) => {
    if (!candidate || typeof candidate !== "string" || !candidate.startsWith("http")) return null;
    const clean = candidate.trim().replace(/\/+$/, "");
    // If it's a dev sandbox (e.g. Google Cloud Run preview, localhost), reject it in favor of live Railway URL
    if (clean.includes("localhost") || clean.includes("127.0.0.1") || clean.includes(".run.app") || clean.includes("webcontainer")) {
      return null;
    }
    return clean;
  };

  const validExplicit = checkUrl(explicitOrigin);
  if (validExplicit) return validExplicit;

  const validBody = checkUrl(req?.body?.origin);
  if (validBody) return validBody;

  const validQuery = checkUrl(req?.query?.origin);
  if (validQuery) return validQuery;

  if (req) {
    const originHeader = typeof req.get === "function" ? req.get("origin") : req.headers?.origin;
    const validOrigin = checkUrl(originHeader);
    if (validOrigin) return validOrigin;

    const refererHeader = typeof req.get === "function" ? req.get("referer") : req.headers?.referer;
    if (refererHeader) {
      try {
        const parsed = new URL(refererHeader).origin;
        const validReferer = checkUrl(parsed);
        if (validReferer) return validReferer;
      } catch (e) {
        // ignore parse error
      }
    }
  }

  // 3. Guaranteed fallback to the live Railway portal deployment
  return LIVE_PORTAL_URL;
};

export default getPortalBaseUrl;

