import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { app } from "../app.js";

let server;
let baseUrl;
const jwtSecret = "unit-test-secret-that-is-long-enough";
let token;

before(async () => {
  process.env.JWT_SECRET = jwtSecret;
  token = jwt.sign(
    { sub: new mongoose.Types.ObjectId().toString() },
    jwtSecret,
  );

  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  await mongoose.disconnect();
});

async function request(path, options = {}, withToken = true) {
  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...(withToken ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
}

describe("Contact management authentication", () => {
  test("favorites endpoint requires authentication", async () => {
    const response = await request("/api/contacts/favorites", {}, false);
    assert.equal(response.status, 401);
  });

  test("follow-ups endpoint requires authentication", async () => {
    const response = await request("/api/contacts/follow-ups", {}, false);
    assert.equal(response.status, 401);
  });

  test("interaction history requires authentication", async () => {
    const response = await request(
      `/api/contacts/${new mongoose.Types.ObjectId()}/interactions`,
      {},
      false,
    );
    assert.equal(response.status, 401);
  });

  test("follow-up tasks require authentication", async () => {
    const response = await request("/api/follow-ups", {}, false);
    assert.equal(response.status, 401);
  });

  test("dashboard summary requires authentication", async () => {
    const response = await request("/api/dashboard/summary", {}, false);
    assert.equal(response.status, 401);
  });
});

describe("Contact listing query validation", () => {
  test("rejects an invalid page number", async () => {
    const response = await request("/api/contacts?page=0");
    assert.equal(response.status, 400);
  });

  test("rejects an invalid sort field", async () => {
    const response = await request("/api/contacts?sortBy=password");
    assert.equal(response.status, 400);
  });

  test("rejects duplicate or unsupported multi-column sort fields", async () => {
    const duplicate = await request("/api/contacts?sortBy=name,name");
    const unsupported = await request("/api/contacts?sortBy=name,password");
    assert.equal(duplicate.status, 400);
    assert.equal(unsupported.status, 400);
  });

  test("rejects invalid sort fields for the trash view", async () => {
    const response = await request("/api/contacts/trash?sortBy=password");
    assert.equal(response.status, 400);
  });

  test("rejects invalid follow-up date ranges", async () => {
    const response = await request("/api/contacts?followUpDays=0");
    assert.equal(response.status, 400);
  });

  test("rejects an invalid sort order", async () => {
    const response = await request("/api/contacts?order=random");
    assert.equal(response.status, 400);
  });

  test("rejects an invalid favorite filter", async () => {
    const response = await request("/api/contacts?favorite=yes");
    assert.equal(response.status, 400);
  });
});

describe("Interaction and follow-up validation", () => {
  test("rejects an invalid contact ID for interaction history", async () => {
    const response = await request("/api/contacts/invalid-id/interactions");
    assert.equal(response.status, 400);
  });

  test("rejects an invalid follow-up task ID", async () => {
    const response = await request("/api/follow-ups/invalid-id", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true }),
    });
    assert.equal(response.status, 400);
  });
});