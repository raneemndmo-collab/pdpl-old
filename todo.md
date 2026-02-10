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

## Phase 6: Real-Time Notifications (WebSocket)
- [x] Install socket.io dependencies
- [x] Create WebSocket server integration with Express
- [x] Add notification events (new_leak, status_change, scan_complete)
- [x] Build notification bell UI with dropdown panel
- [x] Add toast notifications for real-time alerts
- [x] Store notifications in database with read/unread status
- [x] Add notification preferences in Settings

## Phase 7: Scheduled Monitoring Jobs
- [x] Create monitoring_jobs table in schema
- [x] Build cron-based background worker service
- [x] Implement Telegram channel check simulation
- [x] Implement Dark Web source check simulation
- [x] Implement Paste Sites check simulation
- [x] Add job status dashboard in monitoring pages
- [x] Add manual trigger buttons for each job
- [x] Log job results and auto-create leak records

## Phase 8: Audit Log System
- [x] Create audit_logs table in schema
- [x] Add audit logging middleware for all API actions
- [x] Track: logins, exports, status changes, role changes, PII scans
- [x] Build Audit Log page with filterable table
- [x] Add audit log to admin-only navigation
- [x] Add export audit log as CSV

## Phase 9: LLM Threat Intelligence Enrichment
- [x] Add enrichment fields to leaks schema (aiSeverity, aiSummary, aiRecommendations, enrichedAt)
- [x] Create LLM enrichment service using invokeLLM helper
- [x] Add tRPC procedure to enrich a leak on demand
- [x] Auto-enrich new leaks detected by scheduler
- [x] Build enrichment UI panel on leak detail view
- [x] Add "Enrich All" bulk action button
- [x] Show AI-generated executive summary on Dashboard

## Phase 10: Email/SMS Alert Channels
- [x] Add alert_contacts table (name, email, phone, role, preferences)
- [x] Add alert_rules table (severity threshold, channel, recipients)
- [x] Create notifyOwner-based email alert service
- [x] Build Alert Contacts management page
- [x] Build Alert Rules configuration page
- [x] Integrate alerts into scheduler when leaks are detected
- [x] Add alert history/delivery log

## Phase 11: Data Retention Policies
- [x] Add retention_policies table (entity, retentionDays, archiveAction, enabled)
- [x] Create retention enforcement cron job
- [x] Add retention policy management UI in Settings (dedicated Data Retention page)
- [x] Add archive/purge confirmation dialogs
- [x] Show retention stats (records archived, storage saved)
- [x] Add manual archive trigger for admin
