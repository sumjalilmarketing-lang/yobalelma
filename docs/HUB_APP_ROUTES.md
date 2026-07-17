# Hub App Routes

All Hub routes are protected by middleware and server-side session checks.

| Route | Status |
| --- | --- |
| `/hub` | Functional dashboard |
| `/hub/inbound` | Functional manifest list |
| `/hub/inbound/[manifestId]` | Functional reception workflow |
| `/hub/scanner` | Functional scan form |
| `/hub/inspection` | Functional inspection queue |
| `/hub/inspection/[shipmentId]` | Functional inspection workflow |
| `/hub/inventory` | Functional inventory list |
| `/hub/inventory/[shipmentId]` | Functional movement workflow |
| `/hub/storage` | Functional storage overview |
| `/hub/storage/locations` | Functional locations table |
| `/hub/trips` | Functional traveler trip list |
| `/hub/trips/[tripId]` | Functional trip detail |
| `/hub/capacities` | Functional capacity view |
| `/hub/batches` | Functional batch list |
| `/hub/batches/new` | Functional batch creation |
| `/hub/batches/[batchId]` | Functional reservation and QR workflow |
| `/hub/handover` | Functional ready-batch list |
| `/hub/handover/[batchId]` | Functional handover workflow |
| `/hub/anomalies` | Functional anomaly center |
| `/hub/anomalies/[id]` | Functional anomaly detail |
| `/hub/history` | Functional audit log view |
| `/hub/reports` | Functional reports and CSV export |
| `/hub/notifications` | Functional notification list |
| `/hub/profile` | Functional operator profile |
| `/hub/settings` | Functional manager-only settings |

