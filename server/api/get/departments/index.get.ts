import { prisma } from '@@/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Number(query.page) || 1
  const limit = Number(query.limit) || 10
  const search = (query.search as string) || ''
  const skip = (page - 1) * limit

  const where = search
    ? {
        name: {
          contains: search,
        },
      }
    : {}

  try {
    const [departments, total] = await prisma.$transaction([
      prisma.department.findMany({
        where,
        skip,
        take: limit,
        include: {
          tasks: true,
          users: true,
        },
      }),
      prisma.department.count({ where }),
    ])

    return {
      data: departments,
      total,
    }
  } catch (error) {
    console.error('Failed to fetch departments: ', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Interal Server Error',
      message: 'Failed to retrieve departments',
    })
  }
})
