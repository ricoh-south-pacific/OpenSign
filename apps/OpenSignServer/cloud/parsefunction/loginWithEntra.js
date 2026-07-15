import axios from 'axios';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { cloudServerUrl, serverAppId } from '../../Utils.js';

// Microsoft Entra ID (Azure AD) SSO login for RSP eSignature.
//
// Flow: the client signs in with MSAL and sends the Entra id_token here. We
// verify the token against Entra's JWKS (signature + issuer + audience + exp),
// match an EXISTING OpenSign user by email (no auto-provisioning), then mint a
// Parse session via the master-key /loginAs endpoint (same mechanism usersignup
// uses for existing users) and return the session token. The client then runs
// its normal session-token login (thirdpartyLoginfn / Parse.User.become).

const tenantId = process.env.ENTRA_TENANT_ID;
const clientId = process.env.ENTRA_CLIENT_ID;
// Optional: restrict SSO to a single email domain (e.g. ricohsouthpacific.com).
const allowedDomain = (process.env.SSO_ALLOWED_EMAIL_DOMAIN || '').toLowerCase().replace(/^@/, '');

const serverUrl = cloudServerUrl;
const APPID = serverAppId;
const masterKEY = process.env.MASTER_KEY;

// Entra v2.0 issuer + JWKS endpoint for this tenant.
const issuer = tenantId ? `https://login.microsoftonline.com/${tenantId}/v2.0` : null;
const JWKS = tenantId
  ? createRemoteJWKSet(
      new URL(`https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`)
    )
  : null;

export default async function loginWithEntra(request) {
  if (!tenantId || !clientId) {
    throw new Parse.Error(Parse.Error.INTERNAL_SERVER_ERROR, 'SSO is not configured.');
  }
  const idToken = request.params.id_token;
  if (!idToken) {
    throw new Parse.Error(Parse.Error.INVALID_QUERY, 'Missing id_token.');
  }

  // 1) Verify the Entra id_token (signature via JWKS, issuer, audience, expiry).
  let payload;
  try {
    ({ payload } = await jwtVerify(idToken, JWKS, {
      issuer,
      audience: clientId,
    }));
  } catch (err) {
    console.log('Entra id_token verification failed:', err?.message);
    throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'Invalid Microsoft sign-in.');
  }

  // 2) Extract and normalise the email.
  const email = (payload.email || payload.preferred_username || '')
    .toLowerCase()
    .replace(/\s/g, '');
  if (!email) {
    throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'Microsoft account has no email.');
  }
  if (allowedDomain && !email.endsWith('@' + allowedDomain)) {
    throw new Parse.Error(
      Parse.Error.OBJECT_NOT_FOUND,
      'This Microsoft account is not permitted to sign in.'
    );
  }

  // 3) Match an existing user only (no auto-provisioning).
  const userQuery = new Parse.Query(Parse.User);
  userQuery.equalTo('username', email);
  const user = await userQuery.first({ useMasterKey: true });
  if (!user) {
    throw new Parse.Error(
      Parse.Error.OBJECT_NOT_FOUND,
      'No RSP eSignature account found for this email. Please contact your administrator.'
    );
  }

  // 4) Mint a session for the user via the master-key /loginAs endpoint.
  const axiosRes = await axios({
    method: 'POST',
    url: `${serverUrl}/loginAs`,
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
      'X-Parse-Application-Id': APPID,
      'X-Parse-Master-Key': masterKEY,
    },
    params: { userId: user.id },
  });
  const login = axiosRes.data;
  return { id: login.objectId, sessionToken: login.sessionToken };
}
