const { OAuth2Client } = require("google-auth-library");
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, FRONTEND_URL, BACKEND_URL } = require("../../config/env");
const googleService = require("./google.service");
const { sendSuccess } = require("../../utils/apiResponse");
const ApiError = require("../../utils/apiError");

/**
 * Dynamically resolves the Google OAuth callback redirect URI based on
 * the active environment and incoming request headers.
 */
function getCallbackUrl(req) {
  // 1. If BACKEND_URL is explicitly set and is NOT localhost, prefer it
  if (BACKEND_URL && !BACKEND_URL.includes("localhost") && !BACKEND_URL.includes("127.0.0.1")) {
    return `${BACKEND_URL.replace(/\/+$/, "")}/api/auth/google/callback`;
  }
  // 2. Automatically derive from incoming Vercel / proxy headers
  if (req) {
    const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
    const host = req.headers["x-forwarded-host"] || req.get("host");
    if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
      return `${proto}://${host}/api/auth/google/callback`;
    }
  }
  return `${BACKEND_URL || "http://localhost:5000"}/api/auth/google/callback`;
}

function getOAuthClient(req) {
  return new OAuth2Client(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    getCallbackUrl(req)
  );
}

/**
 * Resolves the destination frontend URL to send the authenticated user back to.
 */
function getFrontendBaseUrl(req, state) {
  // 1. Check if the state parameter carried the client's origin URL
  if (state && /^https?:\/\//i.test(state)) {
    try {
      const u = new URL(state);
      return `${u.protocol}//${u.host}`;
    } catch (_) {}
  }
  // 2. Check FRONTEND_URL from env if it is not localhost
  if (FRONTEND_URL && !FRONTEND_URL.includes("localhost") && !FRONTEND_URL.includes("127.0.0.1")) {
    return FRONTEND_URL.replace(/\/+$/, "");
  }
  // 3. Fallback to Referer/Origin headers from client request
  if (req) {
    const ref = req.get("referer") || req.get("origin");
    if (ref) {
      try {
        const u = new URL(ref);
        if (!u.hostname.includes("localhost") && !u.hostname.includes("127.0.0.1")) {
          return `${u.protocol}//${u.host}`;
        }
      } catch (_) {}
    }
  }
  return FRONTEND_URL || "http://localhost:5173";
}

async function redirectToGoogle(req, res) {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new ApiError(500, "Google OAuth not configured", "OAUTH_NOT_CONFIGURED");
  }

  const client = getOAuthClient(req);

  const scopes = [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile"
  ];

  // Capture calling client origin from query param or referer so we can redirect back accurately
  const originParam = req.query.origin || req.get("referer") || req.get("origin") || "";
  let cleanOrigin = "";
  if (originParam && /^https?:\/\//i.test(originParam)) {
    try {
      const u = new URL(originParam);
      cleanOrigin = `${u.protocol}//${u.host}`;
    } catch (_) {}
  }

  const url = client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent",
    state: cleanOrigin || req.query.state || ""
  });

  res.redirect(url);
}

async function handleGoogleCallback(req, res) {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new ApiError(500, "Google OAuth not configured", "OAUTH_NOT_CONFIGURED");
  }

  const { code, error, state } = req.query;
  const frontendBase = getFrontendBaseUrl(req, state);

  if (error) {
    return res.redirect(`${frontendBase}/login?error=google_oauth_${error}`);
  }

  if (!code) {
    return res.redirect(`${frontendBase}/login?error=missing_code`);
  }

  try {
    const client = getOAuthClient(req);
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture, email_verified } = payload;

    const result = await googleService.findOrCreateUser({
      googleId,
      email,
      name,
      picture,
      emailVerified: email_verified
    });

    const frontendUrl = `${frontendBase}/auth/callback?token=${result.token}&user=${encodeURIComponent(JSON.stringify(result.user))}`;
    res.redirect(frontendUrl);
  } catch (err) {
    console.error("Google OAuth error:", err);
    res.redirect(`${frontendBase}/login?error=oauth_failed`);
  }
}

async function linkGoogleAccount(req, res) {
  const { idToken } = req.body;
  const userId = req.user.id;

  if (!idToken) {
    throw new ApiError(400, "ID token required", "MISSING_TOKEN");
  }

  const client = getOAuthClient(req);
  const ticket = await client.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID
  });

  const payload = ticket.getPayload();
  const { sub: googleId, email } = payload;

  const user = await googleService.linkGoogleAccount(userId, googleId, email);
  sendSuccess(res, { user });
}

module.exports = {
  redirectToGoogle,
  handleGoogleCallback,
  linkGoogleAccount
};