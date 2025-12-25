import { prisma } from '@@/server/utils/prisma'

export default defineEventHandler(async () => {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        department: true,
        supervisor: true,
      },
      orderBy: {
        department: {
          name: 'asc',
        },
      },
    })

    return tasks.map((task) => ({
      id: task.id,
      label: `[${task.department.name}] ${task.desc}`,
      value: task.id,
      deptId: task.deptId,
      currentSupervisor: task.supervisor?.name || null,
    }))
  } catch (error) {
    console.error('Failed to fetch all tasks:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
    })
  }
})