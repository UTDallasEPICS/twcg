import { z } from 'zod'
import { prisma } from '@@/server/utils/prisma'

const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().nullable().optional(),
  deptId: z.string().nullable().optional(), // For Onboarding
  supervisingTaskIds: z.array(z.string()).optional(), // For Supervisors
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

  const phone = result.data.phone || null

  try {
    // Fetch current user state to check for role and changes
    const currentUser = await prisma.user.findUnique({
      where: { id },
      include: { onboardingTasks: true },
    })

    if (!currentUser) {
      throw createError({ statusCode: 404, statusMessage: 'User not found' })
    }

    // --- Onboarding User Logic: Department Change ---
    if (
      currentUser.role === 'ONBOARDING' &&
      result.data.deptId &&
      result.data.deptId !== currentUser.deptId
    ) {
      // Fetch tasks for the NEW department
      const newDeptTasks = await prisma.task.findMany({
        where: { deptId: result.data.deptId },
      })

      // Transaction: Delete old onboarding tasks, Update User, Create new onboarding tasks
      const updatedUser = await prisma.$transaction([
        prisma.onboardingTask.deleteMany({
          where: { userId: id },
        }),
        prisma.user.update({
          where: { id },
          data: {
            name: result.data.name,
            email: result.data.email,
            phone: phone,
            deptId: result.data.deptId,
          },
        }),
        prisma.onboardingTask.createMany({
          data: newDeptTasks.map((t) => ({
            userId: id,
            taskId: t.id,
            completed: false,
          })),
        }),
      ])
      return updatedUser[1] // Return the user object
    }

    // --- Supervisor Logic: Task Assignment Change ---
    if (currentUser.role === 'SUPERVISOR' && result.data.supervisingTaskIds) {
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          name: result.data.name,
          email: result.data.email,
          phone: phone,
          supervisingTasks: {
            set: result.data.supervisingTaskIds.map((tid) => ({ id: tid })),
          },
        },
      })
      return updatedUser
    }

    // --- Standard Update (No special side effects) ---
    const user = await prisma.user.update({
      where: { id },
      data: {
        name: result.data.name,
        email: result.data.email,
        phone: phone,
        // Only update deptId if provided (and not handled above)
        ...(result.data.deptId !== undefined && { deptId: result.data.deptId }),
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