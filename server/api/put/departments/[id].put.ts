import { z } from 'zod'
import { prisma } from '@@/server/utils/prisma'

const updateDepartmentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const result = updateDepartmentSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation Error',
      data: result.error.errors,
    })
  }

  try {
    const department = await prisma.department.update({
      where: { id },
      data: {
        name: result.data.name,
      },
    })
    return department
  } catch (error: any) {
    if (error.code === 'P2025') {
      throw createError({
        statusCode: 404,
        statusMessage: 'Department not found',
      })
    }
    console.error('Failed to update department:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
    })
  }
})
