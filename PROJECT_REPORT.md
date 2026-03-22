# PROJECT_REPORT.md — ABA Visual Performance

This document describes the **ABA Visual Performance** codebase as observed in the repository. Where behavior is inferred but not fully traced, it is marked explicitly.

### Recent updates (2025-03-08)

- **Indicator progres trial — limbaj receptiv:** În `src/features/receptive-language/ReceptiveShowCommonObjectsTrial.tsx`, textul de progres (`1 / N`) folosește același model ca în `trial.tsx` (B1) și ca în trial-urile pattern/tower: `Typography.small` + `Colors.textSecondary`, container absolut `top: 20`, `left: 24`, `zIndex: 10`, format cu spații în jurul `/`.
- **Obiective fără trial implementat:** Cardurile din grilele de obiective sunt **dezactivate vizual** (`opacity: 0.5` prin `src/design/objectiveCard.ts`) și **neclicabile** dacă nu există rută funcțională în `src/app/trial.tsx`. Logica centralizată: `src/utils/objectiveTrialAvailability.ts` (funcții per zonă: vizual, receptiv, etichetare, citire). Badge discret **„În curând”** pe cardurile dezactivate (unde e cazul). În `trial.tsx` există un comentariu care cere actualizarea acestui util la adăugare de ramuri noi.
  - **Discriminare vizuală:** Implementate = B1 cu categorii (`OBJECTIVES` id 1) sau `trialType` pentru turn/pattern/logical; restul (ex. id 2, 8–14 fără categorii) = dezactivate.
  - **Limbaj receptiv:** Implementat pentru fluxul **Arată obiecte comune** (`show_common_objects` → `objective=receptive_show_common_objects`). Eliminat startul care ducea la `/trial` doar cu `sessionId` (trial B1 implicit incorect). **`canStart`** depinde doar de configurarea validă pentru acest obiect.
  - **Citire:** Cardurile implementate în helper: **`receptive_letters`** (configurare B1 în `reading.tsx`); celelalte obiective din listă sunt dezactivate până la implementare.
  - **Etichetare:** Folosește `isLabelingObjectiveImplemented` (în prezent **`numeste-culori`**); păstrează dezactivarea când nu e selectat copilul.

---

## 1. Project Overview

### What the app does
The application is a **therapy / education support tool** oriented toward **ABA (Applied Behavior Analysis) visual performance** tasks. It lets authenticated users manage **children** (clients), start **sessions** stored in **Firebase Firestore**, and run **interactive trials** on device: drag-and-drop matching, tower building, pattern tasks, logical image association, color labeling, and a separate **STT (speech-to-text)** trial flow.

### Main purpose
- Provide a **tablet-first, landscape** UI for configuring objectives and running trials.
- **Persist** session metadata and outcomes to the cloud (Firestore).
- Support **web (PWA)** and **native** (iOS/Android via Expo) from one codebase.

### Target platform
- **Primary:** tablets and larger touch devices (`app.json`: landscape; iOS `supportsTablet: true`; design tokens reference tablet touch targets in `src/design/touch.ts`).
- **Also:** **Web** (Metro bundler, static export, PWA manifest/service worker injection) and **mobile** via **Expo** / **EAS** (`eas.json`).

---

## 2. Tech Stack

| Area | Technology |
|------|------------|
| Runtime / UI | **React 19**, **React Native 0.81**, **expo ~54** |
| Navigation | **expo-router** (~6), file-based routes under `src/app` |
| Language | **TypeScript** (`tsconfig.json`, path alias `@/*` → `src/*`) |
| Backend / auth | **Firebase** v12: **Auth**, **Firestore** (`src/config/firebase.native.js`, `src/config/firebase.web.js`) |
| Animations / gestures | **react-native-reanimated**, **react-native-gesture-handler** |
| Audio | **expo-av** (`src/utils/audio.ts`) |
| Speech (TTS) | **react-native-tts** + web fallbacks (`src/utils/speech.ts` — not fully audited here) |
| UI libs | **expo-linear-gradient**, **@expo/vector-icons**, **react-native-paper**, **react-native-mask-input** |
| Images / SVG | **expo-image**, **react-native-svg** + **react-native-svg-transformer** (`metro.config.js`) |
| Fonts | **@expo-google-fonts/inter** (loaded in `src/app/_layout.tsx`) |
| Build / deploy | **Vercel** (`vercel.json`), **EAS Build** (`eas.json`, `app.json` `extra.eas.projectId`) |

**Note:** Firebase configuration objects are **committed in source** (`firebase.native.js` / `firebase.web.js`). This is a **security and operations concern** (rotate keys, restrict domains, use env-based config in production).

---

## 3. Project Structure

### Root-level
- **`app.json`** — Expo app name, slug, landscape, Android package, web static output, plugins (expo-router, splash), EAS project id.
- **`package.json`** — Scripts: `start`, `android`, `ios`, `web`, `export:web`, `trim:images`, `lint`.
- **`vercel.json`** — Web build: version script, image trim, `expo export --platform web`, `inject-manifest.js`; SPA rewrites to `index.html`.
- **`eas.json`** — EAS profiles: `development` (dev client), `preview` (Android APK), `production`.
- **`metro.config.js`** — SVG transformer setup.
- **`assets/`** — Images, audio, program-specific image folders (e.g. under `assets/programe/...`).
- **`scripts/`** — `trim-images.js`, `inject-manifest.js`, `generate-version.js` (referenced by Vercel), etc.

### `src/` (main application code)
| Path | Role |
|------|------|
| **`src/app/`** | **Expo Router routes** — root layout, auth screens, dashboard group, `trial.tsx`. |
| **`src/screens/`** | Heavy screens: `Auth/*`, `Dashboard/MainDashboard`, `Dashboard/AdminDashboard`. |
| **`src/components/`** | Shared UI, layout, trials (`components/trials/*`), PWA banners, etc. |
| **`src/features/`** | Domain modules: `b1-2d-matching` (types, `generateTrials`, stimuli), `stt` (STT session + Firestore helpers). |
| **`src/config/`** | `objectives.ts` (visual + receptive language definitions), Firebase platform files. |
| **`src/contexts/`** | React context (e.g. selected child, speech recommendation). |
| **`src/design/`** | Colors, spacing, typography, theme, touch targets. |
| **`src/hooks/`** | PWA update, install, resume, responsive helpers. |
| **`src/utils/`** | `audio.ts`, `speech.ts`, `responsive.ts`, logical matching engine, etc. |

### Duplicate / legacy `app/` at repository root
A top-level **`app/`** folder exists (e.g. placeholder “Dashboard”). **Expo Router prefers `src/app` when present**, so the active routes are under **`src/app`**. The root `app/` appears **unused** by the main app flow unless the project configuration is changed—**verify before deleting**.

---

## 4. Core Features (implemented in code)

### Authentication
- **Login** (`src/app/login.tsx` → `LoginScreen`), **Register** (`register.tsx` → `RegisterScreen`): Firebase `signInWithEmailAndPassword` / `createUserWithEmailAndPassword`.
- **Root gate** (`src/app/_layout.tsx`): `onAuthStateChanged`; unauthenticated users are sent to `/login`, authenticated to `/main-dashboard` (after fonts load).

### Child management & main dashboard
- **`MainDashboard`** (`src/screens/Dashboard/MainDashboard.tsx`): CRUD-style management of **`children`** collection documents (`userId`, name, birth date validation, notes, `voiceEnabled`), real-time or fetched lists, session aggregation for export/delete flows, sign-out, account navigation. **Large single file** mixing UI and Firestore logic.

### Visual skills — objective selection & session start
- **`src/app/(dashboard)/visual-skills.tsx`**: Lists **`OBJECTIVES`** from `src/config/objectives.ts`. User picks objective, configures via drawer (categories, targets via **`ItemSelector`**, tower/pattern/logical parameters). **Start** creates a Firestore **`sessions`** document (`userId`, `childId`, `startedAt`, counters, `objectives` array) and navigates to **`/trial`** with query params (`sessionId`, `trialType` or B1 params, `voiceEnabled`, etc.). Obiectivele fără trial implementat sunt **afiliate gri și neclicabile** (`isVisualSkillsObjectiveImplemented` din `@/utils/objectiveTrialAvailability`); **`canStart`** cere obiectiv selectat implementat.

### Trial router (`src/app/trial.tsx`)
Central dispatcher by **route params** (la extinderi: actualizați **`src/utils/objectiveTrialAvailability.ts`**):
- **`objective=numeste-culori`** → **`ColorLabelingTrial`** (requires `sessionId`).
- **`objective=receptive_show_common_objects`** → **`ReceptiveShowCommonObjectsTrial`** (`sessionId`, `category`, `itemCount`, `distractorCount`, etc.).
- **`trialType=tower_over_model`** → **`TowerConstructionTrial`**.
- **`trialType=tower-copy`** → **`TowerConstructionCopyTrial`**.
- **`trialType=pattern-reproduction`** → **`PatternReproductionTrial`**.
- **`trialType=pattern-continuation`** → **`PatternContinuationTrial`**.
- **`trialType=logical-image-association`** → **`LogicalMatchingTrial`** (`pairCount` 1–5).
- **Default** → **B1 2D matching** UI in `trial.tsx` itself: builds **`B1Config`** via `buildB1Config`, **`generateTrials`**, drag-and-drop matching, **`playAudio("potriveste")`** on trial advance, on completion **`updateDoc`** on `sessions/{sessionId}` with scores and accuracy.

### Color labeling
- **`ColorLabelingTrial`**: Verbal/color labeling flow; updates **`sessions`** document on completion (see `updateDoc` usage in that component).

### Pattern / tower trials
- **`PatternReproductionTrial`**, **`PatternContinuationTrial`**, **`TowerConstructionTrial`**, **`TowerConstructionCopyTrial`**: Each receives `sessionId` and config; prompt audio via **`playAudio`** where wired; session completion updates Firestore **`sessions`**.

### Logical image association
- **`LogicalMatchingTrial`** + **`src/utils/logicalMatchingEngine.ts`**: Fixed image pairs; matching UI; **`updateDoc`** on `sessions/{sessionId}` when done.

### Receptive language & reading — session UI
- **`receptive-language.tsx`**, **`reading.tsx`**: Objective lists local to each file; configurable objectives use **`ItemSelector`** / setup drawer. **Start** creează sesiune și navighează la **`/trial`** doar pentru obiective marcate ca implementate în **`objectiveTrialAvailability.ts`**. Cardurile fără trial sunt dezactivate (**„În curând”**). Receptiv: doar **Arată obiecte comune** pornește trial dedicat (`ReceptiveShowCommonObjectsTrial`). Citire: **`receptive_letters`** folosește calea B1 cu parametri din ecran; celelalte obiective din listă sunt dezactivate până la implementare.

### Labeling (expressive)
- **`labeling.tsx`**: Objective list includes **“Numeste culori”**; creates session and routes to **`/trial`** with **`objective=numeste-culori`** (and `sessionId`, etc.). Cardurile respectă **`isLabelingObjectiveImplemented`** și stilul partajat de dezactivare (în plus față de lipsa copilului selectat).

### STT feature
- **`src/app/(dashboard)/stt-session.tsx`** → **`STTTrialScreen`** (`src/features/stt/STTTrialScreen.tsx`) with **`useTrialSession`** (`src/features/stt/useTrialSession.ts`).
- **`src/features/stt/firestore.ts`**: Creates **`sessions`** docs with fields like `studentId`, `therapistId`, `objectiveId`, `trialCount`, `status`; subcollection **`trials`** for batched trial writes. **Same top-level collection name `sessions`** as visual/receptive flows but **different field schema** — see limitations below.

### Legal / static pages
- Routes: **`gdpr.tsx`**, **`terms.tsx`**, **`privacy-policy.tsx`** (content not fully summarized here).

### Admin
- **`admin-dashboard.tsx`** → **`AdminDashboard`** screen (implementation in `src/screens/Dashboard/AdminDashboard.tsx` — not fully audited in this pass).

### PWA
- **`usePWAUpdate`**, **`PWAUpdateBanner`** in root layout; **`inject-manifest.js`** post-export; service worker registration in injected HTML.

### Misc
- **`activity_select.tsx`**: Placeholder text only (“Select Activity Configuration”).
- **`account-edit.tsx`**: Account editing (uses `auth`).

---

## 5. Key Components / Modules

| File / area | Role |
|-------------|------|
| `src/app/_layout.tsx` | Fonts, auth redirect, landscape lock (native), web zoom/gesture prevention, PWA resume hook |
| `src/app/(dashboard)/_layout.tsx` | Sidebar navigation, selected child context wiring, logout, PWA install affordance |
| `src/app/trial.tsx` | Trial type routing + B1 matching implementation (Reanimated gestures, SVG/shapes, session completion write) |
| `src/config/objectives.ts` | **`OBJECTIVES`** (ids 1–14) and **`RECEPTIVE_LANGUAGE_OBJECTIVES`** (ids 100–120); obiectivele fără categorii/`trialType` rămân în listă dar sunt **dezactivate în UI** prin `objectiveTrialAvailability` |
| `src/utils/objectiveTrialAvailability.ts` | Sursă unică: care obiective au trial în `trial.tsx` / dashboard (vizual, receptiv, etichetare, citire) |
| `src/design/objectiveCard.ts` | **`objectiveGridCardDisabledStyle`** — opacitate 0.5 pentru carduri dezactivate |
| `src/features/receptive-language/ReceptiveShowCommonObjectsTrial.tsx` | Trial receptiv „obiecte comune”; progres trial aliniat vizual cu B1 / pattern / tower |
| `src/features/b1-2d-matching/logic/generateTrials.ts` | Trial generation for B1 matching |
| `src/features/b1-2d-matching/stimuliByCategory.ts` | **`CategoryKey`** limited to colors, shapes, fruits, vegetables, animals, vehicles, food, objects |
| `src/utils/audio.ts` | **`playAudio(name)`** maps string keys to bundled MP3 assets |
| `src/contexts/SelectedChildContext.tsx` | Selected child id for dashboard and sessions (exact provider location: context folder) |

### State management
- **No Redux/Zustand** observed. State is **React `useState` / `useRef` / `useContext`** (selected child, speech recommendation, local trial state in `trial.tsx` and trial components).
- **Firestore** is the authoritative store for **children** and **sessions** (and STT **subcollection trials**).

---

## 6. UI/UX Implementation

- **Structure:** Expo Router **stack** + **dashboard layout** with **sidebar** (`(dashboard)/_layout.tsx`). Routes are file-based under `src/app`.
- **Design system:** Centralized **`Colors`**, **`Spacing`**, **`Typography`**, **`Theme`**, **`TouchTarget`** / **`rs()`** responsive scaling (`useResponsive`, `useResponsive` hook variants exist — both `src/hooks/useResponsive` and `src/utils/responsive` are referenced in the codebase).
- **Patterns:**
  - **Gradient headers** and cards (`LinearGradient`).
  - **Slide-in panels** / drawers for stimulus selection (`Animated`, `PanResponder` on visual-skills setup drawer).
  - **Modal + ItemSelector** for picking targets from categories.
  - **Tablet-first** touch sizes documented in `touch.ts`.

---

## 7. Data Flow

1. **User signs in** → Firebase Auth state in root layout.
2. **User selects child** → `SelectedChildContext` (dashboard).
3. **User starts session** (visual / receptive / reading / labeling) → **`addDoc(collection(db, "sessions"), { userId, childId, startedAt, … })`** → navigate to **`/trial`** with **`sessionId`** and params.
4. **Trial runs** → mostly **local state**; on completion, **`updateDoc(doc(db, "sessions", sessionId), { … })`** (fields differ slightly by trial type).
5. **B1 path:** `trial.tsx` reads `category`, `targets` (JSON array of ids), `distractorCount`; **`buildB1Config`** resolves stimuli from **`STIMULI_BY_CATEGORY`**; invalid/unknown category **falls back to `"colors"`** (`VALID_CATEGORIES` check).
6. **Children:** read/write **`children`** collection scoped by **`userId`** in `MainDashboard`.
7. **STT path:** `createSession` in `features/stt/firestore.ts` writes a **`sessions`** document with **different shape**; **`writeTrialsBatch`** writes to **`sessions/{id}/trials`**.

**Local storage:** Firebase Auth persistence on native uses **AsyncStorage** (`firebase.native.js`). No separate global offline cache layer was audited beyond that.

---

## 8. External Services

- **Firebase Authentication** — email/password flows in login/register.
- **Cloud Firestore** — collections observed in code: **`children`**, **`sessions`**, and subcollection **`sessions/{sessionId}/trials`** (STT). **Security rules and indexes are not in this repo** — they must be configured in Firebase console.
- **Vercel** — static hosting and build pipeline (`vercel.json`).
- **EAS** — native builds (Expo).

No third-party REST APIs were identified in the sampled paths except Firebase SDK usage.

---

## 9. Build & Deployment

### Local development
- `npm install` (implied), then **`npx expo start`** / **`npm run start`**.
- Platform: **`npm run android`**, **`npm run ios`**, **`npm run web`**.

### Web static export
- **`npm run export:web`**: `expo export --platform web` then **`node scripts/inject-manifest.js`** (output under **`dist/`** per Expo static export defaults).
- **Vercel:** `generate-version.js` → **`trim-images.js`** → **`expo export --platform web`** → **`inject-manifest.js`**; publish **`dist`**; SPA fallback rewrite to **`/index.html`**.

### Native / APK
- **`eas.json`**: **`preview`** profile sets Android **`buildType`: `apk`** for internal distribution; **`production`** with `autoIncrement`; **`development`** uses **development client**.

### Image pipeline
- **`npm run trim:images`** runs **`scripts/trim-images.js`** (used in Vercel build to optimize assets).

---

## 10. Current Limitations / Missing Pieces

1. **`OBJECTIVES` entries without `trialType` and with `categories: []`** (e.g. sort / sequence ids 2, 8–14): **În UI sunt dezactivate** (nu se pot selecta / porni); implementarea trial lipsește încă.
2. **`RECEPTIVE_LANGUAGE_OBJECTIVES` / `OBJECTIVES` in `objectives.ts`** for id 100+ are **not wired** to `receptive-language.tsx`, which uses its **own** `RECEPTIVE_OBJECTIVES` array.
3. **Receptive / reading `category` ids** (`"common"`, `"letters"`) are **not** in **`CategoryKey` / `VALID_CATEGORIES`** in `trial.tsx` → **`buildB1Config` falls back to `"colors"`**, so **started sessions may not use the intended stimulus sets** for those flows (risc rămas pentru fluxurile B1 care trec prin `trial.tsx`).
4. **Receptive / reading:** Obiectivele fără ecran dedicat **nu mai pornesc** trial din dashboard; pentru **citire**, doar **`receptive_letters`** este marcat implementat în helper — restul așteaptă implementare.
5. **`sessions` collection schema collision:** Visual sessions use **`userId` / `childId` / startedAt…**; STT uses **`studentId` / `therapistId` / status…**. Same collection name may **complicate queries and security rules** unless partitioned by field conventions or subcollections.
6. **Root `app/`** folder may confuse contributors; likely **dead** relative to `src/app`.
7. **Firebase secrets in repo** — high risk; should be treated as **known limitation** until moved to env/secrets.
8. **`activity_select`**: **Stub only**.

---

## 11. Observations & Suggestions

### Code quality
- **Strengths:** Clear separation of **trial components**; typed B1 domain (`types`, `generateTrials`); consistent **Firestore session** pattern for visual trials; **PWA** tooling is intentional and scripted.
- **Risks:** **Very large** route files (`visual-skills.tsx`, `MainDashboard.tsx`, `trial.tsx`) mix UI, animation, and data — harder to test and change. **Duplicated** session-start patterns across receptive/reading/labeling/visual could be **factored** into a small service layer.

### Improvements (non-exhaustive)
1. **Move Firebase config** to environment variables / EAS secrets; add **`.env.example`** without real keys.
2. **Align category keys** across `ItemSelector`, `stimuliByCategory`, and `trial.tsx` (`common`, `letters`, etc.) or **pass explicit `trialType`** for receptive/reading.
3. **Implement** trial-urile rămase pentru obiectivele încă „În curând” și extinde **`objectiveTrialAvailability.ts`** + ramuri în **`trial.tsx`** în același pas.
4. **Namespace or split** Firestore **`sessions`** for STT vs therapy app, or use a **`type` field** and consistent queries in `MainDashboard` export/delete.
5. **Remove or document** root **`app/`** to avoid Expo Router ambiguity.
6. Add **automated tests** for `generateTrials`, `buildB1Config`, and critical Firestore write shapes.

---

*Generated from repository analysis. For line-level behavior, refer to the cited files.*
