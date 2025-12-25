import { prisma } from '@@/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const email = getRouterParam(event, 'email')

  if (!email) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email is required',
    })
  }

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  })

  return user
})
