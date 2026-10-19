import { expect, test } from "@playwright/test";

const secret = "dev-cron-secret";

test("cron endpoints reject missing or wrong bearer tokens", async ({ request }) => {
  for (const path of ["/api/cron/evening", "/api/cron/midnight"]) {
    expect((await request.get(path)).status()).toBe(401);
    expect((await request.get(path, { headers: { authorization: "Bearer nope" } })).status()).toBe(401);
  }
});

test("evening cron opens scheduled events and reports the digest", async ({ request }) => {
  const res = await request.get("/api/cron/evening", { headers: { authorization: `Bearer ${secret}` } });
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(Array.isArray(body.opened)).toBe(true);
  expect(body.digest).toMatchObject({ sent: expect.any(Number), open: expect.any(Number) });
});

test("midnight cron reports senior coverage", async ({ request }) => {
  const res = await request.get("/api/cron/midnight", { headers: { authorization: `Bearer ${secret}` } });
  expect(res.status()).toBe(200);
  expect(await res.json()).toMatchObject({ checked: expect.any(Number), short: expect.any(Number) });
});
