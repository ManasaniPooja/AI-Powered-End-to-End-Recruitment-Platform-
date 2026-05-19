# Recruitment Using AI — BHR1

An end-to-end AI-powered recruitment platform built with Next.js, Node.js, PostgreSQL, and Anthropic Claude API.

---

## Features

| Module | Description |
|--------|-------------|
| AI Job Description Generator | Claude API generates structured JDs from role inputs |
| Resume Screening & Ranking | Parses resumes, scores against JD using AI |
| Async Video Interview Portal | Candidates record responses via invite link |
| Video Response Auto-Evaluation | AI scores relevance, communication, behavioral fit |
| Candidate Evaluation Dashboard | View all scores, transcripts, and rankings |
| Shortlist Comparison View | Side-by-side comparison of top candidates |
| Offer Letter Generator | AI-drafted professional offer letters |
| Bias Audit Panel | Pipeline fairness analysis with anomaly flags |
| Hiring Manager Feedback | Override AI decisions, rate candidates manually |
| Multi-Channel Job Posting | Simulate posting to LinkedIn, Indeed, Naukri, Glassdoor |
| Right to Erasure API | GDPR-compliant candidate data deletion |
| Weekly Bias Reports | Scheduled auto-generation every Monday 9 AM |

---

## Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**

### Backend
- **Node.js + Express**
- **TypeScript**
- **Prisma ORM**
- **PostgreSQL**

### AI & Services
- **Anthropic Claude API** — JD generation, resume scoring, interview questions, video evaluation, offer letters
- **Cloudinary** — Video and resume file storage
- **Nodemailer + Gmail** — Interview invite emails
- **node-cron** — Weekly bias report scheduler

---

## Project Structure---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Anthropic API key
- Cloudinary account
- Gmail account (for email invites)

### 1. Clone the repository

```bash
git clone <repo-url>
cd recruitment-using-ai
```

### 2. Install dependencies

```bash
# Backend
cd services/api
npm install

# Frontend
cd ../../apps/web
npm install
```

### 3. Configure environment variables

Create `services/api/.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/recruitment
ANTHROPIC_API_KEY=your_anthropic_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
PORT=5000
```

### 4. Set up the database

```bash
cd services/api
npx prisma migrate dev
npx prisma generate
```

### 5. Run the application

```bash
# Terminal 1 — Backend
cd services/api
npm run dev

# Terminal 2 — Frontend
cd apps/web
npm run dev
```

### 6. Open in browser

| URL | Description |
|-----|-------------|
| http://localhost:3000 | Public job listings |
| http://localhost:3000/login | Hiring manager login |
| http://localhost:3000/dashboard | Manager dashboard |
| http://localhost:5000 | API server |

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |

### Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jobs/public` | List all published jobs |
| POST | `/api/jobs` | Create job (auth) |
| POST | `/api/jobs/generate-jd` | AI JD generation (auth) |

### Applications
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/applications/apply` | Submit application + resume |
| GET | `/api/applications/job/:jobId` | Get applications by job (auth) |
| DELETE | `/api/applications/candidate/:email` | Right to erasure (auth) |

### Interviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/interviews/invite` | Send video interview invite |
| POST | `/api/interviews/submit/:token` | Submit video response |
| GET | `/api/interviews/responses` | Get all responses (auth) |

### Offers
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/offers/generate` | Generate AI offer letter (auth) |

### Bias
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bias/report/:jobId` | Get bias report for job (auth) |
| POST | `/api/bias/generate/:jobId` | Generate bias report (auth) |

---

## Database Schema---

## Key AI Workflows

### Resume Screening
1. Candidate uploads resume (PDF)
2. Backend extracts text via Cloudinary
3. Claude API scores against JD — relevance, skills, experience, overall
4. Results stored in `ResumeScore` table

### Video Evaluation
1. Hiring manager sends invite link
2. Candidate records video response
3. Video uploaded to Cloudinary
4. Claude API auto-evaluates — relevance, communication, behavioral scores
5. Results stored in `VideoScore` table

### Weekly Bias Reports
- Scheduler runs every Monday at 9 AM
- Analyzes pipeline conversion rates per job
- Flags anomalies (low screening rate, score distribution issues)
- Stores in `BiasReport` table

---

## License

MIT License — Built for internship evaluation (BHR1)