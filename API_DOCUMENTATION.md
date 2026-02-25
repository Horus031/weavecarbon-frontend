# WeaveCarbon API Documentation

Last updated: 2026-02-25
Source of truth: implementation in `src/server.js`, `src/routes/*`, `src/validators/*`, `src/services/*`.

## 1. Overview

WeaveCarbon API is an Express + PostgreSQL backend for:
- authentication (email/password + Google OAuth)
- account/company management
- product carbon footprint management
- product batches and shipment logistics
- export market compliance workflows
- report/export generation
- subscription management

## 2. Conventions

### 2.1 Base URLs

- API base: `http://localhost:4000/api`
- Health check: `http://localhost:4000/health`

### 2.2 Authentication

Most protected endpoints require:

`Authorization: Bearer <access_token>`

Access token payload contains:
- `sub` (user id)
- `email`
- `roles` (array)
- `is_demo`
- `company_id`

### 2.3 Standard Response Format

Success:

```json
{
  "success": true,
  "data": {},
  "message": "optional",
  "meta": {}
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": []
  }
}
```

Validation errors (`422`) use:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "field_name", "message": "...", "value": "..." }
    ]
  }
}
```

### 2.4 Role / Permission Middleware

- `authenticate`: valid bearer token
- `requireRole('b2b')`: user must have b2b role
- `requireCompanyMember`: user must be active member of company
- `requireCompanyAdmin`: user must be active admin of company

### 2.5 Rate Limits

`NODE_ENV !== 'production'` uses higher limits (dev-friendly).

| Scope | Prod limit | Dev limit | Window |
|---|---:|---:|---|
| Global `/api/*` | 100 | 1000 | 15 min |
| `POST /api/auth/signup` | 5 | 50 | 1 hour |
| `POST /api/auth/signin` | 10 (failed req only) | 50 | 15 min |
| `POST /api/auth/refresh` | 30 | 100 | 1 min |
| Google OAuth endpoints | 30 | 120 | 5 min |
| `POST /api/auth/verify-email/resend` | 3 | 20 | 5 min |

### 2.6 Common HTTP Statuses

- `200` OK
- `201` Created
- `202` Accepted (background job)
- `400` Bad request / business rule violation
- `401` Unauthorized / invalid token
- `403` Forbidden
- `404` Not found
- `409` Conflict
- `422` Validation error
- `500` Internal server error
- `501` Not implemented (placeholder endpoints)

## 3. Endpoint Index

### 3.1 System
- `GET /health`

### 3.2 Auth (`/api/auth`)
- `POST /signup`
- `POST /signin`
- `POST /signout`
- `POST /refresh`
- `POST /demo`
- `GET /verify-email`
- `POST /verify-email`
- `POST /verify-email/resend`
- `GET /google`
- `GET /google/callback`
- `GET /check-company`

### 3.3 Account (`/api/account`)
- `GET /`
- `PUT /profile`
- `POST /company`
- `PUT /company`
- `POST /change-password`

### 3.4 Dashboard (`/api/dashboard`)
- `GET /overview`

### 3.5 Products (`/api/products`)
- `GET /`
- `GET /bulk-template`
- `POST /bulk-import/validate`
- `POST /bulk-import/file`
- `GET /:id`
- `POST /`
- `PUT /:id`
- `PATCH /:id/status`
- `DELETE /:id`
- `POST /bulk-import`

### 3.6 Product Batches (`/api/product-batches`)
- `GET /`
- `GET /:id`
- `POST /`
- `PATCH /:id`
- `DELETE /:id`
- `POST /:id/items`
- `PATCH /:id/items/:product_id`
- `DELETE /:id/items/:product_id`
- `PATCH /:id/publish`

### 3.7 Logistics (`/api/logistics`)
- `GET /shipments`
- `GET /overview`
- `GET /shipments/:id`
- `POST /shipments`
- `PATCH /shipments/:id`
- `PATCH /shipments/:id/status`
- `PUT /shipments/:id/legs`
- `PUT /shipments/:id/products`

### 3.8 Company Members (`/api/company/members`)
- `GET /`
- `POST /`
- `PUT /:id`
- `DELETE /:id`

### 3.9 Reports (`/api/reports`)
- `GET /`
- `POST /exports`
- `POST /export-jobs` (alias)
- `GET /export-sources`
- `GET /export-sources/:type`
- `GET /export-data/:type`
- `GET /:id`
- `GET /:id/status`
- `GET /:id/download`
- `POST /`
- `DELETE /:id`
- `PATCH /:id/status`

### 3.10 Export Markets (`/api/export/markets`)
- `GET /`
- `POST /:market_code/recommendations/:recommendation_id/actions`
- `POST /:market_code/products`
- `PATCH /:market_code/products/:product_id`
- `DELETE /:market_code/products/:product_id`
- `PATCH /:market_code/carbon-data/:scope`
- `POST /:market_code/documents/:document_id/upload`
- `GET /:market_code/documents/:document_id/download`
- `DELETE /:market_code/documents/:document_id`
- `POST /:market_code/reports`

### 3.11 Subscription (`/api/subscription`)
- `GET /`
- `POST /upgrade`

---

## 4. Detailed API Docs

## 4.1 System

### GET `/health`

- Auth: none
- Response `200`:

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-02-24T13:00:00.000Z",
    "uptime": 12345.67
  }
}
```

---

## 4.2 Authentication APIs

Base path: `/api/auth`

### POST `/signup`

- Auth: none
- Rate limit: signup limiter
- Body:

| Field | Type | Required | Rules |
|---|---|---|---|
| `email` | string | yes | valid email |
| `password` | string | yes | min 8, must include upper/lower/number/special |
| `full_name` | string | yes | 2..100 chars |
| `role` | enum | yes | `b2b` or `b2c` |
| `company_name` | string | conditional | required when `role=b2b` |
| `business_type` | enum | conditional | `shop_online`/`brand`/`factory` when `role=b2b` |
| `target_markets` | array | no | array |
| `phone` | string | no | E.164 style regex |

- Success `201`:

```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "user@example.com", "full_name": "User", "email_verified": false },
    "profile": { "id": "uuid", "user_id": "uuid", "company_id": "uuid" },
    "role": "b2b",
    "company": { "id": "uuid", "name": "My Company", "business_type": "brand", "current_plan": "starter" },
    "requires_email_verification": true
  }
}
```

- Errors:
  - `409 EMAIL_EXISTS` (already registered and verified)
  - `422 VALIDATION_ERROR`

- Notes:
  - if email exists but not verified, old account is deleted and recreated.
  - verification email is sent as styled HTML with CTA button (`Verify Email`).
  - verification link base URL resolution: `API_BASE_URL` -> `BACKEND_URL` -> `FRONTEND_URL`.

### POST `/signin`

- Auth: none
- Rate limit: signin limiter
- Body:

| Field | Type | Required | Rules |
|---|---|---|---|
| `email` | string | yes | valid email |
| `password` | string | yes | non-empty |
| `remember_me` | boolean | no | boolean |

- Success `200`: returns `user`, `profile`, `roles`, `company`, `company_membership`, `tokens`.
- Token section fields: `access_token`, `refresh_token`, `token_type`, `expires_in` (900), `expires_at`.

- Main errors:
  - `401 INVALID_CREDENTIALS`
  - `403 EMAIL_NOT_VERIFIED`

### POST `/signout`

- Auth: required
- Body:

| Field | Type | Required | Rules |
|---|---|---|---|
| `all_devices` | boolean | no | default false |

- Success `200`:

```json
{
  "success": true,
  "data": { "sessions_revoked": 1, "all_devices": false }
}
```

- Note: current implementation is stateless acknowledgment (no token blacklist persistence).

### POST `/refresh`

- Auth: none
- Rate limit: refresh limiter
- Body: `refresh_token` (required)
- Success `200`: returns fresh token pair in `data.tokens`.
- Errors:
  - `401 INVALID_REFRESH_TOKEN`
  - `401 USER_NOT_FOUND`

### POST `/demo`

- Auth: none
- Body:

| Field | Type | Required | Rules |
|---|---|---|---|
| `role` | enum | yes | `b2b`/`b2c` |
| `demo_scenario` | enum | no | `empty`/`sample_data`/`full` |

- Success `200`: demo user + tokens + limitations.

### GET `/verify-email`

- Auth: none
- Query params:

| Field | Required |
|---|---|
| `token` | yes |
| `email` | yes |
| `view` | no (`html` / `page` to force HTML page) |

- Response mode:
  - Browser mode (`Accept: text/html` or `view=html/page`): returns HTML result page.
  - API mode (default JSON): returns JSON result.
- Success behavior:
  - If email is not verified: verifies email and issues access/refresh tokens.
  - If email is already verified: returns success message/page (no re-verification).
- HTML success flow (new verification):
  - page includes `Continue to WeaveCarbon` button.
  - button opens frontend callback URL: `/auth/callback#access_token=...&refresh_token=...`.
- Errors:
  - `400 MISSING_PARAMETERS`
  - `400 INVALID_VERIFICATION_TOKEN`
  - `404 USER_NOT_FOUND`
  - `500` HTML error page (browser mode only)

### POST `/verify-email`

- Auth: none
- Body: `token` + `email`
- Success `200`: `data.message` + `data.tokens`
- Errors:
  - `400 INVALID_VERIFICATION_TOKEN`
  - `400 ALREADY_VERIFIED`
  - `404 USER_NOT_FOUND`

### POST `/verify-email/resend`

- Auth: none
- Rate limit: verify-email limiter
- Body: `email` required
- Success `200`:
  - generic success when email not found (to avoid account enumeration)
  - or `Verification email sent`
- Errors:
  - `400 ALREADY_VERIFIED`
  - `400 VALIDATION_ERROR` when email missing

### GET `/google`

- Auth: none
- Rate limit: google limiter
- Query (all optional):

| Field | Notes |
|---|---|
| `intent` | `signin` or `signup` |
| `flow` | alias of intent |
| `mode` | alias of intent |
| `role` | normalized to `b2b`/`b2c`; signup flow forces b2b |

- Behavior: returns HTTP redirect to Google OAuth URL.

### GET `/google/callback`

- Auth: none
- Rate limit: google limiter
- Query:

| Field | Required |
|---|---|
| `code` | yes |
| `state` | yes (validated with HMAC + TTL) |

- Behavior:
  - exchanges code to Google tokens
  - fetches Google profile
  - create/update user according to `intent`
  - redirects to frontend callback URL with URL hash fields

Success redirect hash fields include:
- `access_token`, `refresh_token`, `token_type`, `expires_in`,
- `provider=google`, `auth_intent`, `is_new_user`,
- `requires_company_setup`, `next_step`

Error redirect hash fields include:
- `error`, `error_description`

### GET `/check-company`

- Auth: required
- Success `200`:

```json
{
  "success": true,
  "data": {
    "has_company": true,
    "is_b2b": true,
    "company_id": "uuid"
  }
}
```

---

## 4.3 Account APIs

Base path: `/api/account`

### GET `/`

- Auth: required
- Success: `data.profile` + `data.company`.

### PUT `/profile`

- Auth: required
- Body:

| Field | Required | Rules |
|---|---|---|
| `full_name` | yes | 2..100 chars |
| `email` | no | valid email |

- Success `200`: updated profile row + message.

### POST `/company`

- Auth: required
- Purpose: create company for user without company.
- Body:

| Field | Required | Rules |
|---|---|---|
| `name` | yes | 2..200 chars |
| `business_type` | yes | `shop_online`/`brand`/`factory` |
| `target_markets` | no | array |

- Success `201`: created company.
- Errors:
  - `400 ALREADY_HAS_COMPANY`

### PUT `/company`

- Auth: required + `b2b` + company admin
- Body:

| Field | Required | Rules |
|---|---|---|
| `name` | yes | 2..200 chars |
| `business_type` | yes | enum |

- Success `200`: updated company.
- Errors:
  - `400 NO_COMPANY`
  - `403 FORBIDDEN` (not admin)

### POST `/change-password`

- Auth: required
- Body:

| Field | Required | Rules |
|---|---|---|
| `new_password` | yes | min 8, strong password pattern |
| `confirm_password` | yes | must equal `new_password` |

- Success `200`: message only.

---

## 4.4 Dashboard APIs

Base path: `/api/dashboard`

### GET `/overview`

- Auth: required + `b2b`
- Query:

| Field | Required | Rules | Default |
|---|---|---|---|
| `trend_months` | no | int 1..12 | 6 |

- Success `200` returns:
- `data.stats`
- `data.carbon_trend`
- `data.emission_breakdown`
- `data.market_readiness`
- `data.recommendations`
- `meta.company_id`, `meta.generated_at`, `meta.trend_period_months`

- Errors:
  - `400 INVALID_PARAMETER` (`trend_months` out of range)
  - `404 COMPANY_NOT_FOUND`

---

## 4.5 Products APIs

Base path: `/api/products`
All endpoints: auth required + role `b2b`.

### GET `/`

- Query:

| Field | Required | Rules | Default |
|---|---|---|---|
| `search` | no | string | - |
| `status` | no | `draft`/`active`/`archived`/`all` | all |
| `category` | no | string | - |
| `page` | no | int >=1 | 1 |
| `page_size` | no | int 1..100 | 20 |
| `sort_by` | no | `created_at`/`updated_at`/`name`/`sku`/`total_co2e` | `updated_at` |
| `sort_order` | no | `asc`/`desc` | `desc` |
| `include` | no | string | - |

- Success: `data.items[]` + `data.pagination`.
- Note: service maps DB status `active` to FE status `published` in responses.

### GET `/bulk-template`

- Query: `format` = `xlsx` or `csv`
- Current status: placeholder
- Response: `501 NOT_IMPLEMENTED`

### POST `/bulk-import/validate`

- Body: optional `rows` array
- Current status: placeholder validation response (`isValid`, `validRows`, etc.)

### POST `/bulk-import/file`

- Current status: placeholder
- Response: `501 NOT_IMPLEMENTED`

### GET `/:id`

- Path param: `id` required
- Success: full product payload merged from DB + snapshot.
- Error: `404 PRODUCT_NOT_FOUND`.

### POST `/`

- Body:

| Field | Required | Rules |
|---|---|---|
| `productCode` | yes | 1..100 chars |
| `productName` | yes | 1..200 chars |
| `productType` | no | max 100 |
| `weightPerUnit` | no | float >=0 (grams) |
| `quantity` | no | int >=0 |
| `materials` | no | array |
| `accessories` | no | array |
| `productionProcesses` | no | array |
| `energySources` | no | array |
| `carbonResults` | no | object |
| `save_mode` | no | `draft` or `publish` |

- Success `201`:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "draft",
    "version": 1,
    "shipmentId": null,
    "shipmentCreationSkipped": false,
    "skipReason": null
  }
}
```

- Errors:
  - `400 DUPLICATE_SKU`
  - `404 NO_COMPANY`

### PUT `/:id`

- Path: `id` required
- Body: same required core fields as create (except `save_mode`)
- Success: updated `id/status/version/updatedAt`
- Error: `404 PRODUCT_NOT_FOUND`

### PATCH `/:id/status`

- Body: `status` required, one of `draft`/`active`/`archived` (validator)
- Business transition rules in service (FE status semantic):
  - `draft -> published`
  - `published -> archived`
  - `archived -> draft`

- Error:
  - `400 INVALID_STATUS_TRANSITION`
  - `404 PRODUCT_NOT_FOUND`

### DELETE `/:id`

- Soft delete to archived.
- Success `200`: message.
- Error: `404 PRODUCT_NOT_FOUND`.

### POST `/bulk-import`

- Body:

| Field | Required | Rules |
|---|---|---|
| `rows` | yes | non-empty array |
| `rows.*.sku` | yes | non-empty |
| `rows.*.productName` | yes | non-empty |
| `save_mode` | no | `draft`/`publish` |

- Success includes:
- `imported`
- `failed`
- `errors[]`
- `ids[]`

---

## 4.6 Product Batches APIs

Base path: `/api/product-batches`
All endpoints: auth required + role `b2b`.

### GET `/`

- Query: `search`, `status`, `page`, `page_size`
- Success: `items[]` + pagination

### GET `/:id`

- Success: batch header + `items[]`
- Error: `404 BATCH_NOT_FOUND`

### POST `/`

- Body:

| Field | Required | Rules |
|---|---|---|
| `name` | yes | string, max 255 |
| `description` | no | max 1000 |
| `originAddress` | no | object |
| `destinationAddress` | no | object |
| `destinationMarket` | no | string, max 50 |
| `transportModes` | no | array of `sea`/`air`/`road`/`rail` |

- Success `201`: id, status, timestamps

### PATCH `/:id`

- Body: same fields as create, optional
- Error: `404 BATCH_NOT_FOUND`

### DELETE `/:id`

- Soft delete to archived
- Error: `404 BATCH_NOT_FOUND`

### POST `/:id/items`

- Body:

| Field | Required | Rules |
|---|---|---|
| `product_id` | yes | non-empty |
| `quantity` | yes | float > 0 |
| `weight_kg` | no | float >= 0 |
| `co2_per_unit` | no | float >= 0 |

- Errors:
  - `404 BATCH_NOT_FOUND`
  - `404 PRODUCT_NOT_FOUND`
  - `400 INVALID_BATCH_STATUS_TRANSITION` (published batch)
  - `400 DUPLICATE_BATCH_ITEM`

### PATCH `/:id/items/:product_id`

- Body optional: `quantity`, `weight_kg`, `co2_per_unit`
- Errors:
  - `404 BATCH_NOT_FOUND`
  - `404 BATCH_ITEM_NOT_FOUND`

### DELETE `/:id/items/:product_id`

- Errors:
  - `404 BATCH_NOT_FOUND`
  - `404 BATCH_ITEM_NOT_FOUND`

### PATCH `/:id/publish`

- Business rules:
  - batch must exist
  - not already published
  - not empty
- Success: batch status + optional shipment info
- Errors:
  - `404 BATCH_NOT_FOUND`
  - `400 INVALID_BATCH_STATUS_TRANSITION`
  - `400 BATCH_EMPTY`

---

## 4.7 Logistics APIs

Base path: `/api/logistics`
All endpoints: auth required + role `b2b`.

### GET `/shipments`

- Query:

| Field | Rules |
|---|---|
| `search` | string |
| `status` | `pending`/`in_transit`/`delivered`/`cancelled`/`all` |
| `transport_mode` | `road`/`sea`/`air`/`rail` |
| `date_from` | `YYYY-MM-DD` |
| `date_to` | `YYYY-MM-DD` |
| `page` | int >=1 |
| `page_size` | int 1..100 |
| `sort_by` | `created_at`/`updated_at`/`estimated_arrival`/`total_co2e` |
| `sort_order` | `asc`/`desc` |

- Success: `items[]` + `pagination`

### GET `/overview`

- Success returns aggregate counts:
- `total_shipments`, `pending`, `in_transit`, `delivered`, `cancelled`, `total_co2e`

### GET `/shipments/:id`

- Success: shipment detail + `origin`, `destination`, `legs[]`, `products[]`
- Error: `404 SHIPMENT_NOT_FOUND`

### POST `/shipments`

- Body requirements:

| Field | Required | Notes |
|---|---|---|
| `reference_number` | no | auto-generated if omitted |
| `origin.country` | yes | string |
| `origin.city` | yes | string |
| `destination.country` | yes | string |
| `destination.city` | yes | string |
| `estimated_arrival` | no | YYYY-MM-DD |
| `legs` | yes | non-empty array |
| `products` | yes | non-empty array |

Leg item required fields:
- `leg_order`, `transport_mode`, `origin_location`, `destination_location`, `distance_km`, `co2e`

Product item required fields:
- `product_id`, `quantity`, `weight_kg`, `allocated_co2e`

- Errors:
  - `400 EMPTY_SHIPMENT_PRODUCTS`
  - `400 PRODUCT_NOT_IN_COMPANY`

### PATCH `/shipments/:id`

- Partial update fields:
- `reference_number`, `origin.*`, `destination.*`, `estimated_arrival`
- Error: `404 SHIPMENT_NOT_FOUND`

### PATCH `/shipments/:id/status`

- Body:

| Field | Required | Rules |
|---|---|---|
| `status` | yes | `pending`/`in_transit`/`delivered`/`cancelled` |
| `actual_arrival` | no | YYYY-MM-DD |

- Transition rules:
  - `pending -> in_transit/cancelled`
  - `in_transit -> delivered/cancelled`
  - delivered/cancelled are terminal

- Errors:
  - `400 INVALID_SHIPMENT_STATUS_TRANSITION`
  - `404 SHIPMENT_NOT_FOUND`

### PUT `/shipments/:id/legs`

- Replaces all legs.
- `leg_order` must be unique and sequential from 1.
- Errors:
  - `404 SHIPMENT_NOT_FOUND`
  - `400 INVALID_SHIPMENT_PAYLOAD`

### PUT `/shipments/:id/products`

- Replaces all products.
- Errors:
  - `404 SHIPMENT_NOT_FOUND`
  - `400 PRODUCT_NOT_IN_COMPANY`

---

## 4.8 Company Members APIs

Base path: `/api/company/members`

### GET `/`

- Auth: required + b2b + company member
- Query filters:

| Field | Rules |
|---|---|
| `status` | `active`/`invited`/`disabled` |
| `role` | `admin`/`member`/`viewer` |

- Success: `data[]` members + `meta` counts.

### POST `/`

- Auth: required + b2b + company admin
- Body:

| Field | Required | Rules |
|---|---|---|
| `email` | yes | valid email |
| `full_name` | yes | 2..100 |
| `password` | yes | strong password |
| `role` | yes | `member` or `viewer` |
| `send_notification_email` | no | boolean, default true |

- Success `201`: created member summary.

### PUT `/:id`

- Auth: required + b2b + company admin
- Body optional: `role` (`member|viewer`), `status` (`active|disabled`)
- Main constraints in service:
  - cannot update yourself
  - cannot update admin members

### DELETE `/:id`

- Auth: required + b2b + company admin
- Main constraints in service:
  - cannot delete yourself
  - cannot delete admin members

---

## 4.9 Reports APIs

Base path: `/api/reports`
All endpoints: auth required + b2b.

### GET `/`

- Query:

| Field | Rules |
|---|---|
| `search` | string |
| `type` | `carbon_audit`/`compliance`/`export_declaration`/`sustainability`/`dataset_export`/`manual`/`export_data` |
| `status` | `processing`/`completed`/`failed` |
| `date_from` | ISO date |
| `date_to` | ISO date |
| `page` | int >=1 |
| `page_size` | int 1..100 |
| `sort_by` | `created_at`/`updated_at`/`title`/`status`/`generated_at` |
| `sort_order` | `asc`/`desc` |

- Success: items + pagination.

### POST `/exports`

- Unified dataset export pipeline.
- Body:

| Field | Required | Rules |
|---|---|---|
| `dataset_type` | yes | `product`/`activity`/`audit`/`users`/`history`/`analytics`/`company` |
| `file_format` | no | `csv` or `xlsx` |
| `title` | no | 3..200 chars |

- Success `202`: report job metadata (`report_id`, `status`, `records`).

### POST `/export-jobs`

- Alias endpoint for `/exports`.
- Same request/response/validation.

### GET `/export-sources`

- Returns consolidated source counts in one call.

### GET `/export-sources/:type`

- Supported route values:
- `products|product|activity|audit|users|history|analytics|company`

- Success returns mapped `dataset_type`, `count`, `last_updated`.
- Error: `400 INVALID_SOURCE_TYPE`.

### GET `/export-data/:type`

- Returns raw dataset as JSON.
- Supported route values same as above.
- Success:

```json
{
  "success": true,
  "data": {
    "dataset_type": "product",
    "columns": ["sku", "name"],
    "rows": [],
    "total": 0
  }
}
```

### GET `/:id`

- Report detail by id.
- Error: `404 REPORT_NOT_FOUND`.

### GET `/:id/status`

- Lightweight polling endpoint.
- Returns: `id`, `status`, `file_format`, `file_size_bytes`, `download_url`, `error_message`, timestamps.
- Error: `404 REPORT_NOT_FOUND`.

### GET `/:id/download`

- Returns binary file stream for completed report.
- If provider local and file missing in dev, placeholder file may be auto-created.
- Errors:
  - `404 REPORT_NOT_FOUND`
  - `409 REPORT_NOT_READY`
  - `404 FILE_NOT_FOUND` (if placeholder disabled)
  - `501 STORAGE_NOT_IMPLEMENTED` (non-local storage)

### POST `/`

- Creates manual report job (`status=processing`) then background generation.
- Body:

| Field | Required | Rules |
|---|---|---|
| `report_type` | yes | `carbon_audit`/`compliance`/`export_declaration`/`sustainability`/`manual`/`export_data` |
| `title` | yes | 3..200 |
| `description` | no | max 1000 |
| `period_start` | no | ISO date |
| `period_end` | no | ISO date, must be >= start |
| `target_market` | no | max 100 |
| `file_format` | no | `pdf`/`xlsx`/`csv` |
| `filters` | no | object |

- Success `202`: `{ id, status, message }`

### DELETE `/:id`

- Deletes report record and tries to delete local file.
- Error: `404 REPORT_NOT_FOUND`

### PATCH `/:id/status`

- Body: `status` required (`processing`/`completed`/`failed`)
- Transition rules:
  - `processing -> completed|failed`
  - `failed -> processing`
  - `completed` terminal

- Errors:
  - `404 REPORT_NOT_FOUND`
  - `400 INVALID_STATUS_TRANSITION`

---

## 4.10 Export Markets APIs

Base path: `/api/export/markets`
All endpoints: auth required + b2b.

### GET `/`

- Returns all market compliance cards for current company.
- Side effect: ensures missing target markets + required document placeholders are auto-created.

Each market item contains:
- identity/status: `id`, `market_code`, `market_name`, `status`, `score`
- verification fields
- required document summaries
- `document_requirements` (from DB requirements table if available)
- `documents[]`
- `product_scope[]`
- `carbon_data[]`
- `recommendations[]`
- `emission_factors[]` (global reference subset)

### POST `/:market_code/recommendations/:recommendation_id/actions`

- Body:

| Field | Required | Rules |
|---|---|---|
| `action` | yes | `start`/`complete`/`dismiss`/`reset`/`mark_completed` |

- Success: recommendation action state update.
- Errors:
  - `404 MARKET_NOT_FOUND`
  - `404 RECOMMENDATION_NOT_FOUND`
  - `400 INVALID_ACTION`

### POST `/:market_code/products`

- Body:

| Field | Required | Rules |
|---|---|---|
| `product_id` | yes | non-empty |
| `hs_code` | no | max 50 |
| `notes` | no | max 500 |

- Upsert behavior on `(market_id, product_id)`.
- Errors:
  - `404 MARKET_NOT_FOUND`
  - `404 PRODUCT_NOT_FOUND`

### PATCH `/:market_code/products/:product_id`

- Body: optional `hs_code`, `notes`
- Error: `404 PRODUCT_SCOPE_NOT_FOUND`

### DELETE `/:market_code/products/:product_id`

- Removes product from scope.
- Error: `404 PRODUCT_SCOPE_NOT_FOUND`

### PATCH `/:market_code/carbon-data/:scope`

- Path `scope`: `scope1|scope2|scope3`
- Body:

| Field | Required | Rules |
|---|---|---|
| `value` | yes | numeric |
| `unit` | no | max 20 |
| `methodology` | no | max 500 |
| `data_source` | no | max 200 |
| `reporting_period` | no | max 100 |

- Upsert behavior by `(market_id, scope)`.

### POST `/:market_code/documents/:document_id/upload`

- Current implementation accepts metadata in JSON body (not multipart file content yet).
- Body fields used:
- `document_name`, `document_code`, `original_filename`, `file_size_bytes`, `mime_type`, `checksum_sha256`

- Behavior:
  - sanitize filename
  - generate tenant-aware storage key
  - update existing document row or create new row

### GET `/:market_code/documents/:document_id/download`

- Returns binary stream for local storage.
- In dev, placeholder document may be generated if file missing and placeholders enabled.
- Errors:
  - `404 MARKET_NOT_FOUND`
  - `404 DOCUMENT_NOT_FOUND`
  - `404 DOCUMENT_FILE_NOT_FOUND`
  - `501 STORAGE_NOT_IMPLEMENTED`

### DELETE `/:market_code/documents/:document_id`

- Marks document back to `missing` and clears storage fields.
- Error: `404 DOCUMENT_NOT_FOUND`

### POST `/:market_code/reports`

- Generates compliance report job for one market.
- Body:

| Field | Required | Rules |
|---|---|---|
| `file_format` | yes | `xlsx`/`csv`/`pdf` |

- Preconditions:
  - market must exist
  - market status must be `ready` or `verified`

- Success `202`: `{ report_id, status, download_url: null }`
- Errors:
  - `404 MARKET_NOT_FOUND`
  - `400 MARKET_NOT_READY`

---

## 4.11 Subscription APIs

Base path: `/api/subscription`

### GET `/`

- Auth: required + b2b
- Returns:
- `current_plan`
- `plan_details`
- `limits`
- `usage`

### POST `/upgrade`

- Auth: required + b2b + company admin
- Body:

| Field | Required | Rules |
|---|---|---|
| `target_plan` | yes | `starter`/`standard`/`export` |
| `billing_cycle` | yes | `monthly`/`yearly` |

- Returns mock payment session (`checkout_url`, `session_id`, `amount`).

---

## 5. Key Business Rules

- Product status transitions are controlled (draft/published/archived semantics).
- Publishing product/batch may auto-create shipment when logistics data is sufficient.
- Shipment status transitions are strictly validated.
- Export market score/status is recalculated after scope/carbon/doc/recommendation changes.
- Report/export generation is asynchronous (`202`) and should be polled using report status endpoints.

## 6. Error Code Catalog (Observed in Implementation)

### Auth / Permission
- `UNAUTHORIZED`
- `INVALID_TOKEN`
- `TOKEN_EXPIRED`
- `FORBIDDEN`
- `USER_NOT_FOUND`
- `INVALID_CREDENTIALS`
- `EMAIL_NOT_VERIFIED`
- `INVALID_REFRESH_TOKEN`
- `INVALID_VERIFICATION_TOKEN`
- `ALREADY_VERIFIED`
- `EMAIL_EXISTS`

### Validation / Request
- `VALIDATION_ERROR`
- `MISSING_PARAMETERS`
- `INVALID_PARAMETER`
- `INVALID_SOURCE_TYPE`
- `INVALID_ACTION`
- `INVALID_SHIPMENT_PAYLOAD`

### Resource Not Found
- `NOT_FOUND`
- `NO_COMPANY`
- `COMPANY_NOT_FOUND`
- `PRODUCT_NOT_FOUND`
- `BATCH_NOT_FOUND`
- `BATCH_ITEM_NOT_FOUND`
- `SHIPMENT_NOT_FOUND`
- `REPORT_NOT_FOUND`
- `MARKET_NOT_FOUND`
- `RECOMMENDATION_NOT_FOUND`
- `DOCUMENT_NOT_FOUND`
- `DOCUMENT_FILE_NOT_FOUND`
- `PRODUCT_SCOPE_NOT_FOUND`

### Business / Conflict
- `DUPLICATE_SKU`
- `DUPLICATE_BATCH_ITEM`
- `INVALID_STATUS_TRANSITION`
- `INVALID_BATCH_STATUS_TRANSITION`
- `INVALID_SHIPMENT_STATUS_TRANSITION`
- `BATCH_EMPTY`
- `EMPTY_SHIPMENT_PRODUCTS`
- `PRODUCT_NOT_IN_COMPANY`
- `REPORT_NOT_READY`
- `MARKET_NOT_READY`
- `RATE_LIMITED`

### Storage / Infra
- `FILE_NOT_FOUND`
- `STORAGE_NOT_IMPLEMENTED`
- `INTERNAL_ERROR`

## 7. Postman Quick Start

1. Call `POST /api/auth/signin` and copy `access_token`.
2. Set header `Authorization: Bearer <access_token>`.
3. Test protected endpoints, e.g. `GET /api/account`, `GET /api/products`, `GET /api/reports`.
4. For async report/export APIs (`POST /api/reports`, `POST /api/reports/exports`), poll `GET /api/reports/:id/status`.

## 8. Implementation Notes / Known Placeholders

- `GET /api/products/bulk-template` -> not implemented (`501`)
- `POST /api/products/bulk-import/file` -> not implemented (`501`)
- Export market document upload currently stores metadata only (file middleware not wired yet).
- Non-local storage providers for download are not implemented (`501`).

## 9. Changelog

- `2026-02-24`: Rebuilt documentation from current codebase routes/validators/services.
- `2026-02-25`: Updated email verification docs for HTML verify page + content negotiation (`GET /api/auth/verify-email`) and email link URL resolution (`API_BASE_URL` fallback chain).
