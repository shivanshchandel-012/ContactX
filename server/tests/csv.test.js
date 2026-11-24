import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { app } from "../app.js";
import { contactsToCsv, parseContactsCsv } from "../utils/csvContacts.js";

// These tests stop before any database call, so they run without MongoDB.
let server;
let baseUrl;
const jwtSecret = "unit-test-secret-that-is-long-enough";
let token;

before(async () => {
  process.env.JWT_SECRET = jwtSecret;
  token = jwt.sign({ sub: new mongoose.Types.ObjectId().toString() }, jwtSecret);
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  await mongoose.disconnect();
});

function upload(path, field, content, filename, type, withToken = true) {
  const form = new FormData();
  form.append(field, new Blob([content], { type }), filename);
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: withToken ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
}

describe("CSV parsing (row-level validation)", () => {
  test("keeps valid rows and reports each invalid row with its line number", () => {
    const csv = [
      "name,email,phone,company,role,tags,followUp",
      "Riya Mehta,riya@example.com,+91 90000 00001,Example Tech,PM,client;priority,2026-12-01",
      ",nobody@example.com,,,,,",
      "Bad Email,not-an-email,,,,,",
      "Bad Date,bad.date@example.com,,,,,2026-02-31",
      "Riya Copy,RIYA@example.com,,,,,",
      "Arjun Verma,,,,,vendor,",
    ].join("\n");

    const { total, valid, errors } = parseContactsCsv(Buffer.from(csv));
    assert.equal(total, 6);
    assert.deepEqual(valid.map((row) => row.line), [2, 7]);
    assert.deepEqual(valid[0].values.tags, ["client", "priority"]);
    assert.deepEqual(
      errors.map((error) => error.line),
      [3, 4, 5, 6],
    );
    assert.match(errors[0].message, /name is required/i);
    assert.match(errors[1].message, /valid email/i);
    assert.match(errors[2].message, /valid date/i);
    assert.match(errors[3].message, /more than once/i);
  });

  test("rejects a file without a name column", () => {
    assert.throws(() => parseContactsCsv(Buffer.from("email\na@b.com")), /"name" column/);
  });

  test("rejects an empty file", () => {
    assert.throws(() => parseContactsCsv(Buffer.from("name,email\n")), /no data rows/);
  });
});

describe("CSV export formatting", () => {
  test("writes a header, joins tags and neutralises spreadsheet formulas", () => {
    const csv = contactsToCsv([
      { name: "=HYPERLINK(1)", email: "a@b.com", phone: "+91 1", tags: ["x", "y"], followUp: new Date("2026-12-01") },
    ]);
    const [header, row] = csv.replace(/^﻿/, "").split("\n");
    assert.equal(header, '"name","email","phone","company","role","tags","followUp","lastContact"');
    assert.match(row, /"'=HYPERLINK\(1\)"/);
    assert.match(row, /"\+91 1"/);
    assert.match(row, /"x;y"/);
    assert.match(row, /"2026-12-01"/);
  });
});

describe("Import, export and photo endpoints", () => {
  test("import requires a JWT", async () => {
    const response = await upload("/api/contacts/import", "file", "name\nA", "c.csv", "text/csv", false);
    assert.equal(response.status, 401);
  });

  test("import rejects a non-CSV file", async () => {
    const response = await upload("/api/contacts/import", "file", "%PDF", "c.pdf", "application/pdf");
    assert.equal(response.status, 400);
    assert.match((await response.json()).message, /Only \.csv/);
  });

  test("import rejects a file larger than 1 MB", async () => {
    const big = "name\n" + "x".repeat(1024 * 1024 + 10);
    const response = await upload("/api/contacts/import", "file", big, "big.csv", "text/csv");
    assert.equal(response.status, 413);
  });

  test("import asks for a file when none is sent", async () => {
    const response = await fetch(`${baseUrl}/api/contacts/import`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: new FormData(),
    });
    assert.equal(response.status, 400);
    assert.match((await response.json()).message, /Attach a CSV/);
  });

  test("import returns row errors before saving when every row is invalid", async () => {
    const response = await upload("/api/contacts/import", "file", "email\nx@y.com", "c.csv", "text/csv");
    assert.equal(response.status, 400);
    assert.match((await response.json()).message, /"name" column/);
  });

  test("export requires a JWT and a valid view", async () => {
    assert.equal((await fetch(`${baseUrl}/api/contacts/export`)).status, 401);
    const response = await fetch(`${baseUrl}/api/contacts/export?view=everything`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(response.status, 400);
  });

  test("photo upload rejects non-image files and invalid IDs", async () => {
    const wrongType = await upload(`/api/contacts/${new mongoose.Types.ObjectId()}/photo`, "photo", "hi", "a.txt", "text/plain");
    assert.equal(wrongType.status, 400);
    assert.match((await wrongType.json()).message, /JPG, PNG or WebP/);

    const badId = await upload("/api/contacts/123/photo", "photo", "img", "a.png", "image/png");
    assert.equal(badId.status, 400);
    assert.match((await badId.json()).message, /Invalid contact ID/);
  });

  test("photo upload reports missing Cloudinary configuration", async () => {
    delete process.env.CLOUDINARY_CLOUD_NAME;
    const response = await upload(`/api/contacts/${new mongoose.Types.ObjectId()}/photo`, "photo", "img", "a.png", "image/png");
    assert.equal(response.status, 503);
  });

  test("CORS allows only the configured frontend origin", async () => {
    process.env.CLIENT_URL = "https://contactx.vercel.app";
    const allowed = await fetch(`${baseUrl}/api/health`, { headers: { Origin: "https://contactx.vercel.app" } });
    assert.equal(allowed.headers.get("access-control-allow-origin"), "https://contactx.vercel.app");
    const blocked = await fetch(`${baseUrl}/api/health`, { headers: { Origin: "https://evil.example" } });
    assert.equal(blocked.headers.get("access-control-allow-origin"), null);
  });
});