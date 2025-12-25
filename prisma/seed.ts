import { prisma } from '../server/utils/prisma'

async function main() {
  console.log('Starting seed...')

  // --- Departments Data ---
  const departmentsData = [
    {
      name: 'Engineering',
      tasks: [
        { desc: 'Setup Development Environment', category: 'First day' },
        { desc: 'Review Code Style Guidelines', category: 'First week' },
        { desc: 'Gain Access to GitHub Repository', category: 'First day' },
        { desc: 'Complete Security Compliance Training', category: 'Pre-hire' },
        { desc: 'Read System Architecture Docs', category: 'First week' },
      ],
    },
    {
      name: 'HR',
      tasks: [
        { desc: 'Review Employee Handbook', category: 'Pre-hire' },
        { desc: 'Complete Benefits Enrollment', category: 'First day' },
        { desc: 'Submit Payroll Information', category: 'Pre-hire' },
        { desc: 'Harassment Prevention Training', category: 'First week' },
        { desc: 'Meet with Department Head', category: 'First day' },
      ],
    },
    {
      name: 'Marketing',
      tasks: [
        { desc: 'Review Brand Guidelines', category: 'First day' },
        { desc: 'Access Social Media Accounts', category: 'First day' },
        { desc: 'Analyze Competitor Landscape', category: 'First week' },
        { desc: 'Setup Analytics Tools', category: 'First day' },
        { desc: 'Read Content Strategy', category: 'First week' },
      ],
    },
    {
      name: 'Sales',
      tasks: [
        { desc: 'CRM Software Training', category: 'First day' },
        { desc: 'Review Sales Scripts', category: 'First week' },
        { desc: 'Shadow a Senior Sales Rep', category: 'First week' },
        { desc: 'Product Demo Walkthrough', category: 'First day' },
        { desc: 'Review Pricing Model', category: 'First week' },
      ],
    },
    {
      name: 'IT',
      tasks: [
        { desc: 'Setup Company Email', category: 'Pre-hire' },
        { desc: 'Configure VPN Access', category: 'First day' },
        { desc: 'Hardware Provisioning', category: 'Pre-hire' },
        { desc: 'Security Policy Acknowledgement', category: 'First day' },
        { desc: 'Password Manager Setup', category: 'First day' },
      ],
    },
  ]

  const createdDepartments = []

  // --- Seed Departments ---
  const allTasks = []
  for (const dept of departmentsData) {
    const department = await prisma.department.upsert({
      where: { name: dept.name },
      update: {},
      create: {
        name: dept.name,
        tasks: {
          create: dept.tasks.map((task) => ({
            desc: task.desc,
            category: task.category,
          })),
        },
      },
      include: {
        tasks: true,
      },
    })
    allTasks.push(...department.tasks)
    createdDepartments.push(department)
    console.log(`Seeded department: ${dept.name}`)
  }

  // --- Seed Users ---

  // 1. Admins
  const admins = [
    { name: 'Tushar Wani', email: 'reachtusharwani@gmail.com' },
    { name: 'Admin User Two', email: 'admin2@example.com' },
  ]

  for (const admin of admins) {
    await prisma.user.upsert({
      where: { email: admin.email },
      update: { role: 'ADMIN' },
      create: {
        name: admin.name,
        email: admin.email,
        role: 'ADMIN',
        emailVerified: true,
      },
    })
    console.log(`Seeded Admin: ${admin.email}`)
  }

  // 2. Supervisors
  const supervisors = [
    { name: 'Supervisor One', email: 'supervisor1@example.com' },
    { name: 'Supervisor Two', email: 'supervisor2@example.com' },
    { name: 'Supervisor Three', email: 'supervisor3@example.com' },
  ]

  for (const supervisor of supervisors) {
    let tasksToSupervise = []

    if (supervisor.email === 'supervisor1@example.com') {
      // Supervisor 1: Engineering and HR
      const engineeringTasks = allTasks.filter(
        (t) =>
          createdDepartments.find((d) => d.id === t.deptId)?.name ===
          'Engineering'
      )
      const hrTasks = allTasks.filter(
        (t) =>
          createdDepartments.find((d) => d.id === t.deptId)?.name === 'HR'
      )
      // Take 2 from each
      tasksToSupervise = [
        ...engineeringTasks.slice(0, 2),
        ...hrTasks.slice(0, 2),
      ]
    } else if (supervisor.email === 'supervisor2@example.com') {
      // Supervisor 2: Sales and Marketing
       const salesTasks = allTasks.filter(
        (t) =>
          createdDepartments.find((d) => d.id === t.deptId)?.name ===
          'Sales'
      )
      const marketingTasks = allTasks.filter(
        (t) =>
          createdDepartments.find((d) => d.id === t.deptId)?.name === 'Marketing'
      )
      tasksToSupervise = [
        ...salesTasks.slice(0, 2),
        ...marketingTasks.slice(0, 2),
      ]
    } else {
      // Random for others
      tasksToSupervise = [...allTasks]
        .sort(() => 0.5 - Math.random())
        .slice(0, 5)
    }

    await prisma.user.upsert({
      where: { email: supervisor.email },
      update: {
        role: 'SUPERVISOR',
        supervisingTasks: {
          set: tasksToSupervise.map((t) => ({ id: t.id })),
        },
      },
      create: {
        name: supervisor.name,
        email: supervisor.email,
        role: 'SUPERVISOR',
        emailVerified: true,
        supervisingTasks: {
          connect: tasksToSupervise.map((t) => ({ id: t.id })),
        },
      },
    })
    console.log(`Seeded Supervisor: ${supervisor.email}`)
  }

  // 3. Employees
  const employees = [
    { name: 'Employee One', email: 'employee1@example.com' },
    { name: 'Employee Two', email: 'employee2@example.com' },
    { name: 'Employee Three', email: 'employee3@example.com' },
  ]

  for (const employee of employees) {
    await prisma.user.upsert({
      where: { email: employee.email },
      update: { role: 'EMPLOYEE' },
      create: {
        name: employee.name,
        email: employee.email,
        role: 'EMPLOYEE',
        emailVerified: true,
      },
    })
    console.log(`Seeded Employee: ${employee.email}`)
  }

  // 4. Onboarding Users (Associated with Departments)
  let onboardingCounter = 1
  for (const dept of createdDepartments) {
    // Create 2 onboarding users per department
    for (let i = 0; i < 2; i++) {
      const email = `onboarding${onboardingCounter}@example.com`
      const name = `Onboarding User ${onboardingCounter}`

      const user = await prisma.user.upsert({
        where: { email: email },
        update: {
          role: 'ONBOARDING',
          deptId: dept.id,
        },
        create: {
          name: name,
          email: email,
          role: 'ONBOARDING',
          emailVerified: true,
          deptId: dept.id,
        },
        include: {
          onboardingTasks: true,
        },
      })

      // Create OnboardingTasks if they don't exist
      for (const task of dept.tasks) {
        await prisma.onboardingTask.upsert({
          where: {
            userId_taskId: {
              userId: user.id,
              taskId: task.id,
            },
          },
          update: {},
          create: {
            userId: user.id,
            taskId: task.id,
            completed: Math.random() > 0.7, // Randomly complete some tasks
          },
        })
      }

      onboardingCounter++
    }
    console.log(`Seeded Onboarding Users for: ${dept.name}`)
  }

  console.log('Seeding completed.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
