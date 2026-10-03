# SkyLine Airways

Complete foundational airline booking website built from the Class Diagram (`classdigram.pdf`).

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Prisma + MySQL
- Server Actions for mutations
- ui-ux-pro-max design system in `design-system/skyline-airways/MASTER.md`

## Setup

MySQL 8 on `127.0.0.1:3307`, database `skyline`, user `skyline`, password `skyline`. With Colima:

```bash
colima start
docker run -d --name skyline-mysql \
  -e MYSQL_ROOT_PASSWORD=skyline \
  -e MYSQL_DATABASE=skyline \
  -e MYSQL_USER=skyline \
  -e MYSQL_PASSWORD=skyline \
  -p 3307:3306 \
  mysql:8
```

`.env`:

```bash
DATABASE_URL="mysql://skyline:skyline@127.0.0.1:3307/skyline"
```

```bash
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

## Duffel test flights

Search uses the Duffel test API. Put a test token in `.env` (never commit it):

```bash
DUFFEL_ACCESS_TOKEN="duffel_test_..."
```

Search sends origin, destination, and date. Booking creates a Duffel test order paid from the Duffel balance, then stores the booking, passengers, payment, and tickets in MySQL.

## Demo accounts

| Role     | Email                 | Password      |
|----------|-----------------------|---------------|
| Admin    | `admin@skyline.air`   | `Password123!` |
| Customer | `traveler@skyline.air`| `Password123!` |

## Main flows

1. Search flights from the homepage hero
2. Select a flight → `/book/[flightId]` passengers → seats → `/bookings/[ref]/pay` → confirm
3. Check in with booking reference + last name (miles credited on ticketed payment)
4. Admin can add/delay/close flights, disable users, and modify bookings

## Domain coverage

User, Customer, Admin, Session, LoginAttempt, Search, Airport, Aircraft, Flight, FlightSeat, Booking, Passenger, Payment, Ticket, CheckIn, MilesAccount
