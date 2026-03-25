import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create departments
  const engineering = await prisma.department.create({
    data: {
      name: "Engineering",
      description: "Software development department",
    },
  });

  const sales = await prisma.department.create({
    data: {
      name: "Sales",
      description: "Sales and marketing department",
    },
  });

  // Create categories
  const webDev = await prisma.category.create({
    data: {
      name: "Web Development",
      departmentId: engineering.id,
    },
  });

  const mobileDev = await prisma.category.create({
    data: {
      name: "Mobile Development",
      departmentId: engineering.id,
    },
  });

  // Create products
  await prisma.product.createMany({
    data: [
      {
        name: "React Website",
        price: 5000,
        categoryId: webDev.id,
      },
      {
        name: "iOS App",
        price: 10000,
        categoryId: mobileDev.id,
      },
      {
        name: "Android App",
        price: 8000,
        categoryId: mobileDev.id,
      },
    ],
  });

  // Create cities
  const newYork = await prisma.city.create({
    data: {
      name: "New York",
      country: "USA",
    },
  });

  const london = await prisma.city.create({
    data: {
      name: "London",
      country: "UK",
    },
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });