import { Prisma } from '@prisma/client';

const fullUserInclude = {
  profile: {
    include: {
      avatar: true,
    },
  },
  // savedQuestions: {
  //   include: {
  //     author: true,
  //     answers: false,
  //     keywords: true,
  //     files: true,
  //   },
  // },
  // savedPosts: {
  //   include: {
  //     author: true,
  //     comments: false,
  //     files: true,
  //     keywords: true,
  //   },
  // },
  // answers: {
  //   include: {
  //     question: true,
  //     files: true,
  //   },
  // },
  subscriptions: {
    include: {
      subscribedTo: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          registered: true,
          profile: true,
        },
      },
    },
  },
  subscribers: {
    include: {
      subscriber: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          registered: true,
          profile: true,
        },
      },
    },
  },
  // Comment: true,
  // Message: true,
  Post: {
    include: {
      files: true,
      keywords: true,
      comments: true,
    },
  },
  password: false,
} as const;

type FullUser = Prisma.UserGetPayload<{ include: typeof fullUserInclude; }>;

export { fullUserInclude, FullUser };