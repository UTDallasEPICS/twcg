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
    // Find tasks to cleanup their relations
    const tasks = await prisma.task.findMany({
      where: { deptId: id },
      select: { id: true },
    })
    const taskIds = tasks.map((t) => t.id)

    await prisma.$transaction([
      // Unassign users from this department
      prisma.user.updateMany({
        where: { deptId: id },
        data: { deptId: null },
      }),
      // Delete onboarding tasks linked to the department's tasks
      prisma.onboardingTask.deleteMany({
        where: { taskId: { in: taskIds } },
      }),
      // Delete the tasks
      prisma.task.deleteMany({
        where: { deptId: id },
      }),
      // Delete the department
      prisma.department.delete({
        where: { id },
      }),
    ])

    return { success: true }
  } catch (error: any) {
    if (error.code === 'P2025') {
      throw createError({
        statusCode: 404,
        statusMessage: 'Department not found',
      })
    }
    console.error('Failed to delete department:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
    })
  }
})
