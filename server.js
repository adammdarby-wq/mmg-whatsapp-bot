// ================================================================
// Modern Montessori — WhatsApp chatbot (Meta Cloud API)
//
// Greeting -> [The School | The College]
//   School  -> pick school -> 2 PDFs -> school lead questions -> end
//   College -> pick course(s) -> MATRIC gate -> LOCATION check
//              -> send only the final recommended PDFs + blurb/redirect
//              -> college lead questions -> appointment -> end
//
// All wording, fees, questions and course data live in content.js.
// ================================================================
const express = require("express");
const fs = require("fs");
const path = require("path");
const cfg = require("./config");
const C = require("./content");

const app = express();
app.use(express.json());

// --- serve bundled PDFs ----------------------------------------
const PDF_DIR = fs.existsSync(path.join(__dirname, "pdfs")) ? path.join(__dirname, "pdfs") : __dirname;
const PDF_FILES = new Set([
  "linbro-prospectus.pdf", "linbro-application.pdf",
  "gillitts-prospectus.pdf", "gillitts-application.pdf",
  "fulltime-prospectus.pdf", "fulltime-application.pdf",
  "parttime-prospectus.pdf", "parttime-application.pdf",
  "online-prospectus.pdf", "online-application.pdf",
  "distance-prospectus.pdf", "distance-application.pdf",
]);
app.get("/pdfs/:name", (req, res) => {
  if (!PDF_FILES.has(req.params.name)) return res.sendStatus(404);
  res.type("application/pdf").sendFile(path.join(PDF_DIR, req.params.name));
});

// --- sessions ---------------------------------------------------
const sessions = new Map();
const getSession = (wa) => {
  if (!sessions.has(wa)) sessions.set(wa, { state: "NEW", data: {} });
  return sessions.get(wa);
};

// --- WhatsApp senders ------------------------------------------
async function waSend(payload) {
  const url = `https://graph.facebook.com/${cfg.GRAPH_API_VERSION}/${cfg.PHONE_NUMBER_ID}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", ...payload }),
  });
  if (!res.ok) console.error("WA send failed:", res.status, await res.text());
}
const sendText = (to, body) => waSend({ to, type: "text", text: { body } });
const sendButtons = (to, body, buttons) =>
  waSend({
    to, type: "interactive",
    interactive: {
      type: "button", body: { text: body },
      action: { buttons: buttons.map((b) => ({ type: "reply", reply: { id: b.id, title: b.title } })) },
    },
  });
const sendDocument = (to, { url, filename }) => waSend({ to, type: "document", document: { link: url, filename } });
const sendContact = (to, c) =>
  waSend({
    to,
    type: "contacts",
    contacts: [
      {
        name: { formatted_name: c.name, first_name: c.firstName },
        phones: [{ phone: c.phoneE164, type: "CELL", wa_id: c.waId }],
      },
    ],
  });

// --- lead storage ----------------------------------------------
async function saveLead({ to, sheetName, row, legacy }) {
  try {
    const csvPath = path.resolve(cfg.LEADS_CSV);
    if (!fs.existsSync(csvPath)) fs.writeFileSync(csvPath, "timestamp,sheet,whatsapp,data\n");
    const esc = (v) => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`;
    fs.appendFileSync(csvPath, [new Date().toISOString(), sheetName, to, JSON.stringify(row)].map(esc).join(",") + "\n");
  } catch (e) { console.error("CSV save failed:", e.message); }

  if (cfg.SHEETS_WEBHOOK_URL) {
    try {
      await fetch(cfg.SHEETS_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheet_name: sheetName, row, timestamp: new Date().toISOString(), whatsapp: to, ...legacy }),
      });
    } catch (e) { console.error("Sheets webhook failed:", e.message); }
  }
}

// --- Calendly booking sync -------------------------------------
// Write one row per booking to the "Bookings" tab of the Google Sheet.
async function postBooking(row) {
  if (!cfg.SHEETS_WEBHOOK_URL) return;
  try {
    await fetch(cfg.SHEETS_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sheet_name: cfg.BOOKINGS_SHEET, row, timestamp: new Date().toISOString() }),
    });
  } catch (e) { console.error("Bookings webhook failed:", e.message); }
}

// Format an ISO time in South African local time for the sheet.
function toSAST(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("en-ZA", {
      timeZone: "Africa/Johannesburg", dateStyle: "medium", timeStyle: "short",
    });
  } catch (_) { return iso; }
}

// Calendly's location object -> readable string (address / Zoom link / phone).
function fmtLocation(loc) {
  if (!loc) return "";
  if (typeof loc === "string") return loc;
  const detail = loc.location || loc.join_url || loc.additional_info || "";
  return [loc.type, detail].filter(Boolean).join(": ");
}

// ================================================================
// College decision engine — matric gate + location redirects.
// Priority: matric first, then location.
// ================================================================
const ACCREDITED = ["fulltime", "parttime", "online"];

function computeCollegeOutcome(selected, hasMatric, location) {
  const sel = C.COURSE_ORDER.filter((k) => selected.includes(k));
  const accreditedSel = sel.filter((k) => ACCREDITED.includes(k));

  const finalSet = new Set();
  const redirectTargets = new Set();
  const rawNotes = []; // {target, msg} or {msg}
  const reasons = [];

  if (!hasMatric && accreditedSel.length) {
    // Matric gate overrides everything -> Distance Learning only.
    finalSet.add("distance");
    redirectTargets.add("distance");
    rawNotes.push({ msg: C.MESSAGES.matricIneligible });
    reasons.push("No matric/equivalent → Distance Learning");
  } else {
    for (const k of sel) {
      if (k === "fulltime") {
        if (location === "durban") {
          finalSet.add("parttime"); redirectTargets.add("parttime");
          rawNotes.push({ target: "parttime", msg: C.MESSAGES.redirect_ftDurban });
          reasons.push("Full-time → Part-time (Durban)");
        } else if (location === "other") {
          finalSet.add("online"); redirectTargets.add("online");
          rawNotes.push({ target: "online", msg: C.MESSAGES.redirect_ftOther });
          reasons.push("Full-time → Online (location outside Jhb/Durban)");
        } else {
          finalSet.add("fulltime");
        }
      } else if (k === "parttime") {
        if (location === "other") {
          finalSet.add("online"); redirectTargets.add("online");
          rawNotes.push({ target: "online", msg: C.MESSAGES.redirect_ptOther });
          reasons.push("Part-time → Online (location outside Jhb/Durban)");
        } else {
          finalSet.add("parttime");
        }
      } else if (k === "online") {
        finalSet.add("online");
      } else if (k === "distance") {
        finalSet.add("distance");
      }
    }
  }

  // Dedupe redirect messages by target (avoid two "consider Online" notes).
  const seen = new Set();
  const notes = [];
  for (const n of rawNotes) {
    if (n.target) { if (seen.has(n.target)) continue; seen.add(n.target); }
    notes.push(n.msg);
  }

  const finalArr = C.COURSE_ORDER.filter((k) => finalSet.has(k));
  const keptForBlurb = finalArr.filter((k) => selected.includes(k) && !redirectTargets.has(k));

  return {
    finalArr,
    notes,
    keptForBlurb,
    originalLabel: C.humanJoin(sel.map((k) => C.COURSES[k].short)),
    finalLabel: C.humanJoin(finalArr.map((k) => C.COURSES[k].short)),
    redirectReason: reasons.join("; "),
  };
}

// --- generic question-sequence engine --------------------------
async function askNext(to) {
  const s = getSession(to);
  const cap = s.data.capture;
  while (cap.idx < cap.questions.length) {
    const q = cap.questions[cap.idx];
    if (q.skipIf && q.skipIf(cap.answers)) { cap.idx++; continue; }
    return sendText(to, q.text);
  }
  return finishCapture(to);
}

async function finishCapture(to) {
  const s = getSession(to);
  const cap = s.data.capture;
  const a = cap.answers;
  s.state = "DONE";

  if (cap.flow === "callback") {
    const row = {
      Timestamp: new Date().toISOString(), WhatsApp: to,
      Name: a.callback_name, "Call on number": a.callback_number, "Preferred time": a.callback_time,
    };
    await saveLead({
      to, sheetName: "Callback Requests", row,
      legacy: { name: a.callback_name, email: "", study_options: "Callback request" },
    });
    return sendText(to, C.MESSAGES.callbackDone);
  }

  if (cap.flow === "school") {
    const wantsAppt = isYes(a.wants_appointment);
    const bookingUrl = wantsAppt ? C.schoolBookingUrl(cap.base.school, a.child_age) : "";
    const row = {
      Timestamp: new Date().toISOString(), WhatsApp: to, School: cap.base.schoolName,
      "Parent name": a.parent_name, "Parent surname": a.parent_surname,
      "Child name": a.child_name, Gender: a.child_gender, Age: a.child_age,
      "Currently at another school": a.current_school, "Preferred start": a.start_when,
      Email: a.email, "Wants appointment": a.wants_appointment,
      "Booking link": bookingUrl,
    };
    await saveLead({
      to, sheetName: "School Leads", row,
      legacy: { name: [a.parent_name, a.parent_surname].filter(Boolean).join(" "), email: a.email, study_options: cap.base.schoolName },
    });
    if (wantsAppt) return sendText(to, C.MESSAGES.appointmentSchool.replace("{{link}}", bookingUrl));
    return sendText(to, C.MESSAGES.schoolEnd);
  }

  // college
  const wantsAppt = isYes(a.wants_appointment);
  const bookingUrl = wantsAppt ? C.collegeBookingUrl(cap.base.finalArr, a.appointment_preference) : "";
  const row = {
    Timestamp: new Date().toISOString(), WhatsApp: to,
    "Name & surname": a.name_surname, Email: a.email, Location: a.location,
    "Matric / equivalent": cap.base.matric,
    "Courses selected": cap.base.originalLabel,
    "Recommended path": cap.base.finalLabel,
    "Redirect reason": cap.base.redirectReason,
    "Funding acknowledged": a.funding_acknowledged,
    "Wants appointment": a.wants_appointment,
    "Appointment preference": a.appointment_preference || "",
    "Booking link": bookingUrl,
  };
  await saveLead({
    to, sheetName: "College Leads", row,
    legacy: { name: a.name_surname, email: a.email, study_options: cap.base.finalLabel },
  });
  if (wantsAppt) return sendText(to, C.MESSAGES.appointmentCollege.replace("{{link}}", bookingUrl));
  return sendText(to, C.MESSAGES.collegeEnd);
}

// --- journey steps ---------------------------------------------
async function sendGreeting(to) {
  const s = getSession(to);
  s.state = "MENU"; s.data = {};
  await sendButtons(to, C.MESSAGES.greeting, C.BUTTONS.greeting);
}
async function sendSchoolMenu(to) {
  getSession(to).state = "SCHOOL_SELECT";
  await sendButtons(to, C.MESSAGES.schoolMenu, C.BUTTONS.school);
}
async function sendCollegeMenu(to) {
  const s = getSession(to);
  s.state = "COLLEGE_SELECT"; s.data.college = {};
  await sendText(to, C.MESSAGES.collegeMenu);
}

async function startSchool(to, school) {
  const isLinbro = school === "linbro";
  await sendText(to, isLinbro ? C.MESSAGES.linbroThanks : C.MESSAGES.gillittsThanks);
  for (const doc of cfg.PDFS[school]) await sendDocument(to, doc);
  const schoolName = isLinbro ? "Linbro Park, Sandton, Johannesburg" : "Gillitts / Hillcrest, KZN";
  const s = getSession(to);
  s.state = "CAPTURE";
  s.data.capture = { flow: "school", questions: C.SCHOOL_QUESTIONS, idx: 0, answers: {}, base: { schoolName, school } };
  await askNext(to);
}

// --- live call / callback hand-off -----------------------------
async function offerHandoff(to) {
  await sendButtons(to, C.MESSAGES.handoffPrompt, C.BUTTONS.handoff);
}
async function sendCallNow(to) {
  await sendContact(to, C.CONTACT);
  await sendText(to, C.MESSAGES.callNow);
}
async function startCallback(to) {
  const s = getSession(to);
  s.state = "CAPTURE";
  s.data.capture = { flow: "callback", questions: C.CALLBACK_QUESTIONS, idx: 0, answers: {}, base: {} };
  await askNext(to);
}

// College: after course selection -> ask matric
async function askMatric(to) {
  getSession(to).state = "COLLEGE_MATRIC";
  await sendButtons(to, C.MESSAGES.matricPrompt, C.BUTTONS.matric);
}
async function onMatric(to, hasMatric) {
  const s = getSession(to);
  const col = s.data.college || (s.data.college = {});
  col.matric = hasMatric;
  const selected = col.selected || [];
  const accreditedSel = selected.filter((k) => ACCREDITED.includes(k));
  if (!hasMatric && accreditedSel.length) return sendCollegeOutcome(to); // Distance-only redirect
  if (hasMatric && (selected.includes("fulltime") || selected.includes("parttime"))) return askLocation(to);
  return sendCollegeOutcome(to);
}
async function askLocation(to) {
  const s = getSession(to);
  const sel = s.data.college.selected || [];
  const ft = sel.includes("fulltime"), pt = sel.includes("parttime");
  const intro = ft && pt ? C.MESSAGES.locBoth : ft ? C.MESSAGES.locFT : C.MESSAGES.locPT;
  s.state = "COLLEGE_LOCATION";
  await sendButtons(to, intro, C.BUTTONS.location);
}
async function onLocation(to, loc) {
  getSession(to).data.college.location = loc;
  return sendCollegeOutcome(to);
}

async function sendCollegeOutcome(to) {
  const s = getSession(to);
  const col = s.data.college;
  const r = computeCollegeOutcome(col.selected || [], !!col.matric, col.location);

  for (const note of r.notes) await sendText(to, note);
  if (r.keptForBlurb.length) await sendText(to, C.courseBlurb(r.keptForBlurb));
  for (const k of r.finalArr) for (const doc of cfg.PDFS[k] || []) await sendDocument(to, doc);

  // Begin college lead capture, pre-filling what we already know.
  const seed = {};
  if (col.location) seed.location = { jhb: "Johannesburg", durban: "Durban", other: "Other (outside Jhb/Durban)" }[col.location];
  s.state = "CAPTURE";
  s.data.capture = {
    flow: "college", questions: C.COLLEGE_QUESTIONS, idx: 0, answers: seed,
    base: {
      matric: col.matric ? "Yes" : "No",
      originalLabel: r.originalLabel, finalLabel: r.finalLabel, redirectReason: r.redirectReason,
      finalArr: r.finalArr,
    },
  };
  await askNext(to);
}

// --- parsers ----------------------------------------------------
function parseCourseSelection(text) {
  const nums = (text.match(/[1-4]/g) || []).map(Number);
  return [...new Set(nums)].map((n) => C.COURSE_ORDER[n - 1]).filter(Boolean);
}
const isYes = (t) => /^\s*(1|yes|y|yeah|yep)\b/i.test(t);
const isNo = (t) => /^\s*(2|no|n|nope|nah)\b/i.test(t);
function parseLocation(t) {
  if (/(^|\b)(1|joburg|johannesburg|jhb|jozi|gauteng|pretoria)\b/i.test(t)) return "jhb";
  if (/(^|\b)(2|durban|kzn|ballito|pinetown)\b/i.test(t)) return "durban";
  if (/(^|\b)(3|other|elsewhere|another)\b/i.test(t)) return "other";
  return null;
}

// --- incoming message handler ----------------------------------
async function handleMessage(msg) {
  const to = msg.from;
  const s = getSession(to);

  if (msg.type === "interactive") {
    const id = msg.interactive?.button_reply?.id;
    if (id === "school") return sendSchoolMenu(to);
    if (id === "college") return sendCollegeMenu(to);
    if (id === "school_linbro") return startSchool(to, "linbro");
    if (id === "school_gillitts") return startSchool(to, "gillitts");
    if (id === "matric_yes") return onMatric(to, true);
    if (id === "matric_no") return onMatric(to, false);
    if (id === "loc_jhb") return onLocation(to, "jhb");
    if (id === "loc_durban") return onLocation(to, "durban");
    if (id === "loc_other") return onLocation(to, "other");
    if (id === "call_now") return sendCallNow(to);
    if (id === "call_back") return startCallback(to);
    return sendGreeting(to);
  }

  if (msg.type === "text") {
    const text = (msg.text.body || "").trim();
    // "Talk to a person" can be requested at any time (except mid-callback capture).
    if (C.wantsHandoff(text) && !(s.state === "CAPTURE" && s.data.capture && s.data.capture.flow === "callback"))
      return offerHandoff(to);
    if (/^(menu|hi|hello|start|good day|info|restart)$/i.test(text) || s.state === "NEW") return sendGreeting(to);

    if (s.state === "COLLEGE_SELECT") {
      const keys = parseCourseSelection(text);
      if (!keys.length) return sendText(to, C.MESSAGES.reprompt);
      s.data.college = { selected: keys };
      return askMatric(to);
    }
    if (s.state === "COLLEGE_MATRIC") {
      if (isYes(text)) return onMatric(to, true);
      if (isNo(text)) return onMatric(to, false);
      return sendText(to, C.MESSAGES.tapReprompt);
    }
    if (s.state === "COLLEGE_LOCATION") {
      const loc = parseLocation(text);
      if (!loc) return sendText(to, C.MESSAGES.tapReprompt);
      return onLocation(to, loc);
    }
    if (s.state === "CAPTURE") {
      const cap = s.data.capture;
      cap.answers[cap.questions[cap.idx].field] = text;
      cap.idx++;
      return askNext(to);
    }
    if (s.state === "MENU") return sendText(to, C.MESSAGES.invalid);
    return sendGreeting(to);
  }

  return sendText(to, C.MESSAGES.invalid);
}

// --- webhook ----------------------------------------------------
app.get("/webhook", (req, res) => {
  const { "hub.mode": mode, "hub.verify_token": token, "hub.challenge": challenge } = req.query;
  if (mode === "subscribe" && token === cfg.VERIFY_TOKEN) return res.status(200).send(challenge);
  res.sendStatus(403);
});
app.post("/webhook", (req, res) => {
  res.sendStatus(200);
  try {
    const changes = req.body.entry?.flatMap((e) => e.changes || []) || [];
    for (const c of changes)
      for (const msg of c.value?.messages || [])
        handleMessage(msg).catch((err) => console.error("Handler error:", err));
  } catch (err) { console.error("Webhook parse error:", err); }
});
// --- Calendly webhook: completed / cancelled bookings -> sheet --
async function handleCalendlyEvent(body) {
  const evt = body?.event || "";
  const p = body?.payload || {};
  const se = p.scheduled_event || {};
  const qa = Array.isArray(p.questions_and_answers) ? p.questions_and_answers : [];
  const phone =
    p.text_reminder_number ||
    (qa.find((x) => /phone|mobile|whats|cell/i.test(x.question || "")) || {}).answer ||
    "";
  const status = evt === "invitee.canceled" || p.status === "canceled" ? "Canceled" : "Booked";

  const row = {
    Timestamp: new Date().toISOString(),
    "Booking status": status,
    Event: se.name || "",
    Invitee: p.name || [p.first_name, p.last_name].filter(Boolean).join(" "),
    Email: p.email || "",
    Phone: phone,
    "Start (SAST)": toSAST(se.start_time),
    "End (SAST)": toSAST(se.end_time),
    Location: fmtLocation(se.location),
    Timezone: p.timezone || "",
    "Reschedule URL": p.reschedule_url || "",
    "Cancel URL": p.cancel_url || "",
  };
  for (const x of qa) if (x && x.question) row[("Q: " + x.question).slice(0, 90)] = x.answer || "";

  await postBooking(row);
  console.log("Calendly booking synced:", evt, se.name, p.email);
}

app.post("/calendly", (req, res) => {
  res.sendStatus(200); // ack immediately
  try {
    if (cfg.CALENDLY_WEBHOOK_SECRET && req.query.key !== cfg.CALENDLY_WEBHOOK_SECRET) {
      return console.warn("Calendly webhook: missing/invalid key — ignored");
    }
    handleCalendlyEvent(req.body).catch((err) => console.error("Calendly handler error:", err));
  } catch (err) { console.error("Calendly webhook parse error:", err); }
});

// One-time helper to register the Calendly webhook subscription.
// Usage: set CALENDLY_PAT in your Render env, then open in a browser:
//   https://<your-app>/calendly/setup?key=<CALENDLY_WEBHOOK_SECRET>
// It creates an org-wide subscription for invitee.created/canceled pointing
// back at /calendly. Remove CALENDLY_PAT afterwards if you like.
app.get("/calendly/setup", async (req, res) => {
  if (cfg.CALENDLY_WEBHOOK_SECRET && req.query.key !== cfg.CALENDLY_WEBHOOK_SECRET)
    return res.status(403).send("Invalid or missing key.");
  const pat = process.env.CALENDLY_PAT;
  if (!pat) return res.status(400).send("Set CALENDLY_PAT in your environment first, then reload this page.");
  if (!cfg.BASE_URL) return res.status(400).send("Set BASE_URL in your environment first.");
  const CAL = "https://api.calendly.com";
  const auth = { Authorization: `Bearer ${pat}`, "Content-Type": "application/json" };
  try {
    const me = await fetch(`${CAL}/users/me`, { headers: auth }).then((r) => r.json());
    const org = me?.resource?.current_organization;
    if (!org) return res.status(502).send("Could not read your Calendly organization. Check the token.");
    const callback = `${cfg.BASE_URL}/calendly${cfg.CALENDLY_WEBHOOK_SECRET ? `?key=${encodeURIComponent(cfg.CALENDLY_WEBHOOK_SECRET)}` : ""}`;
    const r = await fetch(`${CAL}/webhook_subscriptions`, {
      method: "POST", headers: auth,
      body: JSON.stringify({ url: callback, events: ["invitee.created", "invitee.canceled"], organization: org, scope: "organization" }),
    });
    const out = await r.json();
    if (r.ok) return res.send(`<h2>✅ Calendly webhook created</h2><p>Bookings will now sync to your sheet.</p><pre>${callback}</pre>`);
    if (r.status === 409 || /already/i.test(JSON.stringify(out)))
      return res.send(`<h2>✅ Already set up</h2><p>A webhook for this URL already exists — nothing to do.</p>`);
    return res.status(502).send(`<h2>Could not create webhook</h2><pre>${JSON.stringify(out, null, 2)}</pre>`);
  } catch (err) {
    return res.status(500).send("Error: " + err.message);
  }
});

app.get("/", (_req, res) => res.send("MMG WhatsApp bot running"));

if (require.main === module) app.listen(cfg.PORT, () => console.log(`MMG WhatsApp bot listening on port ${cfg.PORT}`));

module.exports = { app, handleMessage, sessions, computeCollegeOutcome, handleCalendlyEvent };
