import { prisma } from '@@/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const userId = getRouterParam(event, 'id')

  try {
    const categories = await prisma.onboardingTask.findMany({
      where: { userId },
      select: {
        task: {
          select: { category: true },
        },
      },
      distinct: ['userId'], // This isn't quite right for categories
    })
    
    // Better way:
    const tasks = await prisma.onboardingTask.findMany({
      where: { userId },
      include: { task: true }
    })
    
    const uniqueCategories = [...new Set(tasks.map(ot => ot.task.category))]
    
    // Logically sort them if possible
    const priorityOrder = [
      'Pre-hire',
      'First day',
      'First week',
      'First month',
      'General',
    ]

    return uniqueCategories.sort((a, b) => {
      const indexA = priorityOrder.indexOf(a)
      const indexB = priorityOrder.indexOf(b)
      if (indexA !== -1 && indexB !== -1) return indexA - indexB
      if (indexA !== -1) return -1
      if (indexB !== -1) return 1
      return a.localeCompare(b)
    })
  } catch (error) {
    console.error('Failed to fetch user task categories:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
    })
  }
})
