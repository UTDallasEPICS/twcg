import { z } from 'zod'
import { prisma } from '@@/server/utils/prisma'

const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const result = createDepartmentSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation Error',
      data: result.error.errors,
    })
  }

  try {
    const department = await prisma.department.create({
      data: {
        name: result.data.name,
      },
    })
    return department
  } catch (error: any) {
    if (error.code === 'P2002') {
      throw createError({
        statusCode: 409,
        statusMessage: 'Department with this name already exists',
      })
    }
    console.error('Failed to create department:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
    })
  }
})
