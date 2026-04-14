import { generateInviteToken } from './acceptInvite.js';
import { appName, smtpenable } from '../../Utils.js';

async function sendInviteEmail(email, name, token) {
  const publicUrl = process.env.PUBLIC_URL || 'https://localhost:3001';
  const inviteLink = `${publicUrl}/accept-invite?token=${token}`;
  const mailsender = smtpenable ? process.env.SMTP_USER_EMAIL : process.env.MAILGUN_SENDER;
  const app = appName;

  await Parse.Cloud.sendEmail({
    sender: app + ' <' + mailsender + '>',
    recipient: email,
    subject: `You've been invited to ${app}`,
    text: `Hello ${name}, you have been invited to ${app}. Set your password here: ${inviteLink}`,
    html: `<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>Welcome to ${app}</title>
</head>
<body style="margin:0; padding:0; font-family:Arial, sans-serif; background-color:#f4f4f4; color:#333;">
    <div style="max-width:600px; margin:50px auto; padding:30px; background-color:#ffffff; border:1px solid #e0e0e0; border-radius:8px;">
        <h2 style="color:#1a5fa0;">Welcome to ${app}</h2>
        <p style="font-size:16px; line-height:1.5;">
            Hello <b>${name}</b>,
        </p>
        <p style="font-size:16px; line-height:1.5;">
            You have been invited to join <b>${app}</b>. To get started, please set your password by clicking the button below.
        </p>
        <p style="text-align:center; margin:30px 0;">
            <a href="${inviteLink}"
                style="background-color:#1a5fa0; color:#ffffff; padding:12px 24px; border-radius:5px; text-decoration:none; font-size:16px;">
                Set Your Password
            </a>
        </p>
        <p style="font-size:16px; line-height:1.5;">
            If the button above doesn't work, please copy and open the following link in your browser:
        </p>
        <p style="font-size:14px; text-align:center; margin:0px 0px 30px 0px;">
            <a href="${inviteLink}">${inviteLink}</a>
        </p>
        <p style="font-size:14px; color:#777;">
            This link will expire in 48 hours. If you did not expect this invitation, you can safely ignore this email.
        </p>
        <hr style="margin:30px 0; border:none; border-top:1px solid #eee;">
        <p style="font-size:12px; color:#999;">
            &copy; ${new Date().getFullYear()} ${app}. All rights reserved.
        </p>
    </div>
</body>
</html>`,
  });
}

async function createInviteToken(userId) {
  const token = generateInviteToken();
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

  const InviteToken = new Parse.Object('contracts_InviteTokens');
  InviteToken.set('token', token);
  InviteToken.set('userId', userId);
  InviteToken.set('expiresAt', expiresAt);
  InviteToken.set('used', false);

  const acl = new Parse.ACL();
  acl.setPublicReadAccess(false);
  acl.setPublicWriteAccess(false);
  InviteToken.setACL(acl);

  await InviteToken.save(null, { useMasterKey: true });
  return token;
}

export default async function addUser(request) {
  const { phone, name, password, organization, team, tenantId, timezone, role } = request.params;
  const email = request.params?.email?.toLowerCase()?.replace(/\s/g, '');
  if (!request.user) {
    throw new Parse.Error(Parse.Error.INVALID_SESSION_TOKEN, 'Invalid session token.');
  }
  const currentUser = { __type: 'Pointer', className: '_User', objectId: request.user.id };
  if (name && email && password && organization && team && role && tenantId) {
    try {
      const extUser = new Parse.Object('contracts_Users');
      extUser.set('Name', name);
      if (phone) {
        extUser.set('Phone', phone);
      }
      extUser.set('Email', email);
      extUser.set('UserRole', `contracts_${role}`);
      if (team) {
        extUser.set('TeamIds', [
          {
            __type: 'Pointer',
            className: 'contracts_Teams',
            objectId: team,
          },
        ]);
      }
      if (organization.objectId) {
        extUser.set('OrganizationId', {
          __type: 'Pointer',
          className: 'contracts_Organizations',
          objectId: organization.objectId,
        });
      }
      if (organization.company) {
        extUser.set('Company', organization.company);
      }

      if (tenantId) {
        extUser.set('TenantId', {
          __type: 'Pointer',
          className: 'partners_Tenant',
          objectId: tenantId,
        });
      }
      if (timezone) {
        extUser.set('Timezone', timezone);
      }
      try {
        const _users = Parse.Object.extend('User');
        const _user = new _users();
        _user.set('name', name);
        _user.set('username', email);
        _user.set('email', email);
        _user.set('password', password);
        if (phone) {
          _user.set('phone', phone);
        }

        const user = await _user.save();
        if (user) {
          extUser.set('CreatedBy', currentUser);

          extUser.set('UserId', user);
          const acl = new Parse.ACL();
          acl.setPublicReadAccess(true);
          acl.setPublicWriteAccess(true);
          acl.setReadAccess(request.user.id, true);
          acl.setWriteAccess(request.user.id, true);
          extUser.setACL(acl);
          const extUserRes = await extUser.save();

          // Send invite email
          try {
            const token = await createInviteToken(user.id);
            await sendInviteEmail(email, name, token);
          } catch (mailErr) {
            console.log('Failed to send invite email:', mailErr);
          }

          const parseData = JSON.parse(JSON.stringify(extUserRes));
          return parseData;
        }
      } catch (err) {
        console.log('err ', err);
        if (err.code === 202) {
          const userQuery = new Parse.Query(Parse.User);
          userQuery.equalTo('email', email);
          const userRes = await userQuery.first({ useMasterKey: true });
          userRes.setPassword(password);
          await userRes.save(null, { useMasterKey: true });
          extUser.set('CreatedBy', currentUser);
          extUser.set('UserId', { __type: 'Pointer', className: '_User', objectId: userRes.id });
          const acl = new Parse.ACL();
          acl.setPublicReadAccess(true);
          acl.setPublicWriteAccess(true);
          acl.setReadAccess(request.user.id, true);
          acl.setWriteAccess(request.user.id, true);

          extUser.setACL(acl);
          const res = await extUser.save();

          // Send invite email for existing user re-added
          try {
            const token = await createInviteToken(userRes.id);
            await sendInviteEmail(email, name, token);
          } catch (mailErr) {
            console.log('Failed to send invite email:', mailErr);
          }

          const parseData = JSON.parse(JSON.stringify(res));
          return parseData;
        } else {
          throw new Parse.Error(400, err?.message || 'something went wrong');
        }
      }
    } catch (err) {
      console.log('err', err);
      throw new Parse.Error(400, err?.message || 'something went wrong');
    }
  } else {
    throw new Parse.Error(400, 'Please provide all required fields.');
  }
}
