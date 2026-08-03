// One-off: sets a bcrypt-hashed password for a user identified by email.
// Usage: node scripts/set-initial-password.js <email> <plaintext-password>
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function main() {
  const [, , email, plainPassword] = process.argv;
  if (!email || !plainPassword) {
    console.error('Usage: node scripts/set-initial-password.js <email> <password>');
    process.exit(1);
  }
  const prisma = new PrismaClient();
  const hash = await bcrypt.hash(plainPassword, 10);
  const user = await prisma.user.update({
    where: { email },
    data: { password: hash },
  });
  console.log(`Password impostata per ${user.email}`);
  await prisma.$disconnect();
}

main();
