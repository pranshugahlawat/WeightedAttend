# WeightedAttend

A **Full Stack Weighted Attendance Tracker** built with **Next.js (App Router) + TypeScript + Prisma + PostgreSQL + NextAuth**.

Includes:
- Weekly timetable with **weighted classes**
- Subject-wise + overall attendance analytics
- Target calculator (can miss / must attend)
- Calendar view + attendance markers
- Graphs (trend line)
- Public holiday sync via **Nager.Date**
- **OCR Timetable Import** from PDF/image (USICT-style grid)
- **Profiles (Sections)** + **Lab Groups A/B/C/D** support
- Imported timetable becomes **Default** and is set **Active** automatically

---

## Tech Stack
- Next.js (App Router) + TypeScript
- PostgreSQL + Prisma
- NextAuth (Credentials)
- Tailwind CSS
- Recharts (graphs)
- FullCalendar (calendar)
- Tesseract.js + pdfjs-dist (OCR + PDF page render)
- Nager.Date API (holidays)

---

## Key Concepts
### Profiles (Sections)
Each imported timetable becomes a **Profile** (e.g., `CSE_I_SEC1`). You can manage them via **Profiles** page:
- set active
- set default
- rename
- delete

### Lab Groups
Labs in timetable often contain `GPA/GPB/GPC/GPD`:
- A = GPA
- B = GPB
- C = GPC
- D = GPD

The app filters sessions based on your selected lab group.

---

## Local Setup

### 1) Install
```bash
npm i