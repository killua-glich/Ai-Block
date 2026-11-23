# Ai-Block — Device Rental

A website where users can browse and rent devices (laptops, tablets, phones, cameras, etc.).

## Features (planned)

- Browse device catalog with filters (category, price, availability)
- Device detail page with specs, photos and rental price
- Rental booking with date range selection and availability check
- User accounts: sign up, log in, view active and past rentals
- Admin area: manage devices, inventory and rentals

## Tech stack

- React 19 + Vite (plain JavaScript, no TypeScript)
- React Router for pages
- Mock data in `src/data/devices.js` (no backend yet)

## Getting started

```bash
npm install
npm run dev      # dev server at http://localhost:5173
npm run build    # production build to dist/
npm test         # all acceptance tests (Vitest)
npm run verify -- 001   # check one backlog task: scope, lint, build, tests
```

## Structure

```
src/
  components/   reusable UI (Header, DeviceCard)
  pages/        routes (Catalog, DeviceDetail)
  data/         mock device data
```
