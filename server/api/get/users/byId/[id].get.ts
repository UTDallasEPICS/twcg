import { prisma } from '@@/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        department: true,
      },
    })

    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found',
      })
    }

    return user
  } catch (error) {
    console.error('Failed to fetch user by ID:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
    })
  }
})
