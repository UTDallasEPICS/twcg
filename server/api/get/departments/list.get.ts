import { prisma } from '@@/server/utils/prisma'

export default defineEventHandler(async () => {
  return await prisma.department.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })
})
