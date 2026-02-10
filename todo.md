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

## Phase 12: Interactive Threat Map
- [x] Add geographic data fields to leaks schema (region, city, lat, lng)
- [x] Create map data aggregation endpoint (leaks by region)
- [x] Build interactive threat map page with SVG-based Saudi Arabia map
- [x] Add heat zones for threat concentration areas
- [x] Add clickable markers with leak details popup
- [x] Show Saudi Arabia regional breakdown with color-coded severity
- [x] Add map to Dashboard as a summary widget (nav link)

## Phase 13: Automated Compliance Reports
- [x] Add scheduled_reports table (frequency, recipients, template, lastRun, nextRun)
- [x] Create report generation service with PDF output
- [x] Add tRPC procedures for CRUD on scheduled reports
- [x] Build Report Scheduler management page
- [x] Add weekly/monthly/quarterly frequency options
- [x] Integrate with alert contacts for recipient selection
- [x] Add report history with download links

## Phase 14: API Key Management
- [x] Add api_keys table (name, key, permissions, rateLimit, lastUsed, expiresAt)
- [x] Create API key generation and validation logic
- [x] Add tRPC procedures for CRUD on API keys
- [x] Build API Keys management page with create/revoke UI
- [x] Add usage stats and rate limit display
- [x] Add API documentation section with endpoint reference
- [x] Add API key auth middleware for external access

## Phase 15: Replace Mock Data with Realistic Real-World Data
- [x] Research real data breaches in Saudi Arabia ONLY
- [x] Ensure ALL data is Saudi-only (no other countries)
- [x] Replace all leak records with realistic breach incidents (real company types, realistic record counts, actual breach patterns)
- [x] Update Telegram monitoring channels with realistic channel names and content
- [x] Update Dark Web listings with realistic marketplace/forum entries
- [x] Update Paste Sites entries with realistic paste content patterns
- [x] Replace monitoring job data with realistic scan results
- [x] Update dashboard statistics to reflect realistic numbers
- [x] Update reports with realistic compliance findings
- [x] Remove all obviously fake/test data from the database
- [x] Update frontend fallback/static text to be realistic
- [x] Verify all pages show realistic data

## Phase 16: Massive Realistic Data Population
- [x] Deep research on all Saudi data breach incidents (2020-2026)
- [x] Document 50+ real breach incidents with full evidence and details
- [x] Create comprehensive seed script with all breach records
- [x] Seed 85+ leak records with bilingual descriptions and AI analysis
- [x] Seed 25+ monitoring channels (Telegram, Dark Web, Paste)
- [x] Seed 20+ dark web listings with prices and record counts
- [x] Seed 15+ paste entries with file details
- [x] Seed 30+ audit log entries
- [x] Seed 20+ notifications
- [x] Seed 15+ alert history records
- [x] Update mockData.ts with realistic fallback data
- [x] Verify all dashboard analytics show rich data
- [x] Apply enhancements from analysis documents
- [x] Final checkpoint and deliver

## Phase 17: Fix Failing Test
- [x] Fix jobs.getById test failure (jobId mismatch)

## Phase 18: Analyze Attached Code and Implement Missing Enhancements
- [x] Extract and analyze attached ZIP file (files(38).zip)
- [x] Document all features/enhancements in attached code not present in current platform
- [x] Enhanced PII Detection (18 Saudi types) — add 10 new patterns
- [x] Threat Hunting Rules page with 25 Saudi-specific rules
- [x] InfoStealer Log Detection (RedLine, Vidar, ComboList)
- [x] Evidence Chain/Integrity page with hash verification
- [x] Seller Profiles page with risk scoring
- [x] OSINT Tools page (Google Dorks, Shodan queries)
- [x] Feedback/Accuracy Metrics page (Precision/Recall/F1)
- [x] Smart Detection patterns (SQL, Credentials, Base64, Arabic NER)
- [x] Knowledge Graph visualization
- [x] Anomaly Detection dashboard widget (included in threat rules + knowledge graph)
- [x] NCA Reporting integration (included in evidence chain + reports)
- [x] Cross-Source Correlation analysis (included in knowledge graph)
- [x] Run tests and verify all enhancements (86/86 passed)
- [x] Final checkpoint and deliver

## Phase 19: Bug Fix - Logout on Leak Detail + Remaining Enhancements
- [x] Fix: Viewing leak details causes logout/session loss
- [x] Identify and implement remaining enhancements from attached code analysis
- [x] Run tests and verify fixes
- [x] Checkpoint and deliver

## Phase 20: Custom Auth System & User Management
- [x] Create platform_users table with userId, passwordHash, name, email, mobile, displayName, role, status
- [x] Create custom login endpoint (userId + password, no OAuth)
- [x] Create custom login page UI (userId + password form)
- [x] Create user management page (admin only) - CRUD users, assign roles/permissions
- [x] Add 4 users: MRUHAILY (Root Admin), aalrebdi (Director), msarhan (Vice President), malmoutaz (Platform Manager)
- [x] Define role-based permissions (root_admin, director, vice_president, manager)
- [x] Replace OAuth login with custom session/JWT auth
- [x] Add user profile display in sidebar
- [x] Test login flow and user management (86/86 tests passed)
- [x] Checkpoint and deliver
