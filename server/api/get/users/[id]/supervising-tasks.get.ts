import { prisma } from '@@/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        supervisedTasks: {
          include: {
            department: true,
            onboardingTasks: {
              include: {
                user: true, // Fetch the employee details
              },
            },
          },
        },
      },
    })

    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found',
      })
    }

    return user.supervisedTasks
  } catch (error) {
    console.error('Failed to fetch supervising tasks:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
    })
  }
})