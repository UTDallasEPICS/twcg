import { prisma } from '@@/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  try {
    const department = await prisma.department.findUnique({
      where: { id },
    })

    if (!department) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Department not found',
      })
    }

    return department
  } catch (error) {
    console.error('Failed to fetch department:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
    })
  }
})
