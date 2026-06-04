# TradeForge - AI Crypto Trading Agent Dashboard

## 1. Concept & Vision

TradeForge is a **command center for autonomous intelligence** — a premium fintech dashboard that transforms complex AI trading behavior into actionable insights. The interface embodies the precision of a Bloomberg Terminal married to the elegance of Stripe's dashboard aesthetics. Every pixel communicates competence, every interaction reinforces trust in the AI system. This is where sophisticated traders watch their self-learning agent evolve.

**Design DNA:** Professional dark fintech with electric cyan accents, inspired by TradingView's data density, Stripe's polish, and Linear's information architecture.

---

## 2. Design Language

### Aesthetic Direction
**"Neural Precision"** — Deep space-dark surfaces with electric cyan highlights, evoking advanced AI systems. Clean geometric shapes, subtle gradients that suggest depth without distraction, and data visualizations that feel analytical yet beautiful.

### Color Palette

```css
/* Core Surfaces - Multiple elevation levels */
--bg-void:       #050810;      /* Deepest background */
--bg-primary:    #0A0E17;      /* Main background */
--bg-elevated:   #0F1521;      /* Cards, panels */
--bg-hover:      #161D2B;      /* Hover states */
--bg-interactive: #1C2433;    /* Interactive surfaces */

/* Accent Colors */
--accent-cyan:      #00D4FF;    /* Primary actions, highlights */
--accent-cyan-dim:  #0099BB;    /* Secondary cyan */
--accent-cyan-glow: rgba(0, 212, 255, 0.15); /* Glow effects */

/* Semantic Colors */
--profit:  #10B981;            /* Green - gains */
--profit-dim: #059669;
--loss:    #F43F5E;            /* Red - losses */
--loss-dim:  #E11D48;
--warning: #F59E0B;            /* Amber - caution */
--info:    #3B82F6;            /* Blue - informational */

/* Text Hierarchy */
--text-primary:   #F8FAFC;     /* Headings, key numbers */
--text-secondary: #94A3B8;     /* Body text */
--text-muted:     #64748B;     /* Labels, hints */
--text-disabled:  #475569;     /* Disabled state */

/* Borders & Dividers */
--border-subtle:  rgba(148, 163, 184, 0.08);
--border-default: rgba(148, 163, 184, 0.12);
--border-strong:  rgba(148, 163, 184, 0.2);
--border-accent:  rgba(0, 212, 255, 0.3);
```

### Typography

```css
/* Font Stack */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;

/* Type Scale */
--text-xs:    11px;   /* Micro labels */
--text-sm:    12px;   /* Secondary labels, table data */
--text-base:  14px;   /* Body text */
--text-lg:    16px;   /* Emphasized body */
--text-xl:    18px;   /* Section headings */
--text-2xl:   22px;   /* Page headings */
--text-3xl:   28px;   /* Dashboard numbers */
--text-4xl:   36px;   /* Hero metrics */

/* Font Weights */
--weight-normal:  400;
--weight-medium:  500;
--weight-semibold: 600;
--weight-bold:    700;
```

### Spacing System (8-point grid)

```css
--space-0:   0px;
--space-1:   4px;
--space-2:   8px;
--space-3:   12px;
--space-4:   16px;
--space-5:   20px;
--space-6:   24px;
--space-8:   32px;
--space-10:  40px;
--space-12:  48px;
--space-16:  64px;
```

### Motion Philosophy

All animations serve function — they guide attention and confirm actions:

- **Micro-interactions:** 150ms ease-out for hover states, button presses
- **Page transitions:** 200ms ease-out for content reveals
- **Data updates:** 300ms ease-in-out for value changes with subtle flash
- **Charts:** 400ms ease-out for data point transitions
- **Modals/Drawers:** 250ms cubic-bezier(0.32, 0.72, 0, 1) for slide-in

Animations are disabled for `prefers-reduced-motion`. Number changes use counting animations.

### Visual Assets

- **Icons:** Lucide React (24px default, 16px for dense UI, 20px for navigation)
- **Charts:** Recharts with custom styling
- **Decorative:** Subtle gradient orbs, grid patterns, glow effects for AI elements
- **Status Indicators:** Animated pulse for active states, static for inactive

---

## 3. Layout & Structure

### Application Shell

```
┌─────────────────────────────────────────────────────────────────┐
│ [Sidebar 260px]  │  [Main Content Area - Fluid]                │
│                  │                                              │
│  Logo            │  ┌─────────────────────────────────────────┐ │
│  ───────────     │  │ Header Bar                               │ │
│  Navigation      │  │ Page Title + AI Status + Notifications   │ │
│  • Dashboard     │  └─────────────────────────────────────────┘ │
│  • Trading       │                                              │
│  • Analytics     │  ┌─────────────────────────────────────────┐ │
│  • Markets       │  │                                         │ │
│  • Strategy      │  │  Page Content                           │ │
│  • Reflections   │  │  (scrollable)                           │ │
│  • Risk          │  │                                         │ │
│  • Trade Replay  │  │                                         │ │
│  • Notifications │  │                                         │ │
│  ───────────     │  │                                         │ │
│  Settings        │  └─────────────────────────────────────────┘ │
│                  │                                              │
│  [User Panel]    │  [Footer Status Bar - Optional]            │
└─────────────────────────────────────────────────────────────────┘
```

### Responsive Strategy

- **Desktop (1280px+):** Full sidebar, spacious layouts, 4-column grids
- **Laptop (1024px-1279px):** Full sidebar, tighter spacing, 3-column grids
- **Tablet (768px-1023px):** Collapsible sidebar (icon-only), 2-column grids
- **Mobile (< 768px):** Hidden sidebar (hamburger menu), single column, stacked cards

### Visual Pacing

- **Hero sections:** 48px vertical padding, large metrics
- **Data grids:** 24px padding, tighter spacing
- **Transitions:** 12px gaps between grid items
- **Cards:** 20px internal padding, 8px border-radius

---

## 4. Features & Interactions

### Dashboard Page

**Metrics Grid (Top)**
- 4-column responsive grid of KPI cards
- Each card: Label, large number, trend indicator (up/down arrow + percentage)
- Hover: Subtle lift + border glow

**KPI Cards:**
1. Portfolio Value - `$124,892.45` (+12.4%)
2. Total Return - `+24.8%` (+2.1% this week)
3. Daily P&L - `+$1,245.23` (+0.98%)
4. Weekly P&L - `+$3,892.45` (+3.2%)
5. Monthly P&L - `+$12,456.78` (+11.1%)
6. Win Rate - `67.3%` (+1.2%)
7. Profit Factor - `2.14` (+0.15)
8. Sharpe Ratio - `1.89` (+0.23)
9. Max Drawdown - `-8.4%` (-1.2%)
10. Active Trades - `3` positions
11. Closed Trades - `147` total
12. Strategy Version - `v3.2.1`

**Quick Actions Section**
- "New Reflection Cycle" button
- AI Status indicator (pulsing when active)
- "View All Trades" link

**Mini Charts Row**
- Portfolio value mini sparkline (90 days)
- Mini equity curve
- Win/Loss ratio visualization

### Trading Activity Page

**Filter Bar**
- Date range picker (presets: 24h, 7d, 30d, 90d, YTD, All)
- Asset filter (dropdown with search)
- Side filter (All, Long, Short)
- Status filter (Open, Closed, All)
- Strategy version filter
- Clear all filters button

**Positions Table**
| Asset | Side | Entry | Current | P&L | % | Duration | Strategy | Actions |
| States: Default row, Hover highlight, Selected (blue border-left) |
| Long rows: Cyan accent | Short rows: Rose accent |

**Trade History**
- Expandable row reveals full trade details
- Mini price chart in expanded row
- Decision summary text
- Exit reason analysis

**Sorting:** Click column headers, visual sort arrow indicator
**Loading:** Skeleton rows with shimmer animation
**Empty:** "No trades match your filters" with filter reset CTA

### Portfolio Analytics Page

**Equity Curve (Hero Chart)**
- Full-width line chart
- Gradient fill below line
- Crosshair on hover with tooltip
- Time range selector (1W, 1M, 3M, YTD, 1Y, All)
- Benchmark comparison toggle (BTC, ETH)

**Metrics Row**
- Total Return, Annualized Return, Best Day, Worst Day badges

**Drawdown Chart (Secondary)**
- Area chart showing drawdown periods
- Color: Red gradient, opacity variations
- Hover reveals date and drawdown %

**Performance Grid (2-column)**
- Monthly Returns: Heatmap calendar visualization
- Win/Loss Distribution: Histogram with labels
- Asset Contribution: Horizontal bar chart
- Trade Statistics: Key metrics grid

### Market Intelligence Page

**Asset Panels (3-column grid)**
Each panel styled like a trading terminal:

**Panel Structure:**
```
┌────────────────────────────────────┐
│ [BTC] Bitcoin              $67,234 │
│ ▲ +2.34% (24h)             ● Live  │
├────────────────────────────────────┤
│                                    │
│     [Price Chart - 240px tall]     │
│                                    │
├────────────────────────────────────┤
│ TREND         ████████░░  Strong   │
│ MOMENTUM      ██████░░░░  Moderate │
│ MARKET        █████████░  Bullish  │
│ RISK          ████░░░░░░  Low      │
│ TRADE READY   ███████░░░  Yes      │
└────────────────────────────────────┘
```

**Visual Indicators:**
- Progress bars with gradient fills (cyan to red for risk, green to red for momentum)
- Status badges with semantic colors
- Live indicator pulse (green dot animation)

### Strategy Evolution Center

**Timeline Visualization (Hero)**
- Horizontal scrollable timeline
- Version nodes with branch lines
- Node size indicates trade count
- Node color indicates performance (green = profitable version)
- Hover reveals version summary modal

**Version Card**
- Version number, date created
- Performance metrics (win rate, P&L)
- Key parameter changes (highlighted)
- Traded asset count

**Evolution Timeline**
- Vertical timeline of evolution events
- "Reflected on trade #234" → "Updated RSI period 14→16" → "Created v3.2.1"

**Parameter Comparison**
- Side-by-side parameter display
- Changed values highlighted in cyan
- Deleted parameters in red strikethrough

### AI Reflection Center

**Reflection Cycle Cards**
- Status indicator (In Progress, Completed, Scheduled)
- Timestamp and duration
- Hypothesis cards (expandable)
- Generated insights list
- Accepted changes with confidence %

**Reasoning Display**
- Collapsible sections
- "What happened" narrative
- "Why it matters" analysis
- "What we're doing" action

**Learning Metrics**
- Confidence tracker visualization
- Improvement suggestions list
- Historical accuracy (% of hypothesis confirmed)

### Risk Management Center

**Risk Score Gauge (Hero)**
- Circular gauge 0-100
- Color zones: Green (0-30), Yellow (30-60), Orange (60-80), Red (80-100)
- Current score in center with label

**Exposure Grid**
- By Asset: Horizontal stacked bar
- By Side: Long vs Short percentage
- By Strategy: Strategy contribution

**Drawdown Monitor**
- Current drawdown with timestamp
- Historical max drawdown
- Recovery progress bar

**Protection Systems**
- Active risk controls list
- Circuit breaker status
- Max position limits visualization
- Stop-loss history

### Trade Replay System

**Interactive Timeline**
- Scrubber with play/pause
- Speed controls (1x, 2x, 5x, 10x)
- Timeline markers at entry/exit points

**Trade Visualization**
- Entry point highlighted green
- Exit point highlighted red
- Price path line during trade
- Key decision points marked

**Trade Info Panel**
- Full trade details
- AI reasoning at each step
- Performance outcome
- Lessons learned

### Notifications Center

**Notification Categories**
- All, Trades, Strategy, Risk, System (tab filters)

**Notification Cards**
- Icon + category badge
- Title and description
- Timestamp (relative + absolute on hover)
- Dismiss/archive actions
- Unread indicator (cyan dot)

**States:** Unread (bold + dot), Read (normal), Dismissed (faded + strikethrough)

### Settings Interface

**Appearance Section**
- Theme toggle (Dark only for V1)
- Accent color selection (4 presets)
- Chart style (Line, Area, Candlestick)

**Layout Section**
- Dashboard widget visibility toggles
- Default date range
- Number format (1,234.56 vs 1.234,56)

**Notifications Section**
- Toggle switches for each notification type
- Sound toggle
- Email digest frequency (None, Daily, Weekly)

**Display Section**
- Compact mode toggle
- Show/hide panels
- Default page on login

---

## 5. Component Inventory

### Navigation

**Sidebar Item**
- Default: Text-secondary, transparent bg
- Hover: bg-hover, text-primary
- Active: bg-accent-glow, border-left cyan, text-primary
- Icon + Label + Badge (notification count)

### Button

**Primary**
- Default: bg-accent-cyan, text-void, bold
- Hover: brightness(1.1), subtle scale(1.02)
- Active: scale(0.98), brightness(0.95)
- Disabled: opacity(0.5), cursor-not-allowed
- Loading: spinner + "Processing...", pointer-events-none

**Secondary**
- Default: bg-transparent, border-default, text-secondary
- Hover: bg-hover, border-strong, text-primary
- Active: bg-interactive
- Disabled: opacity(0.5)

**Ghost**
- Default: bg-transparent, text-secondary
- Hover: bg-hover, text-primary
- Active: bg-interactive

### Card

**Standard Card**
- Default: bg-elevated, border-subtle, rounded-lg, shadow-sm
- Hover: border-default, shadow-md, translateY(-1px)
- Selected: border-accent-cyan
- Loading: Skeleton with shimmer

**Metric Card**
- Label (text-muted, text-sm)
- Value (text-secondary, text-3xl, font-mono)
- Trend (profit/loss color + arrow icon)

### Table

**Header Row** - Sticky, bg-elevated, text-muted, uppercase, text-xs
**Data Row** - bg-primary, border-b border-subtle
**Hover** - bg-hover
**Selected** - bg-accent-glow, border-left accent

### Chart

**Line/Area** - Gradient fill, 2px line, smooth curve
**Tooltip** - bg-elevated, border, shadow, text-sm
**Axis** - text-muted, text-xs
**Grid** - border-subtle (very subtle)

### Progress Bar

**Container** - bg-interactive, rounded-full, h-2
**Fill** - Gradient based on semantic meaning
**Indeterminate** - Animated shimmer for loading

### Badge

**Status badges:** Small rounded pills
- Success/Profit: profit bg-dim, profit text
- Warning: warning/10 bg, warning text
- Error/Loss: loss/10 bg, loss text
- Neutral: bg-interactive, text-secondary

### Input

**Text Input**
- Default: bg-interactive, border-default, text-primary, placeholder-muted
- Focus: border-accent, ring-accent-glow
- Error: border-loss, error message below
- Disabled: bg-elevated, text-muted

**Select/Dropdown**
- Same as input with chevron icon
- Dropdown: bg-elevated, border, shadow-lg

### Modal/Dialog

- Backdrop: bg-void/80, backdrop-blur-sm
- Dialog: bg-elevated, border, rounded-lg, shadow-2xl
- Entrance: scale(0.95) → scale(1), opacity 0 → 1, 250ms

### Toast/Notification

- Position: top-right
- Enter: slide from right + fade
- Exit: slide to right + fade
- Types: success, error, warning, info (with appropriate icons/colors)

---

## 6. Technical Approach

### Stack
- **Framework:** React 18 + Vite
- **Routing:** React Router v6
- **Styling:** CSS Modules with CSS variables
- **Charts:** Recharts
- **Icons:** Lucide React
- **Animations:** CSS transitions + Framer Motion (minimal use)

### Project Structure
```
src/
├── components/
│   ├── common/          # Button, Card, Input, Badge, etc.
│   ├── layout/         # Sidebar, Header, PageContainer
│   └── charts/         # Chart components
├── pages/              # All 10 pages
├── hooks/              # Custom hooks
├── data/               # Mock data
├── styles/             # Global styles, variables
└── utils/              # Helpers
```

### Component Philosophy
- Small, focused components with clear responsibilities
- Variant props for stylistic variations (color, size, etc.)
- All states implemented (hover, focus, disabled, loading, empty)
- Accessibility: ARIA labels, keyboard navigation

### Mock Data Strategy
- All data in `src/data/mockData.js`
- Realistic crypto values (not $1.00 prices)
- Time-series data for charts (90 days)
- Trade history (150+ trades)
- Multiple strategy versions with evolution

---

## 7. Pages Overview

1. **Dashboard** - Command center with all KPIs
2. **Trading Activity** - Monitor positions and history
3. **Portfolio Analytics** - Deep performance analysis
4. **Market Intelligence** - Asset monitoring panels
5. **Strategy Evolution** - Visualize AI learning
6. **AI Reflection** - See how TradeForge thinks
7. **Risk Management** - Risk exposure and controls
8. **Trade Replay** - Review historical trades
9. **Notifications** - Event history
10. **Settings** - Customization options

---

## 8. Implementation Priority

1. Global styles, CSS variables, layout shell
2. Sidebar navigation with all routes
3. Dashboard page (hero metrics + charts)
4. Trading Activity (positions + history table)
5. Portfolio Analytics (equity curve + heatmaps)
6. Market Intelligence panels
7. Strategy Evolution timeline
8. AI Reflection cards
9. Risk Management gauges
10. Trade Replay system
11. Notifications center
12. Settings page
13. Polish: animations, empty states, responsive