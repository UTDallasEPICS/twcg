import { z } from 'zod'
import { prisma } from '@@/server/utils/prisma'

const updateTaskSchema = z.object({
  desc: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const result = updateTaskSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation Error',
      data: result.error.errors,
    })
  }

  try {
    const task = await prisma.task.update({
      where: { id },
      data: {
        desc: result.data.desc,
        category: result.data.category,
      },
    })
    return task
  } catch (error: any) {
    if (error.code === 'P2025') {
      throw createError({
        statusCode: 404,
        statusMessage: 'Task not found',
      })
    }
    console.error('Failed to update task:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
    })
  }
})
