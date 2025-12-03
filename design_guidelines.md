# Design Guidelines: Multi-Agent Snowflake Analytics Portal

## Design Approach

**Selected System**: Material Design 3 (Enterprise variant)
**Rationale**: Enterprise analytics platform requiring information density, clear data hierarchy, and professional credibility. Material Design 3 provides robust patterns for complex data displays, structured layouts, and enterprise workflows.

**Key Principles**:
- Data clarity over decoration
- Structured information hierarchy
- Consistent, professional interface
- Efficient workflow patterns

---

## Typography

**Font Family**: Inter (via Google Fonts CDN)
- Primary: Inter (400, 500, 600, 700)

**Hierarchy**:
- Page Title: text-2xl font-semibold (Agent Portal, Workflow History)
- Section Headers: text-lg font-semibold (Generated SQL, Results Preview)
- Component Labels: text-sm font-medium (Intent Summary, Cost Estimate)
- Body Text: text-sm font-normal (chat messages, descriptions)
- Code/Data: text-sm font-mono (SQL queries, JSON output)
- Metadata/Timestamps: text-xs (workflow timestamps, step metadata)

---

## Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, 12
- Component padding: p-4 or p-6
- Section spacing: space-y-4 or space-y-6
- Grid gaps: gap-4 or gap-6
- Tight groupings: space-y-2

**Grid Structure**:
- Main Layout: Three-column grid (Chat Sidebar | Main Content | Workflow Panel)
- Chat Sidebar: w-80 (fixed width)
- Main Content: flex-1 (responsive center)
- Workflow Panel: w-96 (fixed width, collapsible on mobile)
- Mobile: Stack vertically, full-width sections

---

## Component Library

### Core Layout Components

**Chat Sidebar** (Left Panel):
- Fixed-width vertical panel (w-80)
- Conversation list with timestamps
- New conversation button at top
- Scroll container for message history
- Active conversation highlight state

**Main Content Area** (Center):
- Message feed with alternating user/assistant messages
- Structured JSON output cards showing all response fields
- SQL code block with syntax highlighting placeholder
- Results table with horizontal scroll
- Input textarea with send button (bottom-fixed)

**Workflow Panel** (Right):
- Collapsible panel showing saved workflow steps
- Step cards displaying: question, SQL snippet, timestamp
- Visual connection lines between related steps
- Click to load/resume step functionality

### Data Display Components

**JSON Output Card**:
- Bordered container with rounded corners
- Key-value pairs in two-column grid
- Expandable/collapsible sections for large outputs
- Monospace font for technical values
- Status badges (PASS/FAIL validation)

**SQL Code Block**:
- Full-width container with slight inset
- Monospace font, line numbers on left
- Copy-to-clipboard button (top-right)
- Horizontal scroll for long queries
- Syntax highlighting via library (highlight.js or Prism)

**Results Table**:
- Bordered table with header row
- Sticky header on scroll
- Alternating row background for readability
- Horizontal scroll container
- Row hover states
- Cell padding: p-3

**Cost Estimate Display**:
- Inline metric cards showing: bytes scanned, credits, optimization score
- Icon + value + label structure
- Warning/success states for cost thresholds
- Horizontal arrangement in card grid

### Form Components

**Chat Input**:
- Multi-line textarea (min-h-24)
- Auto-resize on content
- Send button (icon-only, positioned bottom-right of textarea)
- Submit on Cmd/Ctrl+Enter
- Voice input button (optional icon)
- File upload button for PDF/Excel inputs

**Filters & Controls**:
- Dropdown selects for role selection (Snowflake RBAC)
- Toggle switches for feature flags (cost optimization, explainability)
- Date range picker for workflow history filtering

### Navigation Components

**Top Navigation Bar**:
- Full-width horizontal bar
- Logo/title (left)
- User profile dropdown (right)
- Settings icon
- Height: h-16

**Tab Navigation** (within main content):
- Horizontal tabs: Query | Results | Explain | Optimize
- Active tab indicator (bottom border)
- Padding: px-4 py-2

### Feedback Components

**Status Badges**:
- Small pill-shaped indicators
- States: Success (PASS), Error (FAIL), Warning (High Cost), Info
- Text size: text-xs font-medium
- Padding: px-2 py-1

**Loading States**:
- Skeleton loaders for table rows during query execution
- Spinner overlay for SQL generation
- Progress bar for large result sets

**Toast Notifications**:
- Top-right positioned alerts
- Auto-dismiss after 4 seconds
- Types: Success, Error, Warning, Info
- Slide-in animation

### Recommended Next Steps Panel:
- Card-based list of suggested queries
- Bullet points with clickable actions
- Icon prefix for each suggestion type
- Hover state with slight elevation

---

## Animations

**Minimal Motion**:
- Smooth transitions on tab switches (duration-200)
- Hover state transitions (transition-colors)
- Panel collapse/expand (slide animation)
- NO complex scroll animations or parallax effects

---

## Icons

**Library**: Heroicons (via CDN)
- Send: Paper airplane icon
- Copy: Clipboard icon
- Download: Arrow down tray
- Settings: Cog icon
- User: User circle
- Close: X mark
- Chevrons: For expandable sections
- Check/Warning: For status indicators

---

## Accessibility

- Consistent focus states with visible outline rings
- Keyboard navigation for all interactive elements
- ARIA labels for icon-only buttons
- Semantic HTML structure
- Form labels properly associated with inputs
- Table headers with proper scope attributes

---

## Images

**No hero images required** for this enterprise analytics application. The interface is data-focused and utility-driven.

**Icon Usage Only**:
- Agent/workflow status icons
- File type indicators for document uploads
- Empty state illustrations (simple line art for "no workflows yet")

This design prioritizes information density, professional credibility, and efficient data analysis workflows over visual decoration.