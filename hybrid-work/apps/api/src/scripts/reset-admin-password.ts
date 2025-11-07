import { PrismaClient, Role } from '@prisma/client';
import { hashPassword } from '../common/security/password.utils';

const prisma = new PrismaClient();

async function main() {
  const nextPassword = process.argv[2];
  if (!nextPassword) {
    console.error('Usage: pnpm --filter @hybrid-work/api reset-admin-password <newPassword>');
    process.exit(1);
  }

  const admin = await prisma.user.findFirst({
    where: { username: 'admin' },
  });

  if (!admin) {
    await prisma.user.create({
      data: {
        id: 'admin-root',
        orgId: 'acme',
        name: 'Workspace Admin',
        email: 'admin@acme.com',
        username: 'admin',
        role: Role.ADMIN,
        passwordHash: hashPassword(nextPassword),
      },
    });
    console.log('Admin account was missing and has been created.');
  } else {
    await prisma.user.update({
      where: { id: admin.id },
      data: { passwordHash: hashPassword(nextPassword) },
    });
    console.log('Admin password updated successfully.');
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
