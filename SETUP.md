# MediConsulta — Setup Guide

## Prerequisites
- Node.js 18+
- PostgreSQL 14+

## 1. Database Setup

Create the database:
```sql
CREATE DATABASE mediconsulta;
```

## 2. Environment Variables

Copy `.env.example` to `.env` and fill in:
```
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/mediconsulta?schema=public"
NEXTAUTH_SECRET="your-random-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

## 3. Install & Initialize

```bash
npm install
npx prisma db push       # Creates all tables
npm run db:seed          # Seeds demo data
npm run dev              # Start development server
```

## 4. Login Credentials (Demo)

| Role | Email | Password |
|------|-------|----------|
| Médico | medico@demo.com | demo1234 |
| Recepcionista | recep@demo.com | demo1234 |

## Routes

| Path | Screen |
|------|--------|
| `/login` | Login |
| `/dashboard` | Dashboard |
| `/agenda` | Appointment calendar |
| `/pacientes` | Patient list |
| `/pacientes/nuevo` | New patient |
| `/pacientes/[id]` | Patient record |
| `/pacientes/[id]/antecedentes` | Clinical background |
| `/pacientes/[id]/nota-medica/nueva` | New medical note (SOAP) |
| `/pacientes/[id]/receta/nueva` | New prescription |
| `/configuracion` | Doctor profile |
