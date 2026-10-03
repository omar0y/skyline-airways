import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays, addHours, setHours, setMinutes } from "date-fns";

const prisma = new PrismaClient();

function seatLayout(capacity: number) {
  const seats: { seatNo: string; seatClass: string; price: number }[] = [];
  const letters = ["A", "B", "C", "D", "E", "F"];
  let n = 0;
  let row = 1;
  while (n < capacity) {
    for (const letter of letters) {
      if (n >= capacity) break;
      const seatClass = row <= 2 ? "FIRST" : row <= 6 ? "BUSINESS" : "ECONOMY";
      const price =
        seatClass === "FIRST" ? 220 : seatClass === "BUSINESS" ? 120 : 0;
      seats.push({ seatNo: `${row}${letter}`, seatClass, price });
      n++;
    }
    row++;
  }
  return seats;
}

async function main() {
  await prisma.checkIn.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.passenger.deleteMany();
  await prisma.flightSeat.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.milesAccount.deleteMany();
  await prisma.customerProfile.deleteMany();
  await prisma.adminProfile.deleteMany();
  await prisma.session.deleteMany();
  await prisma.loginAttempt.deleteMany();
  await prisma.flight.deleteMany();
  await prisma.aircraft.deleteMany();
  await prisma.airport.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("Password123!", 10);

  const adminUser = await prisma.user.create({
    data: {
      email: "admin@skyline.air",
      passwordHash,
      role: "ADMIN",
      admin: { create: { adminId: 1001 } },
    },
  });

  const customerUser = await prisma.user.create({
    data: {
      email: "traveler@skyline.air",
      passwordHash,
      role: "CUSTOMER",
      customer: {
        create: {
          firstName: "Alex",
          lastName: "Morgan",
          salutation: "Mr",
          phone: "+1-555-0100",
          milesAccount: {
            create: {
              number: "SL-100001",
              flightMiles: 2500,
              statusMiles: 2500,
            },
          },
        },
      },
    },
  });

  const airports = await Promise.all(
    [
      {
        code: "CAI",
        name: "Cairo International",
        city: "Cairo",
        country: "Egypt",
        terminal: "T3",
      },
      {
        code: "DXB",
        name: "Dubai International",
        city: "Dubai",
        country: "UAE",
        terminal: "T3",
      },
      {
        code: "LHR",
        name: "Heathrow",
        city: "London",
        country: "UK",
        terminal: "T5",
      },
      {
        code: "JFK",
        name: "John F. Kennedy",
        city: "New York",
        country: "USA",
        terminal: "T4",
      },
      {
        code: "CDG",
        name: "Charles de Gaulle",
        city: "Paris",
        country: "France",
        terminal: "T2",
      },
      {
        code: "IST",
        name: "Istanbul Airport",
        city: "Istanbul",
        country: "Turkey",
        terminal: "Main",
      },
    ].map((a) => prisma.airport.create({ data: a })),
  );

  const byCode = Object.fromEntries(airports.map((a) => [a.code, a]));

  const aircrafts = await Promise.all(
    [
      { model: "Airbus A320", capacity: 48 },
      { model: "Boeing 737-800", capacity: 54 },
      { model: "Airbus A350", capacity: 60 },
      { model: "Boeing 787 Dreamliner", capacity: 66 },
    ].map((a) => prisma.aircraft.create({ data: a })),
  );

  const routes = [
    { from: "CAI", to: "DXB", hours: 4, price: 280, miles: 1200, ac: 0 },
    { from: "DXB", to: "LHR", hours: 7, price: 520, miles: 2800, ac: 2 },
    { from: "CAI", to: "IST", hours: 2.5, price: 190, miles: 800, ac: 1 },
    { from: "IST", to: "CDG", hours: 3.5, price: 240, miles: 1100, ac: 1 },
    { from: "LHR", to: "JFK", hours: 8, price: 650, miles: 3400, ac: 3 },
    { from: "JFK", to: "CDG", hours: 7.5, price: 610, miles: 3200, ac: 2 },
    { from: "DXB", to: "CAI", hours: 4, price: 275, miles: 1200, ac: 0 },
    { from: "CDG", to: "CAI", hours: 4.5, price: 310, miles: 1500, ac: 1 },
  ];

  const baseDay = setMinutes(setHours(addDays(new Date(), 3), 8), 0);
  let flightIndex = 1;

  for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
    for (const route of routes) {
      const departureTime = addHours(addDays(baseDay, dayOffset), flightIndex % 10);
      const arrivalTime = addHours(departureTime, route.hours);
      const aircraft = aircrafts[route.ac];
      const flight = await prisma.flight.create({
        data: {
          flightNo: `SL${100 + flightIndex}`,
          departureTime,
          arrivalTime,
          status: "SCHEDULED",
          basePrice: route.price,
          miles: route.miles,
          aircraftId: aircraft.id,
          departureId: byCode[route.from].id,
          arrivalId: byCode[route.to].id,
        },
      });

      const seats = seatLayout(aircraft.capacity);
      await prisma.flightSeat.createMany({
        data: seats.map((s) => ({
          ...s,
          aircraftId: aircraft.id,
          flightId: flight.id,
          status: "AVAILABLE",
        })),
      });

      flightIndex++;
    }
  }

  // Connecting example: CAI->DXB then DXB->LHR on same day chain
  const firstLeg = await prisma.flight.findFirst({
    where: {
      departure: { code: "CAI" },
      arrival: { code: "DXB" },
    },
    orderBy: { departureTime: "asc" },
  });
  const secondLeg = await prisma.flight.findFirst({
    where: {
      departure: { code: "DXB" },
      arrival: { code: "LHR" },
      departureTime: { gt: firstLeg?.arrivalTime },
    },
    orderBy: { departureTime: "asc" },
  });
  if (firstLeg && secondLeg) {
    await prisma.flight.update({
      where: { id: firstLeg.id },
      data: { connectionId: secondLeg.id },
    });
  }

  console.log("Seed complete");
  console.log("Admin:", adminUser.email, "/ Password123!");
  console.log("Customer:", customerUser.email, "/ Password123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
