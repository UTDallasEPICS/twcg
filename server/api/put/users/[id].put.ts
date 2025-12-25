import { z } from 'zod'
import { prisma } from '@@/server/utils/prisma'

const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().nullable().optional(),
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const result = updateUserSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation Error',
      data: result.error.errors,
    })
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        name: result.data.name,
        email: result.data.email,
        phone: result.data.phone,
      },
    })
    return user
  } catch (error: any) {
    if (error.code === 'P2025') {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found',
      })
    }
    // Handle unique constraint violation (e.g., email already exists)
    if (error.code === 'P2002') {
      throw createError({
        statusCode: 409,
        statusMessage: 'Email or Phone already in use',
      })
    }
    console.error('Failed to update user:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
    })
  }
})
