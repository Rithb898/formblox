# ChaiForms Hackathon — Turborepo Form Builder SaaS

> Build a production-style Typeform-style form builder SaaS using Turborepo, tRPC, Zod, and Drizzle.

---

## About

Build a production-style form builder SaaS where users can create dynamic forms, publish shareable form links, and collect responses.

**Creators** can create forms, add fields, configure validations, choose themes, publish/unpublish forms, and share links with respondents.  
**Respondents** can fill forms and submit responses without logging in.

Forms support dynamic schemas with configurable fields, validation rules, and required/optional settings.

**Core stack:** Turborepo · tRPC · Zod · Drizzle ORM · Scalar

---

## Visibility Modes

| Mode         | Description                                                                                                |
| ------------ | ---------------------------------------------------------------------------------------------------------- |
| **Public**   | Published and visible in explore pages, template galleries, featured sections. Anyone can open and submit. |
| **Unlisted** | Published but hidden from public listings. Only accessible via direct link.                                |

---

## Point Distribution

| Category                                    | Points  |
| ------------------------------------------- | ------- |
| Monorepo Structure & Starter Code Usage     | 10      |
| Authentication & Creator Access             | 10      |
| Dynamic Form Builder                        | 15      |
| Zod Schema Design & Validation              | 15      |
| Type-Safe APIs With tRPC                    | 10      |
| Database Design With Drizzle                | 10      |
| Public Form Submission & Response Ingestion | 12      |
| Analytics & Response Management             | 8       |
| Product Experience & Demo Readiness         | 7       |
| API Documentation With Scalar               | 3       |
| **Total**                                   | **100** |

---

## Functional Requirements

- User authentication and protected creator dashboard
- Create, edit, publish, unpublish, and manage forms
- Dynamic fields with validations and required/optional settings
- Multiple field types: text, email, number, select, checkbox, rating, date
- Public and unlisted form visibility modes
- Public form submission without login
- Response analytics and response management
- Email notification flow for creators/respondents
- Landing page and pricing page
- API documentation using Scalar
- Demo-ready deployment with seeded data and demo credentials

---

## Non-Functional Requirements

- Turborepo monorepo structure (frontend + backend as separate apps)
- Shared packages for schemas, types, utilities, and API clients
- Type-safe APIs using tRPC
- Validation using Zod
- Clean database schema using Drizzle ORM
- Rate limiting and basic spam protection for public APIs
- Proper visibility checks (public / unlisted / unpublished / invalid)
- Responsive and usable UI
- Proper error handling and loading states
- Structured, maintainable, scalable codebase
- Clear README with setup instructions, API docs, and demo credentials

---

## Required Field Types

- Short text
- Long text
- Email
- Number
- Single select
- Multi select
- Checkbox _(encouraged)_
- Dropdown _(encouraged)_
- Rating _(encouraged)_
- Date _(encouraged)_

---

## Bonus Features

- [ ] Form preview before publishing
- [ ] Conditional logic between questions
- [ ] Form expiry or response limit
- [ ] CSV export for responses
- [ ] Charts and analytics dashboards
- [ ] Custom form slugs
- [ ] QR code sharing
- [ ] Password-protected forms
- [ ] Public explore page for public forms
- [ ] Form templates and theme gallery
- [ ] Response filtering and pagination
- [ ] Form clone/archive support
- [ ] Multi-page form experience
- [ ] Admin dashboard
- [ ] Better UX states and polished product experience

---

## Demo Requirements

- At least **3 themed sample forms** with seeded responses and analytics
- Themes: movies, anime, games, startups, tech companies, OS, events, communities
- Demo credentials included in README
- No manual setup required for judges to review

---

## Final Submission Checklist

- [ ] Public GitHub repository
- [ ] Deployed project link
- [ ] Demo credentials
- [ ] API documentation link (Scalar)
- [ ] Proper README

---

## Rules

- Solo hackathon (team size = 1)
- Must use the provided [Turborepo starter](https://github.com/piyushgarg-dev/trpc-monorepo)
- Required stack: Turborepo · tRPC · Zod · Drizzle ORM · Scalar
- Frontend and backend both mandatory, as separate apps in the monorepo
- Real payment integration **not** required
- Broken deployments, invalid credentials, or inaccessible demos may affect evaluation
- Plagiarized or low-effort AI-generated submissions will be disqualified
