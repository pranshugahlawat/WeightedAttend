# WeightedAttend

Link for Demo: https://youtu.be/7KnL45FffAU

**WeightedAttend** is a full-stack **Weighted Attendance Tracker** that helps students manage attendance based on a weekly timetable where each day can have a different number of classes. It supports **section profiles**, **lab groups (A/B/C/D)**, **OCR timetable import from PDF/image**, **graphs**, **calendar view**, and **holiday sync**.

> Built for the ACM Web Team recruitment task (Full Stack – Weighted Attendance Tracker).

---

## Features

### Core (Minimum Requirements)
- Create and manage a **weekly timetable**
- Add **subjects** and scheduled classes
- Mark attendance for **individual classes**
- Show **overall attendance percentage**
- Show **subject-wise attendance statistics**

### Bonus Features
- **Weighted attendance** (labs/practicals can count more)
- **Target calculator** (classes you can miss / must attend to reach target %)
- **Calendar view** (shows scheduled classes + markers)
- **Graphs** (attendance trend)
- **Holiday sync** using **Nager.Date**
- **OCR Import** for timetable PDF/image (USICT-style grid)
- **Profiles (Sections)** + **Lab Groups A/B/C/D**
- Timetable imports become **Default** and are set **Active** automatically

---

## Tech Stack / Tools
- **Next.js (App Router)** + **TypeScript**
- **PostgreSQL** (Supabase)
- **Prisma ORM**
- **NextAuth (Credentials)** for authentication
- **Tailwind CSS** for UI
- **Tesseract.js** + **pdfjs-dist** for OCR + PDF-to-image
- **FullCalendar** for calendar view
- **Recharts** for graphs

---

## Key Concepts

### Profiles (Sections)
Each imported timetable becomes a **Profile** (example: `CSE_I_SEC1`).  
You can manage profiles in **Profiles**:
- Set active
- Set default
- Rename
- Delete (removes linked timetable entries/sessions)

### Lab Groups
Labs often appear as `GPA/GPB/GPC/GPD` in the timetable:
- **A = GPA**
- **B = GPB**
- **C = GPC**
- **D = GPD**

The app filters timetable entries and sessions based on the selected Lab Group.

---

## Environment Variables

Create a `.env` file (do NOT commit it). Minimum required variables:

```env
DATABASE_URL="YOUR_POOLER_URL_6543_WITH_SSL_AND_PGBOUNCER"
DIRECT_URL="YOUR_DIRECT_URL_5432_WITH_SSL"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="YOUR_RANDOM_SECRET"
