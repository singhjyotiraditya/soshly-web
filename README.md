# Soshly Web

Next.js app for Soshly: onboard with phone/Gmail, create TasteLists, host and join experiences with Soshly Coins, QR tickets, and chat.

## Stack

- **Next.js** (App Router), TypeScript, ESLint, Prettier, Tailwind CSS
- **Firebase**: Auth (Phone + Google/Gmail), Firestore, Storage
- **Google Maps**: Places API + map with pin
- **Azure OpenAI**: Experience "Generate with AI" (server API route)

## Setup

1. **Clone and install**

   ```bash
   npm install
   ```

2. **Firebase**
   - Create a project at [Firebase Console](https://console.firebase.google.com/)
   - Enable **Authentication**: Phone and Google sign-in methods
   - Create **Firestore** database
   - Enable **Storage** (for chat images and uploads)
   - In Project settings, add a web app and copy the config

3. **Environment**

   Copy `.env.example` to `.env.local` and set:
   - `NEXT_PUBLIC_FIREBASE_*` – Firebase web config
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` – Google Maps JavaScript API key
   - `AZURE_OPENAI_API_KEY` – Azure OpenAI API key (server-only, for experience generation)
   - `SESSION_SECRET` – Random string for JWT signing (10-day session cookie)

4. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` – Development server
- `npm run build` – Production build
- `npm run start` – Start production server
- `npm run lint` – ESLint
