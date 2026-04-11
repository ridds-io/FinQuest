
---

# 🎮 FinQuest

> AI-Powered Financial Literacy Game for Indian College Students

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)](https://www.postgresql.org/)
[![Groq](https://img.shields.io/badge/Groq-LLaMA%203.1-orange)](https://console.groq.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)](https://tailwindcss.com/)

---

## 🚀 Overview

**FinQuest** is a gamified financial literacy platform designed specifically for Indian college students.
It transforms passive financial education into an **interactive RPG-style experience**, where users learn by making real-world financial decisions.

Instead of reading theory, players:

* Make decisions in simulated financial scenarios
* See consequences instantly
* Improve through guided AI questioning

---

## 🎯 Problem Statement

Most students graduate without practical financial skills.

* High credit card misuse
* Poor budgeting habits
* Lack of understanding of investments & taxes

Traditional education:

* ❌ Passive learning
* ❌ Low engagement (5–20%)
* ❌ Near-zero behavioral impact

---

## 💡 Solution

FinQuest solves this through:

* 🎮 **Game-based learning (RPG mechanics)**
* 🤖 **AI-generated financial scenarios**
* 🧠 **Socratic AI tutor (no spoon-feeding)**
* 🇮🇳 **Indian financial context (₹, tax, loans, PPF, etc.)**
* 📊 **Decision-based learning with real consequences**

---

## ⚡ Quick Start

```bash
cp .env.example .env.local
# Add:
# GROQ_API_KEY=
# DATABASE_URL=

npm install
npm run dev
```

### Routes

* `/` → Landing Page
* `/game` → Main Game
* `/profile` → Progress & stats

---

## 🧱 Tech Stack

### TABLE II. TECHNOLOGY STACK

| Layer                | Technology                                                     |
| -------------------- | -------------------------------------------------------------- |
| **Front-End**        | React 18 (Hooks, Context API), Next.js, Tailwind CSS, Phaser 3 |
| **Back-End**         | Node.js 20 + Next.js API Routes                                |
| **Data Store**       | PostgreSQL 15 (Supabase)                                       |
| **Machine Learning** | Groq API (LLaMA 3.1)                                           |
| **Infrastructure**   | Vercel (CDN + Serverless Functions)                            |

---

## 🧩 System Architecture

### UI Layer

* React handles routing, auth, and global state
* Phaser 3 renders game world & mini-games
* Hybrid DOM + Canvas layering enables UI overlays on gameplay

---

### Dynamic Content Pipeline

* Powered by **Groq (LLaMA 3.1)**

* Uses structured prompts with:

  * Avatar financial profile
  * Player level
  * Indian economic context

* Generates:

  * Unique financial scenarios
  * Non-repetitive quests
  * Real-life decision problems

---

### 🧠 Socratic AI Tutor (Penny)

* Built using **RAG (Retrieval-Augmented Generation)**

**Pipeline:**

1. User query → embedding (HuggingFace API)
2. Retrieve relevant knowledge (PostgreSQL vector search)
3. Inject context into Groq LLaMA 3.1
4. Generate response with strict Socratic rules

**Behavior:**

* Never gives direct answers
* Asks guiding questions
* Encourages independent reasoning

---

### 🎯 Contextual Adaptation Engine

* Tracks:

  * Decision patterns
  * Mistakes
  * Time taken

* Adjusts:

  * Difficulty
  * Scenario complexity
  * Concept repetition

---

### 🎲 Scenario & Simulation Engine

* Parses JSON-based scenarios

* Evaluates decisions using:

  * EMI calculations
  * Tax rules
  * Savings logic

* Outputs:

  * Decision quality
  * Risk-adjusted outcomes

---

### 🏆 Gamification & Persistence

* XP, levels, achievements
* Dual persistence:

  * `localStorage` → fast sync
  * PostgreSQL → long-term storage

---

## 🎮 Features

### 👤 Avatars

* Scholarship Grinder
* Loan Leveraged
* Hustle Economy
* Privilege Stack
* International Wildcard

---

### 📈 Progression System

* 30 Levels
* Covers:

  * Budgeting
  * Debt
  * Investing
  * Taxation

---

### 🎮 Mini-Games

* Budget Tetris
* Compound Interest Simulator
* Market Pattern Game

---

### 🤖 AI Tutor (Penny)

* Available during gameplay
* Guides via questions
* Adapts to skill level

---

## 🔁 Learning Loop

```
1. ASSESS → initial quiz
2. IMMERSE → scenario
3. DECIDE → choose option
4. LEARN → feedback
5. PRACTICE → repetition
6. MASTER → level up
```

---

## 📊 Key Differentiators

* 🎯 Decision-based learning (not theory)
* 🧠 Socratic AI (no spoon-feeding)
* 🇮🇳 Indian financial system integration
* 🎮 Game mechanics → higher engagement
* 🔁 Adaptive difficulty

---

## 🗺️ Roadmap

### ✅ Phase 1 (Current)

* Core gameplay loop
* AI integration (Groq)
* Avatar system
* Progression system

### 🚧 Phase 2

* Leaderboards
* Guild system
* More quests
* Market data integration

### 📅 Phase 3

* Mobile version
* Institutional dashboards
* Advanced simulations

---

## 🤝 Contributing

We welcome:

* 🐛 Bug reports
* 💡 Feature ideas
* 📝 Financial scenarios
* 🎨 UI improvements

---

## 📖 Documentation

* Architecture → `docs/ARCHITECTURE.md`
* API → `docs/API.md`
* Database → `docs/DATABASE.md`

---

## 📄 License

**Copyright (c) 2026 FinQuest Team**

* Academic use allowed
* Commercial use restricted
* Contact for licensing

---

## 👥 Team

* Project Lead – AI/ML + Backend
* Frontend Developer – UI + Game
* Full Stack Developer – DB + APIs

**Institution:** Symbiosis Institute of Technology, Pune

---

## 🎯 Mission

> Make financial literacy as engaging as games and as effective as real-world experience.

---

## ⭐ Support

If you like this project:

* ⭐ Star the repo
* 🧠 Share feedback
* 🚀 Try the game

---


