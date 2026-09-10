const { OAuth2Client } = require("google-auth-library");
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, FRONTEND_URL, BACKEND_URL } = require("../../config/env");
const googleService = require("./google.service");
const { sendSuccess } = require("../../utils/apiResponse");
const ApiError = require("../../utils/apiError");

const oauth2Client = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  `${BACKEND_URL}/api/auth/google/callback`
);

async function redirectToGoogle(req, res) {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new ApiError(500, "Google OAuth not configured", "OAUTH_NOT_CONFIGURED");
  }

  const scopes = [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile"
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent",
    state: req.query.state || ""
  });

  res.redirect(url);
}

async function handleGoogleCallback(req, res) {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new ApiError(500, "Google OAuth not configured", "OAUTH_NOT_CONFIGURED");
  }

  const { code, error, state } = req.query;

  if (error) {
    return res.redirect(`${FRONTEND_URL}/login?error=google_oauth_${error}`);
  }

  if (!code) {
    return res.redirect(`${FRONTEND_URL}/login?error=missing_code`);
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const ticket = await oauth2Client.verifyIdToken({
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

    const frontendUrl = `${FRONTEND_URL}/auth/callback?token=${result.token}&user=${encodeURIComponent(JSON.stringify(result.user))}`;
    res.redirect(frontendUrl);
  } catch (err) {
    console.error("Google OAuth error:", err);
    res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
  }
}

async function linkGoogleAccount(req, res) {
  const { idToken } = req.body;
  const userId = req.user.id;

  if (!idToken) {
    throw new ApiError(400, "ID token required", "MISSING_TOKEN");
  }

  const ticket = await oauth2Client.verifyIdToken({
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