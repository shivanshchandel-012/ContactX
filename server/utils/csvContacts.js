import { parse } from "csv-parse/sync";
import { Parser } from "@json2csv/plainjs";
import { httpError } from "../middleware/asyncHandler.js";
import { parseContactBody } from "../routes/contacts.js";

export const MAX_IMPORT_ROWS = 1000;
export const CSV_FIELDS = ["name", "email", "phone", "company", "role", "tags", "followUp", "lastContact"];

export function parseContactsCsv(buffer) {
  let records;
  try {
    records = parse(buffer, {
      bom: true,
      columns: (header) => header.map((column) => column.trim()),
      skip_empty_lines: true,
      relax_column_count: true,
      trim: true,
    });
  } catch (error) {
    throw httpError(400, `The CSV file could not be read: ${error.message}`);
  }

  if (records.length === 0) throw httpError(400, "The CSV file has no data rows.");
  if (records.length > MAX_IMPORT_ROWS) {
    throw httpError(400, `A CSV file can contain at most ${MAX_IMPORT_ROWS} rows.`);
  }
  if (!Object.hasOwn(records[0], "name")) {
    throw httpError(400, 'The CSV file must have a "name" column.');
  }

  const valid = [];
  const errors = [];
  const emailsInFile = new Set();

  records.forEach((record, index) => {
    const line = index + 2; 
    try {
      const body = { name: record.name ?? "" };
      for (const field of ["email", "phone", "company", "role", "lastContact"]) {
        if (record[field]) body[field] = record[field];
      }
      if (record.tags) body.tags = record.tags.split(/[;,]/);
      if (record.followUp) body.followUp = record.followUp;

      const values = parseContactBody(body);
      if (values.email) {
        values.email = values.email.toLowerCase();
        if (emailsInFile.has(values.email)) {
          throw httpError(400, "This email appears more than once in the file.");
        }
        emailsInFile.add(values.email);
      }
      valid.push({ line, values });
    } catch (error) {
      errors.push({ line, name: record.name || "", message: error.message });
    }
  });

  return { total: records.length, valid, errors };
}

function safeCell(value) {
  const text = String(value ?? "");
  return /^[=@\t\r]/.test(text) || /^[+-][^\d\s]/.test(text) ? `'${text}` : text;
}

export function contactsToCsv(contacts) {
  const rows = contacts.map((contact) => ({
    name: safeCell(contact.name),
    email: safeCell(contact.email),
    phone: safeCell(contact.phone),
    company: safeCell(contact.company),
    role: safeCell(contact.role),
    tags: safeCell((contact.tags ?? []).join(";")),
    followUp: contact.followUp ? new Date(contact.followUp).toISOString().slice(0, 10) : "",
    lastContact: safeCell(contact.lastContact),
  }));
  return new Parser({ fields: CSV_FIELDS, withBOM: true }).parse(rows);
}