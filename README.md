# ExceptionAI — Real-Time Exception Resolution Workbench

> **Technical Screening Assessment**: Problem Statement 9 for Supervity Forward Deployed Engineer (FDE).

ExceptionAI is an operational exception resolution workbench built for enterprise finance and compliance teams. It pairs a real-time exception queue dashboard with an interactive, grounded AI Employee assistant, enforcing deterministic confidence thresholds, service-level auto-resolution constraints, and full human-in-command governance.

---

## 🌟 Key Features

1. **Live Flagged Exception Queue**:
   - High-density data grid displaying transaction reference, vendor, category, amount, mathematical variance %, severity rating, AI confidence score, and status badges.
   - Multi-criteria filter controls (by Status, Severity, Exception Category), real-time search, and flexible sorting.

2. **Authoritative Confidence Threshold Policy**:
   - Centralized policy engine (`ResolutionPolicyService`) enforcing auto-resolution eligibility ($\ge 90\%$), suggested resolution ($\ge 70\%$), and mandatory human review ($< 70\%$).
   - Live interactive policy configurator: adjust auto-resolution threshold in real-time (e.g. from 90% to 80%) and observe instant re-evaluation across the entire transaction queue.

3. **Service-Enforced Auto-Resolution**:
   - Backend/service-level verification (`ResolutionService.autoResolveException`). If confidence score is below threshold or if CRITICAL severity security policy applies, the operation is strictly rejected at the service layer regardless of UI state.

4. **Grounded AI Employee Assistant**:
   - Grounded explanation generator using structured transaction evidence (actual amount, expected PO baseline, calculated variance, rule triggered, vendor trust score).
   - Zero-dependency local deterministic fallback generator ensures 100% app reliability even without API keys or internet connection.
   - Optional Gemini API integration via `VITE_GEMINI_API_KEY`.

5. **Human-in-Command Action Desk**:
   - Reviewer explicitly triggers AI explanations, suggested resolution plans, auto-resolution (when eligible), manual resolution with mandatory rationale, or escalation.

6. **Immutable Audit Log System**:
   - Automatic generation of structured audit events (`AUTO_RESOLVED`, `MANUALLY_RESOLVED`, `AUTO_RESOLVE_ATTEMPTED`, `ESCALATED`, `POLICY_UPDATED`) persisted locally.

7. **Dynamic Enterprise Dashboard Metrics**:
   - Live metrics (Open Exceptions, Critical/High Severity, Resolved Count, Auto-Resolved Count, Average Queue Confidence) calculated dynamically from active state.

8. **Synthetic Seed Dataset**:
   - 8 realistic synthetic transactions covering high, medium, and low confidence levels across diverse exception types (Duplicate Invoice, High Amount Variance, Geographic Anomaly, Account Velocity Burst, Tax Code Mismatch, Unauthorized Vendor Wire).

---

## 📐 Architecture & Domain Models

```
┌─────────────────────────────────────────────────────────────┐
│                       React 19 UI                           │
│ (Header, Metrics, Exception Queue, Detail Pane, Policy Modal)│
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Application Services                     │
├──────────────────────────────┬──────────────────────────────┤
│    ResolutionService         │   ResolutionPolicyService    │
│  (State Mutation & Service   │ (Authoritative Thresholds &  │
│   Enforcement Checks)        │   Eligibility Evaluation)    │
├──────────────────────────────┼──────────────────────────────┤
│    AnalysisEngine            │   AIExplanationService       │
│  (Deterministic Variance,    │ (Grounded AI Engine with     │
│   Severity & Confidence)     │  Gemini API + Local Fallback)│
└──────────────────────────────┴──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Persistence & Audit Layer                   │
│   StorageService (localStorage)  |  AuditService (Log Stream)│
└─────────────────────────────────────────────────────────────┘
```

### Domain Data Models (`src/types/index.ts`)
- **`TransactionException`**: Strongly typed model with math variance, vendor trust score, evidence factors, severity rating, confidence score, and status.
- **`ResolutionPolicy`**: Active configurable threshold rules.
- **`AuditEvent`**: Immutable event stream record.

---

## ⚖️ Design Tradeoff: Deterministic Logic vs. LLM

> **Assessment Philosophy**:
> *"Resolution decisions are deterministic and policy-driven rather than delegated entirely to an LLM. The AI layer assists with explanation and recommendation, while the application owns the actual resolution policy."*

**Why this approach?**
1. **Safety & Auditability**: In enterprise financial systems, automatic payout or resolution decisions cannot rely on unconstrained probabilistic LLM output.
2. **Deterministic Enforcement**: The math (variance amount, percentage) and threshold governance are calculated with 100% precision by the TypeScript business service.
3. **AI Synergy**: The AI Employee adds natural language clarity, context explanation, and suggested resolution workflows, leaving final execution in human/policy command.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript 5.6+, Vite 8
- **Styling**: Tailwind CSS v4, Lucide React Icons
- **State & Storage**: React Hooks, `localStorage` Persistence Engine
- **AI Abstraction**: Grounded Deterministic Generator + Optional Google Gemini REST API

---

## 🚀 Setup & Execution Instructions

1. **Clone & Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables (Optional)**:
   Create a `.env` file in the root directory if you wish to use live Gemini API calls:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```
   *Note: If no API key is provided, ExceptionAI operates flawlessly using its built-in deterministic evidence engine.*

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

4. **Build Production Bundle**:
   ```bash
   npm run build
   ```

---

## 🧪 Evaluation Test Scenarios

1. **High Confidence Auto-Resolution ($\ge 90\%$)**:
   - Select `EXC-8092` (Duplicate Invoice, 95% Confidence).
   - Observe "Eligible for Auto-Resolution" badge & active green `Auto Resolve` button.
   - Click `Auto Resolve` $\rightarrow$ Item transitions to `RESOLVED` (Auto-Resolved), metrics update, and audit log records `AUTO_RESOLVED`.

2. **Low Confidence Protection ($< 70\%$)**:
   - Select `EXC-8094` (Geographic Anomaly, 45% Confidence).
   - Observe `Auto Resolve` button is locked with policy explanation: *"Confidence score (45%) is below threshold (90%)"*.
   - Attempting programmatic auto-resolve triggers `ResolutionService` error rejection.

3. **Dynamic Policy Adjustment**:
   - Click `Policy` in top bar. Change Auto-Resolution Threshold from 90% to 80%.
   - Observe `EXC-8091` (Acme Cloud, 85% Confidence) instantly becomes eligible for Auto-Resolution across the application.

4. **Grounded Explanation & Suggested Resolution**:
   - Select any item and click `Explain Flag Details` or `Suggest Resolution Plan` in AI Assistant.
   - Verify generated explanations reference exact numbers, variance %, and vendor trust score.

5. **Persistence**:
   - Resolve an item, reload the page, and observe that resolved state, metrics, and audit logs persist.

---

## 📝 Synthetic Data Disclaimer
All transaction numbers, vendor names, and customer records in this application are 100% synthetic mock data generated for screening purposes.
