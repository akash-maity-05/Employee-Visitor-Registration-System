# Employee Visitor Registration System

A visitor register with a React frontend, a Node.js API, and MongoDB storage.

## Requirements

- Node.js 20.19 or newer (or 22.12 or newer), as required by the frontend build tools
- A MongoDB Atlas database (or another reachable MongoDB server)

## Configure MongoDB

1. Create a database user in MongoDB Atlas and allow your development machine's IP address in Network Access.
2. In the `backend` folder, copy `.env.example` to `.env`.
3. Put your MongoDB connection URI in `backend/.env` as `MONGODB_URI`. The example uses the database name `visitor_desk`.
4. Keep `.env` private. It is excluded from Git; never put real credentials in `.env.example`.

## Run locally

Open two PowerShell terminals from the project folder.

Backend terminal:

```powershell
cd backend
npm install
npm run dev
```

Wait for the backend to report that MongoDB connected. You can check `http://localhost:3001/api/health` for the API and database status.

Frontend terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`. Keep both terminals running while you use the app. The frontend proxies API requests to the backend on port 3001.

## Data

Visitor records and receptionist profile details are stored through the backend API in MongoDB. Existing browser `localStorage` data and `backend/data/store.json` are not imported automatically.

## Deploy a demo (Vercel + Render)

The frontend and backend are separate services. The frontend reads `VITE_API_URL` at build time; leave it unset for local development, where Vite proxies `/api` to `localhost:3001`.

1. Push this repository to GitHub.
2. In MongoDB Atlas, create a database user with only the access the app needs. Keep its connection URI private; you will enter it into Render.
3. In Render, create a **Web Service** from the GitHub repository with root directory `backend`, build command `npm ci`, and start command `npm start`. Render runs these commands relative to the selected root directory. [Render web service setup](https://render.com/docs/web-services).
4. In the Render service's environment settings, set `MONGODB_URI` to the Atlas URI and `FRONTEND_ORIGINS` temporarily to `http://localhost:5173`. Render supplies the `PORT` value. Deploy the service.
5. In the Render service dashboard, find its outbound IP ranges. Add those ranges under Atlas **Network Access**. Avoid opening Atlas to every IP address when possible. [Render explains where to find outbound IP ranges](https://render.com/docs/outbound-ip-addresses), and [Atlas documents its IP access list](https://www.mongodb.com/docs/atlas/security/ip-access-list/). Restart or redeploy the backend, then open `https://YOUR-BACKEND.onrender.com/api/health` and confirm the database is connected.
6. In Vercel, import the same GitHub repository and set the project root directory to `frontend`. Use build command `npm run build` and output directory `dist`.
7. In Vercel project environment variables, set `VITE_API_URL` to the backend base URL, for example `https://YOUR-BACKEND.onrender.com` (no trailing slash). Vite exposes `VITE_` variables to the browser, so put only the public backend URL there, never database credentials. [Vercel's Vite deployment guide](https://vercel.com/docs/frameworks/frontend/vite).
8. Deploy the frontend, copy its final URL into Render's `FRONTEND_ORIGINS`, and redeploy the backend. Test registering a visitor and reloading the page.

This project currently has no login or API authentication. Treat a public deployment as a demo with test data only; don't enter real visitor or employee personal information until access controls are added.

## Before publishing

- Rotate any MongoDB password that has been exposed, then update your local `backend/.env`.
- Never commit `backend/.env`; commit `.env.example` with placeholders only.
- Configure a remote repository before pushing.
