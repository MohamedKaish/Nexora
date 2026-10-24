# Aura Life OS: Ambient AI Companion, Personal Finance & Dynamic Hydration Architecture

Aura Life OS unifies an ambient executive 3D AI companion (Kyro), a deterministic forward-looking financial pacing engine (Safe-to-Spend with Dynamic Smoothing), and a physiologically adaptive circadian hydration tracker into a calm, luxury Bento Grid dashboard. Crucially, it brings production-grade, out-of-app OS system notifications (like Amazon and Flipkart) directly to your device's native notification tray with acoustic chimes, haptic feedback, and circadian scheduling.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following core design decisions and operational parameters have been confirmed:
> 
> - **Out-of-App Notification Delivery Style**: Standard system-level notification banners delivered to the Android/iOS OS notification drawer and desktop system tray with distinct acoustic sound chimes, haptic vibration patterns, and 1-tap deep links (matching the high-visibility, reliable delivery of Amazon and Flipkart).
> - **Dashboard Surface Composition**: Full tripartite integration featuring all three core pillars side-by-side in an Ambient Bento Grid: (1) 3D Executive AI Companion (Kyro), (2) Deterministic Safe-to-Spend Pacing Ring & Cash Flow Trajectory, and (3) Dynamic Circadian Hydration Vessel with thermal and caffeine offsets.
> - **Circadian Notification Timing**: Proactive push dispatch strictly anchored to three biological milestones:
>   - **08:00 Morning Executive Briefing**: Daily Safe-to-Spend allowance, overnight biometric recovery, weather thermal offset, and hydration pacing targets.
>   - **14:00 Midday Circadian Pacing Check-In**: Halfway fluid checkpoint (targeting 50% fluid intake) and remaining daily discretionary spend review.
>   - **21:00 Evening Reflection & Rebalancing**: Daily spending reconciliation, automatic surplus/deficit dynamic smoothing across remaining pay period, and net hydration summary.

---

### 1. Overview & Core Concept

* **What It Does**: Eliminates "empty-box" conversational fatigue and backward-looking financial anxiety. Rather than forcing you to open spreadsheets or chat bots, Aura Life OS operates as a calm, ambient co-pilot. It delivers high-utility mathematical clarity: telling you exactly how much money is genuinely safe to spend today without jeopardizing upcoming bills, adjusting your hydration target dynamically based on climate and activity, and notifying you outside the app at canonical moments of your day.
* **Target Audience / Persona**: Busy professionals, digital creators, and wellness-focused individuals who want real-time financial control and biological vitality without managing 50 budget categories or being interrupted by repetitive nagging.
* **Key Value**:
  - **Zero Guesswork**: Real-time daily safe-to-spend allowance with automatic deficit smoothing.
  - **Dynamic Hydration**: Scales with body mass, temperature, active burn, and caffeine intake.
  - **System-Wide Reach**: Out-of-app notifications reach you on your phone lock screen or desktop even when the app is completely closed.

---

### 2. User Experience & Visual Design

#### Aesthetic Direction & Visual Identity
* **Atmosphere**: Luxury Obsidian Gold & Cyber Minimalist (`bg-stone-950`, `border-stone-800/80`, `text-stone-100`). Subtle glassmorphism with high-contrast emerald and sky-blue operational accents.
* **Color Tokens & Spatial Math**:
  - **Background**: Deep void obsidian (`bg-stone-950`, `--background: 24 24 27`).
  - **Surface/Cards**: Smoked obsidian glass (`bg-stone-900/60`, backdrop-blur-xl, border border-stone-800/80).
  - **Safe-to-Spend Operational Tile**: Radiant Emerald (`text-emerald-400`, `border-emerald-500/30`, glow `#10B981`).
  - **Dynamic Hydration Vessel Tile**: Luminous Sky Blue (`text-sky-400`, `border-sky-500/30`, wave glow `#38BDF8`).
  - **AI Executive Summary & Accents**: Sovereign Champagne Gold (`#D4A853`, `text-amber-300`, `border-amber-500/30`).
* **Typography & Hierarchy**:
  - **Display / Headers**: Elegant Serif (`font-serif`) for executive headlines ("Safe-to-Spend", "Circadian Vessel", "Sanctuary Briefing").
  - **Data Telemetry**: Monospace (`font-mono`) for numerical values, currencies, milliliters, and latency meters.
  - **Body / Labels**: Clean Sans (`font-sans`, Inter) with generous line heights and uppercase tracked micro-labels (`text-[10px] tracking-widest font-bold`).
* **Component Styling & Layout**:
  - **Top Row**: Ambient Executive Summary Card with single-sentence contextual synthesis ("All commitments funded; $48.50 safe for discretionary spend today with 1,250ml hydration remaining").
  - **Operational Center**: Side-by-side interactive tiles:
    1. *Safe-to-Spend Ring*: Circular SVG progress arc with current daily allowance, 2-month cash low forecast, and 1-tap quick log buttons (`Log $12 Lunch`, `Log Coffee`, `Add Transaction`).
    2. *Dynamic Hydration Vessel*: Fluid wave cylinder showing real-time milliliters consumed vs. dynamically calculated target, with quick addition chips (`+250ml Glass`, `+500ml Bottle`, `+120ml Coffee offset`).
  - **Companion Integration**: Kyro 3D WebGL floating chassis tucked in the corner, providing verbal synthesis and gesture reactions on spend or hydration events.
  - **Out-of-App Notification Center**: Dedicated status deck showing current notification permission state, test trigger buttons (Sound + Vibration + Banner test), and next scheduled circadian alarm times.

---

### 3. Key Product Decisions & Trade-Offs

* **Decision 1: Dual-Rail Out-of-App Notification Architecture (Native Android Bridge + Service Worker Web Push)**
  - *Chosen Approach*: Implement a unified delivery bridge that automatically detects runtime:
    1. In the Android APK, it calls `NexoraNativeBridge.showNotification()` with a dedicated Notification Channel (`IMPORTANCE_HIGH`), default sound, and vibration pattern.
    2. In web browsers / PWAs, it delegates to `navigator.serviceWorker.ready -> registration.showNotification()` with custom icon, badge, sound chime, vibration pattern `[150, 80, 150]`, and deep-link payload.
  - *Why*: This ensures true "out-of-the-app" delivery identical to e-commerce apps like Amazon and Flipkart, working even when the user minimizes the tab or puts the phone in their pocket.
  - *Alternatives Considered*: In-app toast alerts only (rejected because the user explicitly stated they want out-of-app alerts on lock screen/tray).
* **Decision 2: Deterministic Safe-to-Spend vs. Predictive ML**
  - *Chosen Approach*: Deterministic formula:
    $$\text{Safe to Spend} = \frac{\text{Liquid Checking} - \text{Committed Bills} - \text{Floor} - \text{Buffer}}{\text{Days Remaining In Cycle}}$$
    augmented with Dynamic Smoothing (deficits smoothed across remaining days; surpluses rolled forward).
  - *Why*: Predictable, transparent, 100% reliable from Day 1 without requiring months of training data or hallucinating financial advice.
* **Decision 3: Dynamic Circadian Hydration Engine**
  - *Chosen Approach*: Dynamic volumetric formula:
    $$\text{Target (ml)} = (\text{Weight kg} \times 35) + (\text{Active Cal Burn} \times 0.4) + \text{Thermal Offset} + \text{Caffeine Offset}$$
  - *Why*: Adapts to actual human physiology rather than an arbitrary, demotivating 2,000ml static target.
* **Decision 4: Local-First State Persistence with Web-Safe Fallbacks**
  - *Chosen Approach*: Zustand stores backed by `localStorage` with offline readiness and instant UI re-renders (<2ms latency).

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Aura Life OS System Architecture                │
└────────────────────────────────────────────────────────────────────────┘
                                    │
               ┌────────────────────┴────────────────────┐
               ▼                                         ▼
   ┌───────────────────────┐                 ┌───────────────────────┐
   │  Ambient Bento UI     │                 │ Out-of-App System     │
   │  (Generative micro-   │                 │ Notification Engine   │
   │   cards & 3D Kyro)    │                 │ (Native + Web Push)   │
   └───────────┬───────────┘                 └───────────┬───────────┘
               │                                         │
               ├────────────────────┬────────────────────┤
               ▼                    ▼                    ▼
   ┌───────────────────────┐ ┌──────────────┐ ┌──────────────────────┐
   │ Safe-to-Spend Engine  │ │  Circadian   │ │ Circadian Scheduler  │
   │ • Liquid checking     │ │  Hydration   │ │ • 08:00 Morning      │
   │ • Committed bills     │ │ • Weight kg  │ │ • 14:00 Midday       │
   │ • Dynamic smoothing   │ │ • Thermal °C │ │ • 21:00 Evening      │
   │ • Surplus/At-Risk     │ │ • Caffeine   │ │ • Anti-fatigue cap   │
   └───────────┬───────────┘ └──────┬───────┘ └──────────┬───────────┘
               │                    │                    │
               └────────────────────┼────────────────────┘
                                    ▼
               ┌────────────────────────────────────────┐
               │    Unified State Layer (Zustand +     │
               │    Local-First Persistence & Storage)  │
               └────────────────────┬───────────────────┘
                                    ▼
               ┌────────────────────────────────────────┐
               │  Delivery Surfaces:                    │
               │  • Android System Notification Drawer  │
               │  • Web Push Notification via SW        │
               │  • Acoustic Chime + Tactile Vibration  │
               └────────────────────────────────────────┘
```

#### Core Data Entities & Stores

1. **`useFinanceStore.ts`**:
   - `liquidChecking`: Real-time checking balance.
   - `accountFloor`: Minimum safety floor (e.g., $500).
   - `savingsBuffer`: Pay-yourself-first buffer.
   - `payPeriodDaysRemaining`: Days until next confirmed paycheck.
   - `committedBills`: Array of recurring fixed obligations `{ id, name, amount, dueDate, isPaid }`.
   - `transactions`: Array of discretionary outlays `{ id, amount, merchant, category, date }`.
   - Computed getters: `safeToSpendDaily`, `totalCommittedRemaining`, `projectedAccountLow`, `status: 'safe' | 'at_risk'`.
   - Actions: `logTransaction()`, `addCommittedBill()`, `recalculatePacing()`, `setLiquidChecking()`.

2. **`useHydrationStore.ts`**:
   - `baselineWeightKg`: User body mass (default: 70kg).
   - `activeCaloriesBurned`: Tracked exercise calorie expenditure.
   - `ambientTemperatureC`: Local temperature (default: 24°C, adjustable or fetched).
   - `caffeineCount`: Logged cups of coffee/tea today.
   - `consumedTodayMl`: Total fluid logged today.
   - `logs`: Array of entries `{ id, amountMl, beverageType, timestamp }`.
   - Computed getters: `targetHydrationMl`, `completionPercentage`, `remainingMl`, `isPacingOnTrack`.
   - Actions: `logDrink(amountMl, type)`, `resetDaily()`, `setMetrics()`.

3. **`outOfAppNotificationManager.ts`**:
   - Manages OS permission checks (`Notification.permission` & Android bridge check).
   - Registers/wakes Service Worker (`public/sw.js`) with structured notification payloads.
   - Schedules and fires the 3 circadian alerts (08:00, 14:00, 21:00).
   - Emits audible audio chimes and hardware vibrations.
   - Provides a live test suite with 1-click test triggers so the user can verify lock-screen notifications immediately on both mobile APK and desktop.

---

### Implementation Phasing & Next Steps

1. **Phase 1: Out-of-App Notification Engine Hardening**
   - Enhance `public/sw.js` and `src/utils/notificationBridge.ts` to support rich OS notification banners with vibration patterns, icon badges, sound chimes, and deep-link click routing.
   - Add background circadian interval checker to trigger morning (08:00), midday (14:00), and evening (21:00) alerts.
2. **Phase 2: Safe-to-Spend Financial Pacing Engine**
   - Create `src/store/useFinanceStore.ts` with the deterministic formula, dynamic smoothing calculations, bills schedule, and quick-logging modal.
3. **Phase 3: Dynamic Circadian Hydration Engine**
   - Create `src/store/useHydrationStore.ts` implementing the physiological formula with thermal and caffeine offsets, and an interactive fluid vessel tile.
4. **Phase 4: Ambient Bento Dashboard Integration**
   - Assemble the primary Dashboard (`src/app/(dashboard)/dashboard/page.tsx`) with the Ambient Executive Card, Safe-to-Spend Ring tile, Dynamic Hydration Vessel tile, and Notification Control Deck.
5. **Phase 5: Verification & Compilation**
   - Execute `compile_applet` and verify 0 TypeScript and build errors across the entire application.
