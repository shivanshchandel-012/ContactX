import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { app } from "../app.js";
import Contact from "../models/Contact.js";
import User from "../models/User.js";

let server;
let baseUrl;
const jwtSecret = "unit-test-secret-that-is-long-enough";

before(async () => {
  process.env.JWT_SECRET = jwtSecret;
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  await mongoose.disconnect();
});

test("health reports when MongoDB is not connected", async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    status: "unavailable",
    database: "disconnected",
  });
});

test("contact routes require a JWT", async () => {
  const response = await fetch(`${baseUrl}/api/contacts`);
  assert.equal(response.status, 401);
  assert.equal((await response.json()).success, false);
});

test("registration rejects invalid data before database access", async () => {
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "A", email: "not-an-email", password: "short" }),
  });
  assert.equal(response.status, 400);
  assert.match((await response.json()).message, /Name/);
});

test("contact creation rejects invalid calendar dates before database access", async () => {
  const token = jwt.sign({ sub: new mongoose.Types.ObjectId().toString() }, jwtSecret);
  const response = await fetch(`${baseUrl}/api/contacts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name: "Test Contact", followUp: "2026-02-31" }),
  });
  assert.equal(response.status, 400);
  assert.match((await response.json()).message, /valid date/);
});

test("user and contact schemas enforce required field validation", async () => {
  const user = new User({ name: "A", email: "invalid", password: "short" });
  await assert.rejects(user.validate(), (error) => error.name === "ValidationError");

  const contact = new Contact({
    owner: new mongoose.Types.ObjectId(),
    name: " ",
    email: "invalid",
  });
  await assert.rejects(contact.validate(), (error) => error.name === "ValidationError");

  const emailIndex = Contact.schema.indexes().find(([fields]) => fields.email);
  assert.equal(emailIndex[1].unique, true);
  assert.deepEqual(emailIndex[1].partialFilterExpression.deletedAt, null);
});
