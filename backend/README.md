# Visitor Desk backend

Node.js REST API for the visitor register and receptionist profile. It stores data in MongoDB through Mongoose; no database server needs to be installed locally when using MongoDB Atlas.

## Connect MongoDB

1. Create a MongoDB database and database user. In Atlas, allow your development machine's IP address in Network Access.
2. Copy `.env.example` to `.env` in this folder.
3. Replace `MONGODB_URI` with the connection string from your MongoDB provider. Put the database name in the URI path. URL-encode special characters in the database username or password.
4. Install dependencies and start the API:

```bash
cd backend
npm install
npm run dev
```

The API starts at `http://localhost:3001` once MongoDB connects. For a production run, use `npm start`. `PORT` changes the API port, and `FRONTEND_ORIGINS` controls which browser origins can call it.

## Run the full app

Start the backend in one terminal from `backend` with `npm run dev`. In a second terminal, run `cd frontend`, `npm install`, and `npm run dev`, then open the Vite URL (normally `http://localhost:5173`). The Vite development server proxies `/api` requests to the backend on port 3001. Keep both terminals running.

Never commit `.env`; it contains the database credential. The included `.gitignore` excludes it.

## Data models

`models/Visitor.js` defines the visitor collection with the frontend fields `id`, `name`, `mobile`, `company`, `person`, `purpose`, and `date`. Visitor IDs use the `V-1234` format used by the frontend; a MongoDB counter allocates each ID atomically. Mongoose validates required fields, trims text, and indexes newest check-ins. `models/Counter.js` stores the ID sequence.

`models/Profile.js` defines the receptionist profile (`name` and `role`) as one fixed profile document. The API creates it with an empty name and `Receptionist` role on first read.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | API and MongoDB connection status |
| GET | `/api/visitors` | List visitors, newest check-in first |
| POST | `/api/visitors` | Create a visitor; requires `name`, `mobile`, `company`, `person`, and `purpose` |
| PATCH | `/api/visitors/:id` | Update one or more visitor fields |
| PUT | `/api/visitors/:id` | Update all visitor fields |
| DELETE | `/api/visitors/:id` | Delete a visitor |
| GET | `/api/profile` | Read the receptionist profile |
| PUT | `/api/profile` | Save `name` and `role` |

The old `data/store.json` file and browser `localStorage` records are not imported automatically. The frontend now reads and writes visitor and profile data through this API; create any old records again in the app if you need them in MongoDB.
