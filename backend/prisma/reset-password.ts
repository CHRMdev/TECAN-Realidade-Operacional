/**
 * Reset de senha de emergência
 * Uso: DATABASE_URL="postgres://..." npx tsx prisma/reset-password.ts <username> <nova-senha>
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const [, , username, newPassword] = process.argv;

  if (!username || !newPassword) {
    console.error('Uso: npx tsx prisma/reset-password.ts <username> <nova-senha>');
    process.exit(1);
  }

  if (newPassword.length < 6) {
    console.error('Senha deve ter no mínimo 6 caracteres.');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { username } });

  if (!user) {
    console.error(`Usuário "${username}" não encontrado.`);
    process.exit(1);
  }

  const hash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { username }, data: { passwordHash: hash } });

  console.log(`✅ Senha de "${username}" (role: ${user.role}) resetada com sucesso.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
