# International Visual Demo

## Demo Routes

- Client cockpit: `/dashboard/client/international`
- Transporter cockpit: `/dashboard/transporter/international`
- Relay cockpit: `/dashboard/relay/international`
- Relay destination QR: `/dashboard/relay/destination-reception`
- Collection cockpit: `/dashboard/collection/international`
- Hub cockpit: `/dashboard/hub/international`
- Hub capacities: `/dashboard/hub/capacities`
- Traveler cockpit: `/dashboard/traveler/international`
- Admin cockpit: `/dashboard/admin/international`

## Visual State

The pages use the existing Yobalelma premium design system:

- role-specific backdrops;
- KPI cards;
- operational timeline;
- action cards;
- connected lists;
- warning panels for Supabase/RLS read limits.

## Screenshot Status

Captured with Playwright:

- `docs/visual-demo/international/01-client-international.png`
- `docs/visual-demo/international/02-relay-destination-reception.png`
- `docs/visual-demo/international/03-collection-international.png`
- `docs/visual-demo/international/04-hub-international.png`
- `docs/visual-demo/international/05-traveler-international.png`
- `docs/visual-demo/international/06-admin-international.png`

The first screenshot was visually inspected after generation: the page renders with the Yobalelma shell, role hero, connected metrics, timeline, action cards and empty states.
