// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { contactService } from "../contactService";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  localStorage.setItem("contactx_token", "test-token");
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("contactService file features", () => {
  test("list sends the server-side table state and returns pagination metadata", async () => {
    const pagination = { page: 2, limit: 25, total: 31, totalPages: 2 };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ success: true, contacts: [{ id: "c1" }], pagination }),
    );

    const result = await contactService.list({
      page: 2,
      limit: 25,
      sortBy: "name,createdAt",
      order: "asc",
      search: "Riya Shah",
      company: "Acme",
      tag: "customer",
    });

    expect(fetchMock.mock.calls[0][0]).toBe(
      "/api/contacts?page=2&limit=25&sortBy=name%2CcreatedAt&order=asc&search=Riya+Shah&company=Acme&tag=customer",
    );
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer test-token");
    expect(result).toEqual({ contacts: [{ id: "c1" }], pagination });
  });

  test("listTrash sends pagination and filter state", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ success: true, contacts: [], pagination: { total: 0 } }),
    );

    await contactService.listTrash({ page: 1, limit: 10, search: "Riya" });

    expect(fetchMock.mock.calls[0][0]).toBe(
      "/api/contacts/trash?page=1&limit=10&search=Riya",
    );
  });

  test("importCsv sends the file as multipart form data with the JWT", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ success: true, total: 2, imported: 1, failed: 1, errors: [] }, 201));
    const file = new File(["name\nRiya"], "contacts.csv", { type: "text/csv" });

    const result = await contactService.importCsv(file);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/contacts/import");
    expect(options.method).toBe("POST");
    expect(options.headers.Authorization).toBe("Bearer test-token");
    expect(options.headers["Content-Type"]).toBeUndefined(); // browser sets the multipart boundary
    expect(options.body.get("file").name).toBe("contacts.csv");
    expect(result.imported).toBe(1);
  });

  test("importCsv throws the server's error message", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ success: false, message: "Only .csv files are allowed." }, 400),
    );
    await expect(contactService.importCsv(new File(["x"], "a.pdf"))).rejects.toThrow("Only .csv files are allowed.");
  });

  test("exportCsv sends the current filters and returns the file name", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("name\nRiya", {
        status: 200,
        headers: { "Content-Disposition": 'attachment; filename="contactx-favorites-2026-11-24.csv"' },
      }),
    );

    const { blob, filename } = await contactService.exportCsv({ view: "favorites", search: "riya", tag: "" });

    expect(fetchMock.mock.calls[0][0]).toBe("/api/contacts/export?view=favorites&search=riya");
    expect(filename).toBe("contactx-favorites-2026-11-24.csv");
    expect(await blob.text()).toContain("Riya");
  });

  test("uploadPhoto posts the image and returns the updated contact", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ success: true, contact: { id: "abc", photoUrl: "https://res.cloudinary.com/x.jpg" } }),
    );

    const contact = await contactService.uploadPhoto("abc", new File(["img"], "me.png", { type: "image/png" }));

    expect(fetchMock.mock.calls[0][0]).toBe("/api/contacts/abc/photo");
    expect(fetchMock.mock.calls[0][1].body.get("photo").name).toBe("me.png");
    expect(contact.photoUrl).toMatch(/cloudinary/);
  });
});