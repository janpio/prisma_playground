import { PrismaClient, } from '@prisma/client';

const prisma = new PrismaClient();

const main = async () => {
  const test = await prisma.user.upsert({
    where: {
      id: '62edd1de-868b-4698-b802-b7eb030ace4e',
    },
    update: {},
    create: {
      id: '62edd1de-868b-4698-b802-b7eb030ace4e',
      username: 'test',
      posts: {
        connectOrCreate: [
          {
            where: {
              id: '310d6bd1-1d57-4e4d-81f0-30ee20d76e9e'
            },
            create: {
              id: '310d6bd1-1d57-4e4d-81f0-30ee20d76e9e',
              title: 'post 1',
            },
          },  {
            where: {
              id: '3c4ee0ef-d73d-4ced-b24a-8433c47e8f9a'
            },
            create: {
              id: '3c4ee0ef-d73d-4ced-b24a-8433c47e8f9a',
              title: 'post 2',
            },
          }
        ]
      }
    }
  });
};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
