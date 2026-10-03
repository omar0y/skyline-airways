# SkyLine Airways

Complete foundational airline booking website built from the Class Diagram (`classdigram.pdf`).

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Prisma + SQLite
- Server Actions for mutations
- ui-ux-pro-max design system in `design-system/skyline-airways/MASTER.md`

## Setup

```bash
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

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
