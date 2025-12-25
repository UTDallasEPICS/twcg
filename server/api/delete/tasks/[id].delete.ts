import { prisma } from '@@/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing ID',
    })
  }

  try {
    await prisma.$transaction([
      // Delete onboarding tasks linked to this task
      prisma.onboardingTask.deleteMany({
        where: { taskId: id },
      }),
      // Delete the task
      prisma.task.delete({
        where: { id },
      }),
    ])

    return { success: true }
  } catch (error: any) {
    if (error.code === 'P2025') {
      throw createError({
        statusCode: 404,
        statusMessage: 'Task not found',
      })
    }
    console.error('Failed to delete task:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
    })
  }
})
