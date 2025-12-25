import { z } from 'zod'
import { prisma } from '@@/server/utils/prisma'

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().nullable().optional(),
  role: z.enum(['ADMIN', 'SUPERVISOR', 'ONBOARDING']),
  deptId: z.string().nullable().optional(),
  supervisingTaskIds: z.array(z.string()).optional(),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const result = createUserSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation Error',
      data: result.error.errors,
    })
  }

  const { name, email, phone, role, deptId, supervisingTaskIds } = result.data

  try {
    // --- ONBOARDING User Creation ---
    if (role === 'ONBOARDING' && deptId) {
      // Fetch tasks for the department
      const deptTasks = await prisma.task.findMany({
        where: { deptId },
      })

      // Transaction: Create User + Create Onboarding Tasks
      const newUser = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name,
            email,
            phone: phone || null,
            role,
            deptId,
          },
        })

        if (deptTasks.length > 0) {
          await tx.onboardingTask.createMany({
            data: deptTasks.map((t) => ({
              userId: user.id,
              taskId: t.id,
              completed: false,
            })),
          })
        }
        return user
      })
      return newUser
    }

    // --- SUPERVISOR User Creation ---
    if (role === 'SUPERVISOR') {
      const user = await prisma.user.create({
        data: {
          name,
          email,
          phone: phone || null,
          role,
          supervisedTasks: supervisingTaskIds
            ? {
                connect: supervisingTaskIds.map((id) => ({ id })),
              }
            : undefined,
        },
      })
      return user
    }

    // --- ADMIN or Simple User Creation ---
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        role,
        deptId: deptId || null, // deptId might be passed but usually ignored/null for admin
      },
    })
    return user
  } catch (error: any) {
    if (error.code === 'P2002') {
      throw createError({
        statusCode: 409,
        statusMessage: 'Email or Phone already in use',
      })
    }
    console.error('Failed to create user:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
    })
  }
})
