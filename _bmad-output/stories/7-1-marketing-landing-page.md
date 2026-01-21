# Story 7.1: Marketing Landing Page

Status: done

## Story

As a potential user discovering tsucast,
I want to see a compelling landing page,
So that I understand the value and download the mobile app.

## Acceptance Criteria

1. **AC1: Landing Page Display**
   - Given visitor navigates to tsucast website
   - When landing page loads
   - Then they see hero section with value proposition
   - And feature highlights explaining the magic
   - And app store download links (iOS/Android)
   - And visual demos or screenshots of the app

2. **AC2: SEO Configuration**
   - Given landing page is indexed
   - When search engines crawl it
   - Then SEO meta tags are properly configured
   - And Open Graph tags enable social sharing previews
   - And structured data helps search visibility

3. **AC3: Mobile Responsive**
   - Given visitor is on mobile device
   - When they view the landing page
   - Then layout is responsive and mobile-friendly
   - And app store links are prominent

## Tasks / Subtasks

### Task 1: Next.js Project Setup (AC: all)
- [x] 1.1 Create `apps/web` directory in monorepo
- [x] 1.2 Initialize Next.js 15 with App Router
- [x] 1.3 Configure Tailwind CSS with Autumn Magic design tokens
- [x] 1.4 Set up TypeScript configuration
- [x] 1.5 Configure ESLint and Prettier

### Task 2: Landing Page Components (AC: 1)
- [x] 2.1 Create `components/landing/Hero.tsx` with value proposition
- [x] 2.2 Create `components/landing/Features.tsx` with feature grid
- [x] 2.3 Create `components/landing/Pricing.tsx` with plan comparison
- [x] 2.4 Create `components/landing/Footer.tsx` with links
- [x] 2.5 Create `components/landing/Header.tsx` with navigation

### Task 3: SEO & Meta Configuration (AC: 2)
- [x] 3.1 Configure meta tags in `app/layout.tsx`
- [x] 3.2 Add Open Graph tags for social sharing
- [x] 3.3 Create `app/sitemap.ts` for sitemap generation

### Task 4: Testing (AC: all)
- [x] 4.1 Create landing page component tests
- [x] 4.2 Verify responsive design
- [x] 4.3 Verify build succeeds

## Dev Notes

- Used Next.js 15.1.6 with App Router
- Tailwind CSS 4.0 with Autumn Magic color palette
- All components are server-side rendered for SEO
- Responsive design with mobile-first approach

## Story Wrap-up

- [x] All tests pass
- [x] Build succeeds
- [x] Code review complete
