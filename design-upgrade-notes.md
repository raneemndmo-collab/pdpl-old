# Design Upgrade Notes

## Current Project Structure (MUST PRESERVE)
- DashboardLayout.tsx: 508 lines, has navGroups with 5 groups (command, operational, advanced, management, admin)
- Uses useNdmoAuth() hook, useTheme() context, NotificationBell component
- Has aurora background, glassmorphism effects already
- RASID_LOGO constant at line 60
- Sidebar has collapse/expand, mobile responsive, group expand/collapse
- Top header has theme toggle, search link, notification bell, status indicator

## Key Components to Preserve
- useNdmoAuth hook (NOT useAuth)
- ThemeContext (already exists at @/contexts/ThemeContext)
- NotificationBell component
- All tRPC queries in Dashboard
- ComplianceWarningDialog
- LeakDetailDrilldown
- All page routes in App.tsx

## Reference Design Assets (from /home/ubuntu/upload/assets/)
- AnimatedSidebar.tsx: 862 lines, uses framer-motion heavily, has orbital rings, search bar, group headers with badges
- DashboardPage.tsx: Reference dashboard with KPI cards
- GlassCard.tsx: Reference glass card component
- GlowButton.tsx: Glow button component
- ParticleField.tsx: Particle background
- ParallaxEffects.tsx: Parallax background
- ThemeContext.tsx: Theme context (we already have one)
- useSoundEffects.ts: Sound effects hook
- AnimatedCounter.tsx: Animated counter
- MiniChart.tsx: Mini chart component
- NotificationBadge.tsx: Badge component
- index.css: Premium animations and utilities

## CDN Logo URLs
- Full logo: https://files.manuscdn.com/user_upload_by_module/session_file/310519663296955420/bOTpAmRYSJlUHmHB.png
- Logo transparent: https://files.manuscdn.com/user_upload_by_module/session_file/310519663296955420/vNhlOCIQgADkxvCu.png
- Character: https://files.manuscdn.com/user_upload_by_module/session_file/310519663296955420/dkglTIXroWSrEuNv.png

## Current index.css
- 578 lines
- Has: Tailwind 4, OKLCH colors, glassmorphism, aurora bg, glow effects, animations
- Font: Cairo + DM Sans
- Dark theme: deep navy-purple
- Already has: glass-card, glass-sidebar, glow-purple/cyan/amber/red/emerald, aurora-bg, pulse-glow, scan-line, shimmer, gradient-text

## Strategy
1. ADD reference index.css animations/utilities to existing index.css (don't replace)
2. ADD new components: GlowButton, ParticleField, ParallaxEffects, AnimatedLogo, NotificationBadge
3. UPDATE DashboardLayout sidebar with reference AnimatedSidebar effects while keeping all nav items
4. UPDATE Dashboard.tsx with reference DashboardPage.tsx card styles while keeping all tRPC queries
5. UPDATE other pages with consistent Ultra Premium styling
