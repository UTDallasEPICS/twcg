import { prisma } from '@@/server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        dept: true,
      },
      orderBy: {
        desc: 'asc',
      },
    })
    return tasks
  } catch (error) {
    console.error('Failed to fetch tasks:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'Failed to retrieve tasks',
    })
  }
})
