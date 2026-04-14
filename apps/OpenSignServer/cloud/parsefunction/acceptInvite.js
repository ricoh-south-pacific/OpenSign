import crypto from 'crypto';

export function generateInviteToken() {
  return crypto.randomBytes(32).toString('hex');
}

export default async function acceptInvite(request) {
  const { token, password } = request.params;

  if (!token || !password) {
    throw new Parse.Error(Parse.Error.INVALID_QUERY, 'Token and password are required.');
  }

  try {
    const tokenQuery = new Parse.Query('contracts_InviteTokens');
    tokenQuery.equalTo('token', token);
    tokenQuery.greaterThan('expiresAt', new Date());
    tokenQuery.equalTo('used', false);
    const inviteToken = await tokenQuery.first({ useMasterKey: true });

    if (!inviteToken) {
      throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'Invalid or expired invite link.');
    }

    const userId = inviteToken.get('userId');
    const userQuery = new Parse.Query(Parse.User);
    const user = await userQuery.get(userId, { useMasterKey: true });

    if (!user) {
      throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'User not found.');
    }

    user.set('password', password);
    await user.save(null, { useMasterKey: true });

    inviteToken.set('used', true);
    await inviteToken.save(null, { useMasterKey: true });

    return { status: 'success', message: 'Password set successfully.' };
  } catch (error) {
    console.error('Error in acceptInvite:', error);
    throw error;
  }
}
