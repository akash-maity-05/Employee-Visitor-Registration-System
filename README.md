# Employee Visitor Registration System

A visitor register with a React frontend, a Node.js API, and MongoDB storage.

## Requirements

- Node.js 18 or newer
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

## Before publishing

- Rotate any MongoDB password that has been exposed, then update your local `backend/.env`.
- Never commit `backend/.env`; commit `.env.example` with placeholders only.
- Configure a remote repository before pushing.
