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
  const user = await prisma.user.create({ data: {
     username: "foo",
     posts: {
        create: [
          { title: 'How to make an omelette' },
          { title: 'How to eat an omelette' },
        ],
      }, 
  }})

  console.log(user);
  
}

main()
  .catch((e) => {
    throw e
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
