 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/README.md b/README.md
index e215bc4ccf138bbc38ad58ad57e92135484b3c0f..76030906ed96bdd6f48f218795f4692d58100993 100644
--- a/README.md
+++ b/README.md
@@ -1,36 +1,60 @@
-This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).
+# Maratika Thuchi
 
-## Getting Started
+Maratika Thuchi is a Next.js 15 application that ingests bank statements, stores the raw PDFs in Supabase Storage, and builds admin tooling for transaction categorisation, user management, and financial reporting.
 
-First, run the development server:
+The app uses the Supabase service-role key exclusively from secure API route handlers; UI routes authenticate via Supabase cookies and enforce an `admin` role in the `profiles` table before allowing privileged operations.
+
+## Prerequisites
+
+- Node.js 20+
+- npm 10+
+- A Supabase project with the following resources:
+  - Auth enabled and a `profiles` table containing a `user_id` primary key and `role` column (set `role = 'admin'` for staff accounts).
+  - A `transactions` table with a unique constraint named `unique_key` so that upserts can de-duplicate rows.
+  - A public storage bucket named `statements` for storing uploaded PDF files.
+
+## Environment variables
+
+Create a `.env.local` file with the variables below. The service-role key is only consumed by server components and route handlers.
 
 ```bash
-npm run dev
-# or
-yarn dev
-# or
-pnpm dev
-# or
-bun dev
+NEXT_PUBLIC_SUPABASE_URL=...       # Supabase project URL
+NEXT_PUBLIC_SUPABASE_ANON_KEY=...  # Client anon key
+SUPABASE_SERVICE_ROLE_KEY=...      # Service role key (never expose to clients)
+NEXT_PUBLIC_ADMIN_EMAIL=...        # Optional: restrict admin area to a single email
+```
+
+## Installing dependencies
+
+```bash
+npm install
 ```
 
-Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
+## Local development
 
-You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.
+```bash
+npm run dev
+```
 
-This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.
+By default the dev server listens on [http://localhost:3000](http://localhost:3000). Sign in with a Supabase user whose `profiles.role` is `admin` to access the admin dashboard.
 
-## Learn More
+## Statement ingestion workflow
 
-To learn more about Next.js, take a look at the following resources:
+1. Upload a PDF from the **Admin → Upload Statement** screen. The server stores the PDF at `statements/<statementId>/<sanitised-file-name>.pdf` in Supabase Storage.
+2. The PDF is parsed with `pdf-parse`, transactions are normalised, and rows are upserted into the `transactions` table (duplicates are ignored via the `unique_key` constraint).
+3. Re-running the parse (`POST /api/parse`) re-downloads the stored PDF and repeats the ingestion logic, letting administrators refresh mappings after improving the parser.
 
-- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
-- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
+## Quality checks
 
-You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!
+```bash
+npm run lint   # ESLint with the Next.js TypeScript rules
+npm run build  # Production build (fails on type or lint errors)
+```
 
-## Deploy on Vercel
+These commands must succeed before merging changes. The project no longer suppresses TypeScript or ESLint errors during `next build`.
 
-The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.
+## Deployment notes
 
-Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
+- Because the application relies on Supabase Storage, ensure the `statements` bucket exists and the service role has read/write access.
+- Host environments without outbound internet access are supported—the project uses system fonts instead of downloading Google fonts at build time.
+- Configure platform secrets for all environment variables listed above; missing values will surface through the `/api/health` endpoint.
 
EOF
)
