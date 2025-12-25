import { prisma } from '../server/utils/prisma'

async function main() {
  console.log('Starting seed...')

  // --- Departments Data ---
  const departmentsData = [
    {
      name: 'Engineering',
      tasks: [
        'Setup Development Environment',
        'Review Code Style Guidelines',
        'Gain Access to GitHub Repository',
        'Complete Security Compliance Training',
        'Read System Architecture Docs',
      ],
    },
    {
      name: 'HR',
      tasks: [
        'Review Employee Handbook',
        'Complete Benefits Enrollment',
        'Submit Payroll Information',
        'Harassment Prevention Training',
        'Meet with Department Head',
      ],
    },
    {
      name: 'Marketing',
      tasks: [
        'Review Brand Guidelines',
        'Access Social Media Accounts',
        'Analyze Competitor Landscape',
        'Setup Analytics Tools',
        'Read Content Strategy',
      ],
    },
    {
      name: 'Sales',
      tasks: [
        'CRM Software Training',
        'Review Sales Scripts',
        'Shadow a Senior Sales Rep',
        'Product Demo Walkthrough',
        'Review Pricing Model',
      ],
    },
    {
      name: 'IT',
      tasks: [
        'Setup Company Email',
        'Configure VPN Access',
        'Hardware Provisioning',
        'Security Policy Acknowledgement',
        'Password Manager Setup',
      ],
    },
  ]

  const createdDepartments = []

  // --- Seed Departments ---
  for (const dept of departmentsData) {
    const department = await prisma.department.upsert({
      where: { name: dept.name },
      update: {},
      create: {
        name: dept.name,
        tasks: {
          create: dept.tasks.map((desc) => ({ desc })),
        },
      },
    })
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
  ]

  for (const supervisor of supervisors) {
    await prisma.user.upsert({
      where: { email: supervisor.email },
      update: { role: 'SUPERVISOR' },
      create: {
        name: supervisor.name,
        email: supervisor.email,
        role: 'SUPERVISOR',
        emailVerified: true,
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
  // Ensure every department has at least some onboarding users
  let onboardingCounter = 1
  for (const dept of createdDepartments) {
    // Create 2 onboarding users per department
    for (let i = 0; i < 2; i++) {
      const email = `onboarding${onboardingCounter}@example.com`
      const name = `Onboarding User ${onboardingCounter}`

      await prisma.user.upsert({
        where: { email: email },
        update: {
          role: 'ONBOARDING',
          deptId: dept.id, // Ensure association on update too if role matches
        },
        create: {
          name: name,
          email: email,
          role: 'ONBOARDING',
          emailVerified: true,
          deptId: dept.id,
        },
      })
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
