const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

(async () => {
  try {
    const users = await db.usuario.findMany();
    console.log('Usuários encontrados:', users.length);
    users.forEach(u => {
      console.log(`- ID: ${u.id}, Nome: ${u.nome}, Email: ${u.email}`);
    });
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await db.$disconnect();
  }
})();
