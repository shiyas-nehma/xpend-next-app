This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Environment Variables & Security

Copy `.env.example` to `.env.local` and fill in your values:

```
cp .env.example .env.local
```

Important notes:

- Do NOT commit `.env.local` (it is gitignored by default – verify this).
- Keep the Gemini / Google AI key server-side only. Use `GEMINI_API_KEY` (no `NEXT_PUBLIC_` prefix) and access it exclusively inside API routes or server components.
- Firebase web config values are intentionally exposed to the client (they are public identifiers), but you must enforce security via Firestore Rules and Auth.
- Remove any hard-coded fallback keys in code – they’ve been stripped from `src/lib/firebase/config.js`.

If you previously pushed real keys to a public repo:
1. Revoke the exposed keys in the Google Cloud / Firebase console.
2. Generate new keys and update `.env.local`.
3. Force-push removal is NOT enough – assume old keys are compromised.

### Minimal required variables
Refer to `.env.example` for the full list. At minimum:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
GEMINI_API_KEY=...
```

### AI Usage
The client now calls a protected server route at `/api/ai/chat` which holds the Gemini key. Don’t expose AI keys in the browser bundle.