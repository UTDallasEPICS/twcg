import { z } from 'zod'
import { prisma } from '@@/server/utils/prisma'

const createTaskSchema = z.object({
  desc: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  deptId: z.string().min(1, 'Department ID is required'),
  supervisorId: z.string().nullable().optional(),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const result = createTaskSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation Error',
      data: result.error.errors,
    })
  }

  try {
    const task = await prisma.task.create({
      data: {
        desc: result.data.desc,
        category: result.data.category,
        deptId: result.data.deptId,
        supervisorId: result.data.supervisorId,
      },
    })
    return task
  } catch (error: any) {
    console.error('Failed to create task:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
    })
  }
})
