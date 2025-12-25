import { prisma } from '@@/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const query = getQuery(event)
  const page = Number(query.page) || 1
  const limit = Number(query.limit) || 10
  const search = (query.search as string) || ''
  const category = (query.category as string) || ''
  const skip = (page - 1) * limit

  const where: any = { deptId: id }
  if (search) {
    where.desc = {
      contains: search,
    }
  }
  if (category) {
    where.category = category
  }

  try {
    const [tasks, total] = await prisma.$transaction([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { desc: 'asc' },
        include: {
          supervisor: true,
        },
      }),
      prisma.task.count({
        where,
      }),
    ])

    return {
      data: tasks,
      total,
    }
  } catch (error) {
    console.error('Failed to fetch department tasks:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
    })
  }
})
