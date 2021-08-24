import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: [
    { emit: 'stdout', level: 'query' },
    { emit: 'stdout', level: 'info' },
    { emit: 'stdout', level: 'warn' },
    { emit: 'stdout', level: 'error' },
  ],
})

async function main() {
  const posts = await prisma.post.findMany({
    skip: 0,
    take: 10,
    include: {
      user: {
        include: {
          _count: {
            select: {
              posts: true,
            }
          }
        }
      }
    }
  });

  console.log(posts);
  
}

main()
  .catch((e) => {
    throw e
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
