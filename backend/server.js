import "dotenv/config";
import { createServer } from "node:http";
import mongoose from "mongoose";
import Counter from "./models/Counter.js";
import Profile from "./models/Profile.js";
import Visitor from "./models/Visitor.js";

const port = Number(process.env.PORT) || 3001;
const mongoUri = process.env.MONGODB_URI;
const allowedOrigins = new Set(
  (process.env.FRONTEND_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173")
    .split(",")
    .map((origin) => origin.trim()),
);
const visitorFields = ["name", "mobile", "company", "person", "purpose"];
const maxBodySize = 1_000_000;

function sendJson(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

async function readJson(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body) > maxBodySize) {
      const error = new Error("Request body is too large.");
      error.status = 413;
      throw error;
    }
  }
  try {
    return body ? JSON.parse(body) : {};
  } catch {
    const error = new Error("Request body must be valid JSON.");
    error.status = 400;
    throw error;
  }
}

function validateVisitor(input, partial = false) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return "Visitor details must be a JSON object.";
  }
  for (const field of visitorFields) {
    if (partial && !(field in input)) continue;
    if (typeof input[field] !== "string") return `${field} must be a string.`;
    if (!input[field].trim()) return `${field} is required.`;
    if (input[field].length > 200) return `${field} must be 200 characters or fewer.`;
  }
  return null;
}

async function nextVisitorId() {
  const counter = await Counter.findOneAndUpdate(
    { _id: "visitor-id" },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  return `V-${String(counter.sequence).padStart(4, "0")}`;
}

function apiError(error, response) {
  if (error.status) {
    sendJson(response, error.status, { error: error.message });
    return;
  }
  if (error.name === "ValidationError" || error.name === "CastError") {
    sendJson(response, 400, { error: error.message });
    return;
  }
  if (error.code === 11000) {
    sendJson(response, 409, { error: "A visitor with this ID already exists. Please retry." });
    return;
  }
  console.error(error);
  sendJson(response, 500, { error: "Internal server error." });
}

const server = createServer(async (request, response) => {
  const origin = request.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
    response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  const path = url.pathname.replace(/\/$/, "") || "/";

  try {
    if (request.method === "GET" && path === "/api/health") {
      const connected = mongoose.connection.readyState === 1;
      sendJson(response, connected ? 200 : 503, {
        status: connected ? "ok" : "unavailable",
        database: connected ? "connected" : "disconnected",
        service: "visitor-desk-backend",
      });
      return;
    }

    const visitorRoute = path.match(/^\/api\/visitors(?:\/([^/]+))?$/);
    if (visitorRoute && request.method === "GET" && !visitorRoute[1]) {
      const visitors = await Visitor.find().sort({ date: -1 });
      sendJson(response, 200, visitors.map((visitor) => visitor.toJSON()));
      return;
    }

    if (visitorRoute && request.method === "POST" && !visitorRoute[1]) {
      const input = await readJson(request);
      const validationError = validateVisitor(input);
      if (validationError) {
        sendJson(response, 400, { error: validationError });
        return;
      }
      const visitor = await Visitor.create({
        ...Object.fromEntries(visitorFields.map((field) => [field, input[field].trim()])),
        id: await nextVisitorId(),
      });
      sendJson(response, 201, visitor.toJSON());
      return;
    }

    if (visitorRoute && visitorRoute[1]) {
      const id = decodeURIComponent(visitorRoute[1]);
      if (request.method === "PATCH" || request.method === "PUT") {
        const input = await readJson(request);
        const validationError = validateVisitor(input, request.method === "PATCH");
        if (validationError) {
          sendJson(response, 400, { error: validationError });
          return;
        }
        const changedFields = Object.fromEntries(
          visitorFields
            .filter((field) => typeof input[field] === "string")
            .map((field) => [field, input[field].trim()]),
        );
        const updated = await Visitor.findOneAndUpdate(
          { id },
          { $set: changedFields },
          { new: true, runValidators: true },
        );
        if (!updated) {
          sendJson(response, 404, { error: "Visitor not found." });
          return;
        }
        sendJson(response, 200, updated.toJSON());
        return;
      }
      if (request.method === "DELETE") {
        const deleted = await Visitor.findOneAndDelete({ id });
        if (!deleted) {
          sendJson(response, 404, { error: "Visitor not found." });
          return;
        }
        sendJson(response, 200, deleted.toJSON());
        return;
      }
    }

    if (path === "/api/profile" && request.method === "GET") {
      let profile = await Profile.findById("frontdesk-profile");
      if (!profile) profile = await Profile.create({ _id: "frontdesk-profile" });
      sendJson(response, 200, profile.toJSON());
      return;
    }

    if (path === "/api/profile" && request.method === "PUT") {
      const input = await readJson(request);
      if (
        !input ||
        typeof input.name !== "string" ||
        (input.role !== undefined && typeof input.role !== "string")
      ) {
        sendJson(response, 400, { error: "Profile name and role must be strings." });
        return;
      }
      const profile = await Profile.findByIdAndUpdate(
        "frontdesk-profile",
        {
          $set: {
            name: input.name.trim().slice(0, 200),
            role: (input.role?.trim() || "Receptionist").slice(0, 200),
          },
        },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
      );
      sendJson(response, 200, profile.toJSON());
      return;
    }

    sendJson(response, 404, { error: "API route not found." });
  } catch (error) {
    apiError(error, response);
  }
});

async function start() {
  if (!mongoUri) {
    throw new Error("MONGODB_URI is missing. Copy .env.example to .env and add your MongoDB connection string.");
  }
  await mongoose.connect(mongoUri);
  server.listen(port, () => {
    console.log(`Visitor Desk backend listening at http://localhost:${port}`);
    console.log(`MongoDB connected to database: ${mongoose.connection.name}`);
  });
}

start().catch((error) => {
  console.error(`Could not start the backend: ${error.message}`);
  process.exitCode = 1;
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, async () => {
    server.close();
    await mongoose.disconnect();
    process.exit(0);
  });
}
