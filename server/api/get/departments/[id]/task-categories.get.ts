import { prisma } from '@@/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  try {
    const categories = await prisma.task.findMany({
      where: { deptId: id },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    })

    return categories.map((c) => c.category)
  } catch (error) {
    console.error('Failed to fetch task categories:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
    })
  }
})
