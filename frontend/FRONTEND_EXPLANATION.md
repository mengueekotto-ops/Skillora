# ArtisanAI — Futuristic Cyber-Tech Dual Authentication Architecture

> Complete architectural and feature reference for the **Futuristic Holographic Authentication System**: **Client Cyber Portal** & **Artisan Tactical Multi-Step Workspace**.

---

## 📋 Table of Contents
- [1. Futuristic Design System & Cyber Tokens](#1-futuristic-design-system--cyber-tokens)
- [2. Screen 1: Role Selection Access Protocol Hub](#2-screen-1-role-selection-access-protocol-hub)
- [3. Screen 2: Client Cyber Authentication Portal](#3-screen-2-client-cyber-authentication-portal)
- [4. Screen 3: Artisan Tactical Multi-Step Portal](#4-screen-3-artisan-tactical-multi-step-portal)
- [5. Interactive Cyber Micro-Interactions](#5-interactive-cyber-micro-interactions)
- [6. How to Run](#6-how-to-run)

---

## 1. Futuristic Design System & Cyber Tokens

The frontend uses a high-tech cyberpunk sci-fi visual language featuring a glowing grid background, scanline overlays, ambient neon light beams, holographic glass panels with corner HUD brackets, and dynamic theme tokens.

### Theme Tokens (`styles.css`)

| Element | Client Theme (`.theme-client`) | Artisan Theme (`.theme-artisan`) |
| :--- | :--- | :--- |
| **Primary Accent** | Cyber Neon Cyan `#00f0ff` | Matrix Emerald `#00ff9d` |
| **Secondary Accent** | Electric Space Purple `#7000ff` | Neon Amber Gold `#ffb700` |
| **Glow Aura** | `0 0 30px rgba(0, 240, 255, 0.4)` | `0 0 30px rgba(0, 255, 157, 0.4)` |
| **Corner Brackets** | Cyan HUD Brackets | Emerald HUD Brackets |

---

## 2. Screen 1: Role Selection Access Protocol Hub

Presents two visually distinct holographic cards:

1. **Client Cyber Network (`CUSTOMER NETWORK`)**:
   - **Heading**: *"Client Portal"*
   - **Description**: *"Find trusted, AI-checked professionals for instant booking with neural matching & escrow security."*
   - **Features**: Natural language neural matching, holographic video intros, encrypted escrow payments.
   - **Action**: `INITIALIZE CLIENT ACCESS →`

2. **Artisan Tactical Workspace (`TACTICAL WORKSPACE`)**:
   - **Heading**: *"Artisan Portal"*
   - **Description**: *"Showcase your technical skills, complete 13-stage progressive verification, and access high-value client bookings."*
   - **Features**: Progressive AI verification badges & trust score, portfolio fraud detection, priority neural ranking.
   - **Action**: `INITIALIZE ARTISAN PROTOCOL →`

---

## 3. Screen 2: Client Cyber Authentication Portal

- **Client Login**: Ident Key / Email, Encrypted Password Key with eye toggle (`👁️`), Forgot Key alert, `AUTHENTICATE CLIENT →` action.
- **Client Sign Up**: Full Cyber ID Name, Email Address, Password with **Sci-Fi Energy Strength Gauge** (`[100%] ENCRYPTED HIGH-SECURITY KEY ✓`), `INITIALIZE CLIENT ACCOUNT →` action.
- **Cross-Role Link**: Direct jump to Artisan Workspace protocol.

---

## 4. Screen 3: Artisan Tactical Multi-Step Portal

- **Artisan Login**: Pro Identifier / Email, Password Key, `AUTHENTICATE ARTISAN DASHBOARD →` action.
- **Artisan Multi-Step Wizard**:
  - **HUD Stepper Track**: Live glowing energy line tracking progress across 3 steps.
  - **Step 1 (Credentials)**: Full Pro Name, Email, Password Key with Sci-Fi energy strength gauge.
  - **Step 2 (Trade Profile)**: Primary Trade selection (Master Electrician, Plumber, Carpenter, AC Tech, Auto Mechanic, Solar Tech), Experience, City/Region.
  - **Step 3 (Vault Uploads)**: Cyber file dropzones for National ID / Passport, Professional CV, and **Mandatory Presentation Video** with real-time AI scan simulation.

---

## 5. Interactive Cyber Micro-Interactions

1. **Scanline & Grid Backdrop**: Real-time CSS grid lines with animated blurred particle beams (`pulseGlow`).
2. **Sci-Fi Energy Gauge**: Password strength meter styled as a high-tech energy charging bar (`[0%]` to `[100%] ENCRYPTED`).
3. **AI Scan Simulation**: File dropzones display real-time status (`SCANNING & UPLOADING TO VAULT...` ➔ `✓ AI FRAUD SCAN PASSED`).
4. **Holographic Toast Alerts**: Glassmorphic toast popups logging system status (`[SYSTEM OK] BIOMETRIC VERIFIED`).

---

## 6. How to Run

1. Open [`frontend/index.html`](file:///c:/Users/PC/Desktop/My%20project/frontend/index.html) directly in any web browser.
2. Click either **INITIALIZE CLIENT ACCESS** or **INITIALIZE ARTISAN PROTOCOL**.
3. Toggle between Login & Register tabs, test the multi-step wizard, password energy gauges, and file upload dropzones.
