import { parseFile } from '@fast-csv/parse';
import { Language, Post, Prisma, PrismaClient, TagType, UserType } from '@prisma/client';
import { tagIds, userIds } from './constants';

const prisma = new PrismaClient({
  log: [
    { emit: 'stdout', level: 'query' },
    { emit: 'stdout', level: 'info' },
    { emit: 'stdout', level: 'warn' },
    { emit: 'stdout', level: 'error' },
  ],
});

async function main() {
  const posts = await prisma.$transaction(
    prisma => {
      const promises: ReturnType<typeof prisma.post.upsert>[] = [];

      return new Promise<Post[]>((resolve, reject) => {
        const stream = parseFile(`${__dirname}/data/posts.csv`, {
          headers: true,
          ignoreEmpty: true,
        });

        let post: Prisma.PostCreateInput;
        let postContents: Prisma.PostContentCreateOrConnectWithoutPostInput[] =
          [];
        let tags: Prisma.PostTagCreateOrConnectWithoutPostInput[] = [];

        const savePost = () => {
          const postUpsertArgs: Prisma.PostUpsertArgs = {
            where: {
              id: post.id,
            },
            update: {},
            create: {
              ...post,
              contents: {
                connectOrCreate: postContents,
              },
            },
          };

          if (tags.length) {
            postUpsertArgs.create.tags = {
              connectOrCreate: tags,
            };
          }

          promises.push(prisma.post.upsert(postUpsertArgs));
        };

        const tagPush = (name: string, type: TagType) => {
          if (typeof post.id !== 'undefined') {
            tags.push({
              where: {
                postId_tagId: {
                  postId: post.id,
                  tagId: '',
                },
              },
              create: {
                tag: {
                  connectOrCreate: {
                    where: {
                      name_type_userId: {
                        name: name,
                        type: type,
                        userId: userIds.publisher1,
                      },
                    },
                    create: {
                      userId: userIds.publisher1,
                      name: name,
                      type: type,
                    },
                  },
                },
              },
            });
          }
        };

        stream.on(
          'data',
          (row: {
            postId: string;
            type: string;
            category: string;
            title: string;
            postContentId: string;
            lang: string;
            content: string;
            writtenBy: string;
            editedBy: string;
          }) => {
            // rowNumber++;

            if (typeof post === 'undefined' || post.id !== row.postId) {
              if (typeof post !== 'undefined') {
                savePost();
              }

              post = {
                user: {
                  connect: {
                    id: userIds.publisher1,
                  },
                },
                id: row.postId,
                title: row.title,
              };
              postContents = [];
              tags = [];

              // Add tags to queue
              if (row.type !== '') {
                tagPush(row.type, TagType.POSTTYPE);
              }
              if (row.category !== '') {
                tagPush(row.category, TagType.CATEGORY);
              }
            }

            // Add Roof section to queue
            postContents.push({
              where: {
                id: row.postContentId,
              },
              create: {
                language: Language[row.lang as keyof typeof Language],
                content: row.content,

                author: {
                  connectOrCreate: {
                    where: {
                      username_type: {
                        username: row.writtenBy,
                        type: UserType.AUTHOR,
                      },
                    },
                    create: {
                      username: row.writtenBy,
                      type: UserType.AUTHOR,
                    },
                  },
                },
                editor: {
                  connectOrCreate: {
                    where: {
                      username_type: {
                        username: row.editedBy,
                        type: UserType.EDITOR,
                      },
                    },
                    create: {
                      username: row.editedBy,
                      type: UserType.EDITOR,
                    },
                  },
                },
              },
            });
          },
        );

        stream.on('error', error => {
          reject(error);
        });

        stream.on('end', (rowCount: number) => {
          if (post !== null) {
            savePost();
          }
          Promise.all(promises)
            .then(value => {
              resolve(value);
            })
            .catch(error => {
              reject(error);
            });
        });
      });
    },
    {
      timeout: 100000,
    },
  );
}

main()
  .catch(e => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
