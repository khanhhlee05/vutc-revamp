import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseDump } from "@/scripts/migrate-legacy/parse-dump";
import { cleanDate, cleanTime, splitNeeds, transformEvent, transformLineItem } from "@/scripts/migrate-legacy/transform";

const SQL = `-- phpMyAdmin SQL Dump
INSERT INTO \`events\` (\`id\`, \`eventName\`, \`status\`, \`date\`, \`timeS\`, \`timeF\`, \`timeL\`, \`dateL\`, \`clientID\`, \`eventNeeds\`, \`email\`, \`price\`, \`submitDate\`, \`description\`) VALUES
(1, 'Formal, with \\'quotes\\' and \\\\ slash', 7, '2026-03-14', '21:00:00', '01:00:00', '17:00:00', '2026-03-14', 5, 'Wireless Microphones<br/>Uplighting<br/>', 'Pat@Villanova.edu', '350.00', '2026-02-01 10:15:00', 'Line one<br />Line two'),
(2, 'Zeroes', 1, '2026-04-01', '00:00:00', '00:00:00', '00:00:00', '0000-00-00', 0, 'N/A', 'a@b.edu', '0', '0000-00-00 00:00:00', NULL);
INSERT INTO \`work\` (\`id\`, \`eventid\`, \`price\`, \`package\`, \`amount\`, \`Description\`) VALUES
(10, 1, 175, 'Basic PA', 1, ''),
(11, 1, 30, 'Public DJ', 3, 'three hours'),
(12, 99, 5, 'Orphan', 1, '');
INSERT INTO \`other\` (\`id\`) VALUES (1);
`;

describe("parseDump", () => {
  it("parses multi-row inserts with escapes, NULL, and ignores other tables", async () => {
    const dir = mkdtempSync(join(tmpdir(), "vutc-dump-"));
    const file = join(dir, "dump.sql");
    writeFileSync(file, SQL);
    const dump = await parseDump(file, ["events", "work"]);
    const events = dump.get("events")!;
    const work = dump.get("work")!;
    expect(events).toHaveLength(2);
    expect(work).toHaveLength(3);
    expect(events[0].eventName).toBe("Formal, with 'quotes' and \\ slash");
    expect(events[1].description).toBeNull();
    expect(work[1].Description).toBe("three hours");
    expect(dump.has("other")).toBe(false);
  });
});

describe("transform helpers", () => {
  it("cleans zero dates and times", () => {
    expect(cleanDate("0000-00-00")).toBeNull();
    expect(cleanDate("2026-03-14")).toBe("2026-03-14");
    expect(cleanTime("00:00:00")).toBeNull();
    expect(cleanTime("17:30:00")).toBe("17:30");
  });

  it("splits needs on <br/> and drops N/A", () => {
    expect(splitNeeds("Wireless Microphones<br/>Uplighting<br/>")).toEqual(["Wireless Microphones", "Uplighting"]);
    expect(splitNeeds("N/A")).toEqual([]);
    expect(splitNeeds(null)).toEqual([]);
  });

  it("maps an overnight event, client link, status, and needs", () => {
    const ev = transformEvent(
      {
        id: "1", eventName: " Formal ", status: "7", date: "2026-03-14", timeS: "21:00:00", timeF: "01:00:00",
        timeL: "17:00:00", dateL: "2026-03-14", clientID: "5", eventNeeds: "Uplighting<br/>", email: "Pat@Villanova.edu",
        price: "350.00", submitDate: "2026-02-01 10:15:00", description: "a<br />b", org: "Org", name: "Pat", phone: "610",
      },
      new Map([[5, 42]]),
    );
    expect(ev.status).toBe("paid");
    expect(ev.organizationId).toBe(42);
    expect(ev.name).toBe("Formal");
    expect(ev.contactEmail).toBe("pat@villanova.edu");
    expect(ev.needs).toEqual(["Uplighting"]);
    expect(ev.description).toBe("a\nb");
    // 9 PM EDT start, 1 AM next day end
    expect(ev.startAt.toISOString()).toBe("2026-03-15T01:00:00.000Z");
    expect(ev.endAt.toISOString()).toBe("2026-03-15T05:00:00.000Z");
    expect(ev.loadInAt?.toISOString()).toBe("2026-03-14T21:00:00.000Z");
    expect(ev.publicToken.length).toBeGreaterThanOrEqual(40);
  });

  it("handles zeroed times and dates without throwing", () => {
    const ev = transformEvent(
      { id: "2", eventName: "Zeroes", status: "1", date: "2026-04-01", timeS: "00:00:00", timeF: "00:00:00", timeL: "00:00:00", dateL: "0000-00-00", clientID: "0", submitDate: "0000-00-00 00:00:00" },
      new Map(),
    );
    expect(ev.organizationId).toBeNull();
    expect(ev.loadInAt).toBeNull();
    expect(ev.endAt.getTime()).toBe(ev.startAt.getTime());
    expect(ev.submittedAt).toBeInstanceOf(Date);
  });

  it("links line items by name or alias and skips orphans", () => {
    const pkgs = new Map([["Basic PA", 1], ["DJ", 2]]);
    const byEvent = new Map([[1, 100]]);
    const aliases = { "Public DJ": "DJ" };
    expect(transformLineItem({ id: "10", eventid: "1", price: "175", package: "Basic PA", amount: "1", Description: "" }, byEvent, pkgs, aliases)).toMatchObject({ eventId: 100, packageId: 1, quantity: "1.00" });
    expect(transformLineItem({ id: "11", eventid: "1", price: "30", package: "Public DJ", amount: "3", Description: "x" }, byEvent, pkgs, aliases)).toMatchObject({ packageId: 2, name: "Public DJ", quantity: "3.00" });
    expect(transformLineItem({ id: "13", eventid: "1", price: "5", package: "Mystery", amount: "1", Description: "" }, byEvent, pkgs, aliases)).toMatchObject({ packageId: null, name: "Mystery" });
    expect(transformLineItem({ id: "12", eventid: "99", price: "5", package: "Orphan", amount: "1", Description: "" }, byEvent, pkgs, aliases)).toBeNull();
  });
});
