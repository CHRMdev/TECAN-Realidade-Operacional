/**
 * Cria (ou atualiza) um usuario com role 'admin'.
 *
 * Uso:
 *   DATABASE_URL="postgres://..." npx tsx prisma/create-admin.ts <username> <senha> <firstName> <lastName>
 *
 * Exemplo:
 *   npx tsx prisma/create-admin.ts caio.admin minhasenha Caio Milton
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const [, , username, password, firstName, ...lastNameParts] = process.argv;
  const lastName = lastNameParts.join(' ');

  if (!username || !password || !firstName || !lastName) {
    console.error('Uso: npx tsx prisma/create-admin.ts <username> <senha> <firstName> <lastName>');
    process.exit(1);
  }

  if (password.length < 6) {
    console.error('Senha deve ter no minimo 6 caracteres.');
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { username },
    update: { passwordHash: hash, firstName, lastName, role: 'admin' },
    create: { username, passwordHash: hash, firstName, lastName, role: 'admin' },
  });

  console.log(`OK admin criado/atualizado: ${user.username} (${user.firstName} ${user.lastName}) - id ${user.id}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
