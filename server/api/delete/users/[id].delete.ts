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
      // Delete onboarding tasks assigned to this user
      prisma.onboardingTask.deleteMany({
        where: { userId: id },
      }),
      // Unassign this user from any tasks they supervise
      prisma.task.updateMany({
        where: { supervisorId: id },
        data: { supervisorId: null },
      }),
      // Delete the user (Sessions cascade delete defined in schema)
      prisma.user.delete({
        where: { id },
      }),
    ])

    return { success: true }
  } catch (error: any) {
    if (error.code === 'P2025') {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found',
      })
    }
    console.error('Failed to delete user:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
    })
  }
})
