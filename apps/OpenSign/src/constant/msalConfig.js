import { PublicClientApplication } from "@azure/msal-browser";

// Microsoft Entra ID (Azure AD) SSO config for RSP eSignature.
// Tenant/client IDs come from runtime env (window.RUNTIME_ENV, injected by
// entrypoint.sh into env.js) with a build-time fallback for local dev.
const env = (typeof window !== "undefined" && window.RUNTIME_ENV) || {};
const tenantId =
  env.REACT_APP_ENTRA_TENANT_ID || process.env.REACT_APP_ENTRA_TENANT_ID;
const clientId =
  env.REACT_APP_ENTRA_CLIENT_ID || process.env.REACT_APP_ENTRA_CLIENT_ID;

// SSO button only renders when both IDs are configured.
export const ssoEnabled = Boolean(tenantId && clientId);

export const msalInstance = ssoEnabled
  ? new PublicClientApplication({
      auth: {
        clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
        redirectUri:
          typeof window !== "undefined" ? window.location.origin : "/",
      },
      cache: { cacheLocation: "sessionStorage", storeAuthStateInCookie: false },
    })
  : null;

// Delegated scopes for basic profile + email. User.Read lets us call Microsoft
// Graph (/me/photo) after sign-in to sync the user's Entra profile photo.
export const loginRequest = {
  scopes: ["openid", "profile", "email", "User.Read"],
};

let initialized = false;
// MSAL v3+ requires initialize() before any login call.
export async function getMsalInstance() {
  if (!msalInstance) return null;
  if (!initialized) {
    await msalInstance.initialize();
    initialized = true;
  }
  return msalInstance;
}
