# Design Analysis: design.rasid.vip

## Homepage (design.rasid.vip/)
- Light theme with white/light gray background
- Sidebar on the right (RTL) with Rasid logo and navigation groups
- Navigation groups: الأساسية, الرئيسية, المؤشرات القيادية, تنفيذ الفحص, الرصد والفحص, الإدارة والنظام, التصميم والتوثيق, شاشات المصادقة, الدعم
- Hero banner: dark navy blue gradient with network/globe visualization
- Glass morphism effects throughout
- Framer Motion animations
- CSS Animations
- RTL layout

## Key Design Elements Found:
1. Stat cards with Skeleton Loading → animated counters + mini charts
2. Animated logo with orbital particles + live radar
3. Interactive icon effects: glow, bounce, rotate, transform, pulse, heart
4. Animated notification badges with 3 urgency levels
5. Glowing buttons with confetti celebration effect
6. Animated progress bars (gradient, wave, pulse)
7. Skeleton loading patterns (stats, chart, list, profile)
8. Platform cards with AI-generated background images

## Color Scheme (from screenshot):
- Background: light gray (#f8f9fc or similar)
- Sidebar: white with subtle border
- Hero banner: dark navy blue gradient
- Primary accent: royal blue
- Text: dark gray/black
- Cards: white with subtle shadows

## Dashboard Page (design.rasid.vip/dashboard)

### Header Section:
- Title: "لوحة المؤشرات والأداء" with bar chart icon
- Subtitle: "بطاقات KPI ومؤشرات الأداء — المرجع التصميمي Ultra Premium"
- Top bar: "مباشر" green dot badge, "آخر تحديث: الآن", "تحديث البيانات" button (blue gradient), "تخصيص اللوحة 5/5"

### KPI Cards Row (4 cards):
- Card 1: إجمالي المواقع المراقبة = 1,247 | +12.5% green arrow | blue icon (globe) | sparkline chart
- Card 2: نسبة الامتثال = 78.4% | +3.2% green arrow | shield icon | sparkline chart
- Card 3: التهديدات المكتشفة = 342 | -8.1% red arrow | warning icon | sparkline chart (red)
- Card 4: عمليات الفحص اليومية = 5,890 | +15.7% green arrow | eye icon | sparkline chart

### Card Design Details:
- White background with subtle shadow
- Rounded corners (xl)
- Top-right: colored circle icon (blue/red/green)
- Top-left: percentage badge with arrow (green for positive, red for negative)
- Center: large animated counter number
- Bottom: Arabic label text
- Bottom: mini sparkline chart (colored line)
- "اضغط لعرض التفاصيل" text at bottom
- Border: subtle, with color accent matching the icon

### مجموعات الامتثال Section:
- 4 sector cards in 2x2 grid
- Each card: sector name, entity count, compliance %, progress bar, compliant/non-compliant counts
- Icons: building (government), layers (private), building-office (semi-gov), users (non-profit)
- Progress bars with gradient colors

### رادار المراقبة Section:
- Animated radar visualization with rotating scan line
- Detection points as colored dots
- Stats grid below: تحديات, تحذيرات عالية, مراقبة نشطة, فحص مكتمل
- Additional stats: وقت التشغيل, سرعة الاستجابة, الاتصالات النشطة, حجم البيانات

### Color Scheme:
- Background: #f5f6fa (very light gray-blue)
- Cards: white (#ffffff) with box-shadow
- Primary blue: similar to #3b82f6
- Success green: #10b981
- Danger red: #ef4444
- Warning amber: #f59e0b
- Text dark: #1e293b
- Text muted: #64748b
- Borders: very subtle gray

### Stats Bar (below radar):
- 4 stat boxes in a row with icons:
  - وقت التشغيل: 99.97% (server icon, dark blue)
  - سرعة الاستجابة: 45ms (lightning icon, amber)
  - الاتصالات النشطة: 2,847 (wifi icon, teal)
  - حجم البيانات: 1.2TB (database icon, amber)
- Each box: white bg, rounded-xl, icon on left, value+label on right

### آخر عمليات الفحص Table:
- Clean table with columns: الموقع, الحالة, النتيجة, الاتجاه, الوقت, إجراء
- Status badges: ممتثل (green), تحذير (amber), حرج (red)
- Score bars: colored progress bars
- Trend sparklines in الاتجاه column
- "تفاصيل" button for each row
- Globe icon next to each website name
- Pagination arrows at top

### توزيع حالات الامتثال Section:
- Donut chart with 3 segments
- Legend: ممتثل بالكامل 65%, امتثال جزئي 20%, غير ممتثل 15%
- Dark navy blue background card

### سجل النشاط Section:
- Timeline-style activity log
- Each entry: icon, description, timestamp
- Yellow/amber background card

## KEY DESIGN PATTERNS TO REPLICATE:
1. KPI Cards: white bg, colored icon circle (top-right), % change badge (top-left), large number center, label below, sparkline chart, "press for details" text
2. Section headers: icon in dark circle + bold Arabic title
3. Sector/group cards: icon, name, count, percentage, progress bar, compliant/non-compliant breakdown
4. Stats boxes: icon + value + label in compact white card
5. Table: clean with status badges, score bars, sparklines, action buttons
6. Color-coded sections: dark navy for charts, amber for activity log
7. All cards have subtle shadows and rounded-xl corners
8. Animations: counter animation, sparkline drawing, radar rotation, hover scale effects
