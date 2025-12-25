import { prisma } from '@@/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const userId = getRouterParam(event, 'id')

  try {
    const onboardingTasks = await prisma.onboardingTask.findMany({
      where: { userId },
      include: {
        task: true,
      },
      orderBy: {
        task: {
          desc: 'asc',
        },
      },
    })

    return onboardingTasks
  } catch (error) {
    console.error('Failed to fetch user onboarding tasks:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
    })
  }
})
