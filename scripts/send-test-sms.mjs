/**
 * One-off: send SMS via Go High Level using GHL_LOCATION_ID + GHL_API_KEY from .env.local
 * Usage: node scripts/send-test-sms.mjs "+44 7473 255886"
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnvLocal() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error("Missing .env.local");
    process.exit(1);
  }
  const env = {};
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[k] = v;
  }
  return env;
}

async function main() {
  const env = loadEnvLocal();
  const GHL_BASE = (env.GHL_API_BASE_URL || "https://services.leadconnectorhq.com").replace(/\/$/, "");
  const locationId = env.GHL_LOCATION_ID?.trim();
  const apiKey = env.GHL_API_KEY?.trim();
  const rawTo = process.argv[2]?.trim() || "+447473255886";
  const phone = rawTo.replace(/\s+/g, "");
  const message =
    process.argv[3]?.trim() ||
    "OmniWTMS test: Go High Level SMS is working.";

  if (!locationId || !apiKey) {
    console.error("Set GHL_LOCATION_ID and GHL_API_KEY in .env.local");
    process.exit(1);
  }

  async function ghlFetch(path, init = {}) {
    const url = path.startsWith("http") ? path : `${GHL_BASE}${path}`;
    return fetch(url, {
      ...init,
      method: init.method || "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Version: "2021-07-28",
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
      body: init.body,
    });
  }

  console.log("To:", phone, "| Location:", locationId);

  let contactId = null;
  const dup = await ghlFetch(
    `/contacts/search/duplicate?locationId=${encodeURIComponent(locationId)}&number=${encodeURIComponent(phone)}`
  );
  const dupText = await dup.text();
  if (dup.ok) {
    try {
      const j = JSON.parse(dupText);
      contactId = j?.contact?.id ?? null;
    } catch {
      /* ignore */
    }
  } else {
    console.log("Duplicate search:", dup.status, dupText.slice(0, 500));
  }

  if (!contactId) {
    const create = await ghlFetch("/contacts/", {
      method: "POST",
      body: JSON.stringify({
        locationId,
        phone,
        name: "Test recipient",
        tags: ["omniwtms-test"],
      }),
    });
    const ct = await create.text();
    if (!create.ok) {
      console.error("Create contact failed:", create.status, ct);
      process.exit(1);
    }
    try {
      const cj = JSON.parse(ct);
      contactId = cj?.contact?.id ?? cj?.id ?? null;
    } catch {
      console.error("Create contact bad JSON:", ct);
      process.exit(1);
    }
  }

  console.log("Contact id:", contactId);

  const msgRes = await ghlFetch("/conversations/messages", {
    method: "POST",
    body: JSON.stringify({
      type: "SMS",
      contactId,
      message,
    }),
  });
  const msgText = await msgRes.text();
  if (!msgRes.ok) {
    console.error("Send SMS failed:", msgRes.status, msgText);
    process.exit(1);
  }
  console.log("OK:", msgText.slice(0, 500));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
