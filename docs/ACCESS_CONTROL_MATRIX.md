# Access Control Matrix

## App Access

| Role | user-app | hub-app | collection-app | relay-app | admin-app |
| --- | --- | --- | --- | --- | --- |
| `client` | Allowed | Denied | Denied | Denied | Denied |
| `local_transporter` | Allowed | Denied | Denied | Denied | Denied |
| `traveler` | Allowed | Denied | Denied | Denied | Denied |
| `hub_agent` | Denied | Allowed | Denied | Denied | Denied |
| `hub_manager` | Denied | Allowed | Denied | Denied | Denied |
| `collection_driver` | Denied | Denied | Allowed | Denied | Denied |
| `collection_manager` | Denied | Denied | Allowed | Denied | Denied |
| `relay_agent` | Denied | Denied | Denied | Allowed | Denied |
| `relay_manager` | Denied | Denied | Denied | Allowed | Denied |
| `operations_manager` | Denied | Denied | Denied | Denied | Allowed |
| `support_agent` | Denied | Denied | Denied | Denied | Allowed |
| `finance_agent` | Denied | Denied | Denied | Denied | Allowed |
| `admin` | Denied | Denied | Denied | Denied | Allowed |
| `super_admin` | Denied | Denied | Denied | Denied | Allowed |

## Required Enforcement Layers

Every app must enforce access through:

- middleware;
- server components/actions;
- route handlers;
- Supabase RLS;
- explicit API checks;
- tests for denied access.

Menus are not security boundaries.

## Current Transition State

The root app still hosts all routes. It now recognizes the target roles and exposes shared access policy helpers in `@yobalelma/auth`. Host/domain based middleware will be implemented when routes move into each app.
