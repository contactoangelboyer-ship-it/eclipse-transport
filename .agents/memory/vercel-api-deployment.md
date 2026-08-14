---
name: Vercel API deployment
description: Durable deployment constraint for the Eclipse Transport pnpm monorepo.
---

The web and API are separate Vercel projects in the same repository. The API must use its own serverless entry, build output, and artifact-level Vercel configuration; reusing the SPA project's build settings can make Vercel compile the web app for the API project or look for a nonexistent static directory.

**Why:** The API project previously built or served the wrong artifact even though the local Express server and the web deployment were healthy.

**How to apply:** When changing API deployment behavior, inspect the API project's root directory and serverless entry together with its artifact configuration, then verify both the API's direct domain and the web `/api` rewrite.

The web Vercel project owns `VITE_STRIPE_PUBLISHABLE_KEY`; the separate API Vercel project only needs `STRIPE_SECRET_KEY`. The checkout must not make the API's public-key endpoint a prerequisite for creating a PaymentIntent.

**Why:** Public-key configuration belongs at the browser build boundary, while requiring it in the API made a missing non-secret variable look like a server payment outage.

**How to apply:** Keep Stripe.js initialization in the web artifact and keep secret-key validation and amount calculation in the API artifact. Treat `/api/stripe/config` as compatibility-only.