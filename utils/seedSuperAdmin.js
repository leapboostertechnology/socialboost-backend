// /backend/utils/seedSuperAdmin.js
// Robust, idempotent SuperAdmin seeder with password-recovery semantics.
//
// Behaviour:
// 1. If SUPERADMIN_EMAIL & SUPERADMIN_PASSWORD env vars are set:
//    a) Hash password directly with bcrypt (bypasses any model pre-save quirks)
//    b) Upsert via updateOne($set) — pre-save hook does NOT run, so existing
//       users' passwords are never accidentally re-hashed.
//    c) The seeded SuperAdmin's password is ALWAYS reset to the value of
//       SUPERADMIN_PASSWORD on every boot. This gives the operator a reliable
//       recovery path: change the env var, redeploy, log in with new password.
// 2. If env vars are missing, prints a clear warning and skips (does NOT
//    break unrelated users).
//
// SECURITY NOTE: Only the user matching SUPERADMIN_EMAIL is affected — no
// other accounts are ever modified.
const bcrypt = require('bcryptjs');
const { User, UserRole } = require('../models/User');

async function seedSuperAdmin() {
  const email = (process.env.SUPERADMIN_EMAIL || '').toLowerCase().trim();
  const password = process.env.SUPERADMIN_PASSWORD;
  const firstName = process.env.SUPERADMIN_FIRSTNAME || 'Super';
  const lastName = process.env.SUPERADMIN_LASTNAME || 'Admin';

  if (!email || !password) {
    console.warn(
      '⚠️  [seedSuperAdmin] SUPERADMIN_EMAIL or SUPERADMIN_PASSWORD not set — skipping seed.'
    );
    return;
  }

  try {
    // Hash the desired password explicitly so we can write it directly to the DB
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // updateOne with $set + upsert => DOES NOT run mongoose pre-save hooks.
    // This is safe because we hashed the password ourselves above.
    const result = await User.updateOne(
      { email },
      {
        $set: {
          email,
          password: hashedPassword,
          role: UserRole.SUPERADMIN,
          emailVerified: true,
        },
        $setOnInsert: {
          firstName,
          lastName,
        },
      },
      { upsert: true, runValidators: false }
    );

    if (result.upsertedCount > 0) {
      console.log(`✅ [seedSuperAdmin] Created SUPERADMIN account: ${email}`);
    } else if (result.modifiedCount > 0) {
      console.log(`✅ [seedSuperAdmin] Updated existing SUPERADMIN: ${email} (password reset from env, role/email-verified ensured)`);
    } else {
      console.log(`ℹ️  [seedSuperAdmin] SUPERADMIN already up-to-date: ${email}`);
    }
  } catch (err) {
    console.error('❌ [seedSuperAdmin] Failed:', err.message);
    // Never throw — we don't want a seed failure to crash the server.
  }
}

module.exports = seedSuperAdmin;
