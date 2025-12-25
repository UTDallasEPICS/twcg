import { z } from 'zod'
import { prisma } from '@@/server/utils/prisma'

const updateSchema = z.object({
  completed: z.boolean(),
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const result = updateSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation Error',
    })
  }

  try {
    const updated = await prisma.onboardingTask.update({
      where: { id },
      data: {
        completed: result.data.completed,
      },
    })
    return updated
  } catch (error) {
    console.error('Failed to update onboarding task:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
    })
  }
})
