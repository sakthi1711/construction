# Aarti Construction · BuildTrack — Static Demo

BuildTrack is a fully static demonstration of the construction tracking platform. It keeps the original landing page, home customizer, customer dashboard, admin dashboard, construction updates, change requests, approvals/rejections, photo previews, and role-based navigation — but **does not use Supabase or any backend service**.

## How it works

- All demo data is seeded in the browser using `localStorage`.
- Customer/admin login is simulated locally.
- New customer accounts can be created from the Sign Up form.
- New projects are stored locally after customization.
- Admin progress updates change the same local project data visible to the customer dashboard.
- Customer change requests are stored locally and can be approved/rejected by the admin.
- Construction/customer photos are converted to browser data URLs for the demo.
- Refreshing the browser keeps the demo state because it uses `localStorage`.

## Demo accounts

### Customer
- Email: `customer@buildtrack.demo`
- Password: `customer123`

### Admin / Builder
- Email: `admin@buildtrack.demo`
- Password: `admin123`

## Run

Use VS Code Live Server or any simple static HTTP server. No Node package, database, API key, Supabase project, or environment variables are required.

## Main functionality

1. **Home selection & customization** — choose house type, furnishing, interior package, and additional features; total price updates instantly.
2. **Static authentication** — sign in, sign up, role selection, logout, and protected customer/admin pages.
3. **Customer dashboard** — progress percentage, construction stage timeline, estimated handover, project information, daily updates, photos, and change requests.
4. **Admin dashboard** — project list, project statistics, daily update publishing, progress/stage changes, photo attachment, and change-request approval/rejection.
5. **Shared demo state** — customer and admin pages read/write the same `localStorage` data, so the full workflow can be demonstrated without a server.

## Important

This version is intentionally a static/demo implementation. The passwords and data are not secure and must not be used for a real production application.
