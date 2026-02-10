# NDMO Platform Upgrade Tasks

## Phase 1: Full-Stack Upgrade & Database
- [x] Run webdev_add_feature to upgrade to web-db-user
- [x] Design database schema (users, leaks, channels, pii_scans, reports, exports)
- [x] Create migration script
- [x] Seed database with initial data

## Phase 2: Backend API Routes
- [x] GET/POST /api/leaks — CRUD for leak records
- [x] GET /api/channels — monitoring channels (telegram, darkweb, paste)
- [x] POST /api/pii/scan — PII classification endpoint
- [x] GET /api/reports — reports listing
- [x] GET /api/dashboard/stats — dashboard aggregation
- [x] GET /api/leaks/export?format=csv|xlsx — Excel export
- [x] GET /api/reports/export/:id?format=pdf — PDF export

## Phase 3: Authentication & RBAC
- [x] Integrate Manus OAuth for login
- [x] Add user roles table (analyst, manager, executive)
- [x] Create auth middleware with role checking
- [x] Add role-based API access control

## Phase 4: Frontend Updates
- [x] Replace mock data with API calls using hooks
- [x] Add login/auth flow UI
- [x] Add role-based navigation visibility
- [x] Add export buttons to Leaks page (CSV/Excel)
- [x] Add export buttons to Reports page (PDF)
- [x] Show user profile and role in sidebar
- [x] Add role-specific dashboard views

## Phase 5: Testing & Polish
- [x] Test all API endpoints (22 vitest tests passing)
- [x] Test auth flow
- [x] Test export functionality
- [x] Verify RTL still works correctly
- [x] Create checkpoint
