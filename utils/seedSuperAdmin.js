// /backend/utils/seedSuperAdmin.js
// Idempotent superadmin seeder. Promotes existing user to superadmin if the
// email already exists, otherwise creates a fresh account.
const { User, UserRole } = require('../models/User');

async function seedSuperAdmin() {
  const email = (process.env.SUPERADMIN_EMAIL || '').toLowerCase().trim();
  const password = process.env.SUPERADMIN_PASSWORD;
  const firstName = process.env.SUPERADMIN_FIRSTNAME || 'Super';
  const lastName = process.env.SUPERADMIN_LASTNAME || 'Admin';

  if (!email || !password) {
    console.log('⚠️  SUPERADMIN_EMAIL/PASSWORD not set, skipping seed');
    return;
  }

  try {
    let user = await User.findOne({ email });
    if (user) {
      let changed = false;
      if (user.role !== UserRole.SUPERADMIN) {
        user.role = UserRole.SUPERADMIN;
        changed = true;
      }
      if (!user.emailVerified) {
        user.emailVerified = true;
        changed = true;
      }
      if (changed) {
        await user.save();
        console.log(`✅ Promoted existing user to SUPERADMIN: ${email}`);
      } else {
        console.log(`ℹ️  SuperAdmin already present: ${email}`);
      }
      return;
    }

    user = new User({
      firstName,
      lastName,
      email,
      password, // hashed by pre-save hook
      role: UserRole.SUPERADMIN,
      emailVerified: true,
    });
    await user.save();
    console.log(`✅ Created SUPERADMIN: ${email}`);
  } catch (err) {
    console.error('❌ Error seeding superadmin:', err.message);
  }
}

module.exports = seedSuperAdmin;
