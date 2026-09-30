// Creates one demo event (as DRAFT) so the admin can see how things look.
// Run: npm run db:seed
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const inDays = (d, h = 19) => {
  const x = new Date(Date.now() + d * 86400e3);
  x.setUTCHours(h - 5, 30, 0, 0); // IST
  return x;
};

const slug = "sangeetmay-sundarkand-indore-demo";
if (!(await prisma.event.findUnique({ where: { slug } }))) {
  await prisma.event.create({
    data: {
      slug,
      title: "Sangeetmay Shri Sundarkand",
      subtitle: "संगीतमय श्री सुन्दरकाण्ड, भावार्थ सहित",
      description: "An evening of Shri Sundarkand sung live by Kuber Maheshwari, with the meaning of the verses explained.\n\n(Demo event: edit or delete it in the admin panel.)",
      category: "Sundarkand",
      startsAt: inDays(21),
      gatesOpenAt: inDays(21, 18),
      venueName: "Demo Venue",
      address: "Vijay Nagar",
      city: "Indore",
      posterUrl: "/images/gallery/kuber-01.webp",
      status: "DRAFT",
      ticketTypes: {
        create: [
          { name: "VIP", description: "Front rows", price: 50000, capacity: 50, maxPerOrder: 6, sortOrder: 0 },
          { name: "General", description: "Open seating", price: 0, capacity: 300, maxPerOrder: 10, sortOrder: 1 },
        ],
      },
    },
  });
  console.log("Seeded demo event (DRAFT):", slug);
} else console.log("Demo event already exists");
await prisma.$disconnect();
