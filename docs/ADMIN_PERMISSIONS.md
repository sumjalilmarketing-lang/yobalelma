# Admin Permissions

## Roles

- `admin`
- `super_admin`
- `operations_manager`
- `support_agent`
- `hub_agent`
- `relay_agent`
- `collection_driver`
- `local_transporter`
- `traveler`
- `client`

## Permission rules

- `admin` can read and operate the platform back-office.
- `super_admin` can change critical settings, permissions and feature flags.
- `operations_manager` supervises active operations and corrective actions.
- `support_agent` can read support-relevant information without secret access.
- `hub_agent` can write hub operations only for accessible hubs.

## Database tables

- `roles`
- `permissions`
- `role_permissions`
- `user_roles`

## Audit expectation

Role changes, permission changes, KYC review, manual shipment correction, payout block/release and setting changes must write an audit event.
