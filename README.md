# Pesa Pap — Digital Lending Platform

> **Fast, Efficient Loans.** Transparent terms. Thoughtful decisions. Designed for Kenya.

Pesa Pap is a modern, responsive digital lending web platform designed to provide a straightforward, ethical, and accessible financial experience for Kenyan individuals and micro, small, and medium-sized enterprises (MSMEs).

Built on top of **TanStack Start**, **React 19**, and **Tailwind CSS v4**, this application demonstrates a complete consumer borrowing journey—from pre-assessment eligibility and interactive loan calculation to multi-step guided application and status lifecycle simulation.

---

## 🌟 Key Features

### 1. Interactive Loan Calculator & Explorer

- **Real-Time Estimations**: Responsive Radix UI slider and numeric input dynamically calculate estimated repayment figures.
- **Configurable Terms**: Explore loan amounts from **KSh 2,000** to **KSh 100,000** across 14, 30, 60, and 90-day durations.
- **Prorated Flat Rate**: Clear, transparent demonstration formula calculating monthly interest at a 5% baseline.
- **Transparent Fee Breakdown**: Highlights the KSh 100 application processing fee and marks it clearly as refundable upon successful disbursement.

### 2. Guided 4-Step Loan Application Workflow

- **Step 1: Personal Details**: Name, National ID (with 7–12 digit validation), Kenyan mobile number (`+254` / `07...` / `01...`), email, date of birth, and location.
- **Step 2: Income & Employment**: Employment status, occupation, employer or business name, monthly income, and revenue source.
- **Step 3: Loan Details**: Amount request, duration selection, loan purpose (business stock, working capital, agriculture, etc.), and repayment channel placeholders.
- **Step 4: Review & Consent**: Full breakdown and schedule with explicit consent checkboxes before submission.

### 3. Pre-Screening Eligibility Flow

- Quick pre-check collecting key applicant markers without impacting credit scores.
- Interactive outcome simulator demonstrating real-world credit assessment states:
  - _Application information received_
  - _Assessment pending_
  - _Further information required_
  - _Not currently eligible_

### 4. Application Status Lifecycle Preview

- Allows users to preview how their loan status evolves across 7 operational stages:
  - `Draft` → `Submitted` → `Under review` → `Additional information required` → `Approved` / `Declined` → `Disbursed`.

### 5. Kenyan Customer Stories

- Fictional representative profiles demonstrating realistic borrowing scenarios:
  - **Shopkeepers & Retailers**: Working capital for inventory and restocking.
  - **Farmers**: Seasonal inputs, seeds, and planting cycles.
  - **Young Professionals & Service Providers**: Equipment upgrades and planned personal milestones.

### 6. Support Center & Regulatory Disclosures

- Interactive customer support inquiry preview.
- Comprehensive accordion FAQs addressing fees, interest calculations, and assessment policies.
- In-page anchors for Privacy Notices (`#privacy`) and Loan Disclosures (`#terms`).

---

## 🏗️ Architecture & Technology Stack

| Layer                     | Technology                                                                     | Description                                                              |
| :------------------------ | :----------------------------------------------------------------------------- | :----------------------------------------------------------------------- |
| **Framework**             | [TanStack Start](https://tanstack.com/start)                                   | Full-stack server-side rendering (SSR) on Vite and Nitro                 |
| **Runtime & Core**        | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) | Modern React compiler-ready architecture with strict typing              |
| **Routing**               | [TanStack Router](https://tanstack.com/router)                                 | 100% type-safe file-based routing with automatic tree generation         |
| **Styling**               | [Tailwind CSS v4](https://tailwindcss.com/)                                    | Theme engine with OKLCH color space for light and dark modes             |
| **UI Primitives**         | [Radix UI](https://www.radix-ui.com/)                                          | Headless, accessible primitives (Slider, Select, Dialog, Checkbox, etc.) |
| **Data Fetching**         | [TanStack Query v5](https://tanstack.com/query)                                | Server-side dehydrated state and client cache management                 |
| **Icons**                 | [Lucide React](https://lucide.dev/)                                            | Clean, consistent icons optimized for financial workflows                |
| **Testing**               | [Vitest](https://vitest.dev/) + Testing Library                                | Fast unit and integration tests with jsdom                               |
| **SSR & Edge Deployment** | [Nitro](https://nitro.unjs.io/)                                                | Server engine targeting Cloudflare Workers and Node environments         |

---

## 📁 Project Structure

```
.
├── public/
│   ├── favicon.ico             # Multi-resolution Pesa Pap brand icon
│   ├── favicon.webp            # Optimized WebP Pesa Pap favicon
│   ├── logo.webp               # Optimized WebP Pesa Pap brand logo
│   └── robots.txt              # Search engine crawler policies
├── src/
│   ├── assets/                 # Portrait images & asset metadata
│   ├── components/
│   │   ├── pesapap/
│   │   │   └── site.tsx        # Pesa Pap design system, shell, header, footer, shared cards
│   │   └── ui/                 # Accessible Radix + shadcn UI component library
│   ├── hooks/
│   │   └── use-mobile.tsx      # Viewport detection hook for mobile-first behaviors
│   ├── lib/
│   │   ├── pesapap-config.ts   # Core financial parameters, validation, and calculations
│   │   ├── demo-stories.ts     # Customer testimonial profiles
│   │   ├── error-capture.ts    # Out-of-band SSR error handling & cause-chain capture
│   │   └── utils.ts            # Class name merger (`cn`) utility
│   ├── routes/
│   │   ├── __root.tsx          # Root shell layout, global metadata, font imports, error boundary
│   │   ├── index.tsx           # Home page (/)
│   │   ├── eligibility.tsx     # Eligibility pre-assessment (/eligibility)
│   │   ├── loan-now.tsx        # Preliminary loan request form (/loan-now)
│   │   ├── testimonials.tsx    # Customer demonstration stories (/testimonials)
│   │   └── contact.tsx         # Support channels, FAQs, and disclosures (/contact)
│   ├── routeTree.gen.ts        # Auto-generated TanStack route tree (do not edit manually)
│   ├── router.tsx              # Per-request router instance creator
│   ├── server.ts               # SSR entry point with Nitro / Cloudflare error recovery
│   ├── start.ts                # TanStack Start middleware (CSRF protection & error handler)
│   ├── styles.css              # Tailwind v4 theme, OKLCH color definitions & animations
│   └── test/
│       ├── app-routing.test.tsx    # Route matching integration test
│       ├── pesapap-config.test.ts  # Financial configuration unit test
│       └── setup.ts                # Test environment initialization
├── bun.lock                    # Bun package lockfile
├── package.json                # Project dependencies and script definitions
├── tsconfig.json               # TypeScript compiler options & `@/*` path mapping
└── vite.config.ts              # Vite configuration
```

---

## ⚙️ Financial & Business Logic

All lending formulas, application fees, and validation helpers are centralized in `src/lib/pesapap-config.ts` to maintain a single source of truth:

### 1. Repayment Calculation Formula

$$\text{Interest (KSh)} = \text{round}\left(\text{Principal} \times \frac{\text{Monthly Rate}}{100} \times \frac{\text{Duration (days)}}{30}\right)$$
$$\text{Total Repayment (KSh)} = \text{Principal} + \text{Interest}$$

- **Baseline Monthly Rate**: $5\%$
- **Example**: For a 30-day loan of KSh 25,000:
  $$\text{Interest} = 25{,}000 \times 0.05 \times \frac{30}{30} = 1{,}250\text{ KSh}$$
  $$\text{Total Repayment} = 26{,}250\text{ KSh}$$

### 2. Kenyan Mobile Number Validation

The regex accommodates all valid Kenyan telecommunications prefixes (Safaricom, Airtel, Telkom):

```ts
export function isKenyanMobileNumber(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("254")) return /^254[17]\d{8}$/.test(digits);
  if (digits.startsWith("0")) return /^0[17]\d{8}$/.test(digits);
  return /^[17]\d{8}$/.test(digits);
}
```

### 3. Application Processing Fee

- Configured at **KSh 100** (`APP_FEE_KES = 100`).
- Transparently documented as refundable upon successful disbursement.
- **Safety guarantee**: No live payment integration exists on this demonstration site; no user funds are ever requested or collected.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v20.x` or `v22.x+` (recommended: `22.x+`)
- **Package Manager**: `npm` or `bun`

### Installation

Clone the repository and install all dependencies:

```bash
git clone <repository-url>
cd pixel-perfect-replica-ba0bba4d
npm install
```

### Available Scripts

| Command           | Description                                                                      |
| :---------------- | :------------------------------------------------------------------------------- |
| `npm run dev`     | Launches the local Vite development server with Hot Module Replacement (HMR)     |
| `npm run build`   | Compiles both client and SSR server bundles using Vite and Nitro                 |
| `npm run preview` | Previews the production build locally                                            |
| `npm test`        | Runs the Vitest test suite (`app-routing.test.tsx` and `pesapap-config.test.ts`) |
| `npm run lint`    | Runs ESLint across the codebase                                                  |
| `npm run format`  | Formats all code using Prettier according to `.prettierrc`                       |

---

## 🛡️ Demonstration & Compliance Notice

> [!IMPORTANT]
> **Pesa Pap** is an illustrative demonstration and user experience prototype.
>
> - No actual credit assessment or lending decision is performed through this website.
> - Form submissions are processed locally in page state; personal details are neither transmitted nor stored.
> - No money, application fee, or payment of any kind is collected on this platform.
> - All loan products, amounts, interest rates, and customer testimonials are illustrative examples designed for evaluation and design review.

---

## 📄 License

Private & Confidential. All rights reserved © Pesa Pap.
