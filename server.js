// ================================================================
// Modern Montessori — WhatsApp chatbot (Meta Cloud API)
//
// Conversation:
//   greeting -> [The School | The College]
//   School  -> [Linbro Park | Gillitts/Hillcrest] -> 2 PDFs
//              -> school lead questions -> end
//   College -> multi-select courses (reply "1,3") -> PDFs for each
//              -> combined blurb -> college lead questions
//              -> appointment preference -> end
//
// All wording, fees, questions and course data live in content.js.
// This file is the LOGIC only and rarely needs to change.
// ================================================================
const express = require("express");
const fs = require("fs");
const path = require("path");
const cfg = require("./config");
const C = require("./content");

const app = express();
app.use(express.json());

// Serve the bundled prospectus / application PDFs so WhatsApp can fetch
// them by URL (BASE_URL/pdfs/<file>). Works whether the PDFs sit in a
// ./pdfs folder or next to server.js.
const PDF_DIR = fs.existsSync(path.join(__dirname, "pdfs"))
  ? path.join(__dirname, "pdfs")
  : __dirname;
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

// ---------------------------------------------------------------
// Conversation state (in-memory; swap for Redis in production)
// ---------------------------------------------------------------
const sessions = new Map();
const getSession = (wa) => {
  if (!sessions.has(wa)) sessions.set(wa, { state: "NEW", data: {} });
  return sessions.get(wa);
};

// ---------------------------------------------------------------
// WhatsApp Cloud API senders
// ---------------------------------------------------------------
async function waSend(payload) {
  const url = `https://graph.facebook.com/${cfg.GRAPH_API_VERSION}/${cfg.PHONE_NUMBER_ID}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", ...payload }),
  });
  if (!res.ok) console.error("WA send failed:", res.status, await res.text());
}

const sendText = (to, body) => waSend({ to, type: "text", text: { body } });

const sendButtons = (to, body, buttons) =>
  waSend({
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: body },
      action: { buttons: buttons.map((b) => ({ type: "reply", reply: { id: b.id, title: b.title } })) },
    },
  });

const sendDocument = (to, { url, filename }) =>
  waSend({ to, type: "document", document: { link: url, filename } });

// ---------------------------------------------------------------
// Lead storage (Google Sheet webhook + CSV backup)
// ---------------------------------------------------------------
async function saveLead({ to, sheetName, row, legacy }) {
  // CSV backup (ephemeral on free hosting; the Google Sheet is the durable store)
  try {
    const csvPath = path.resolve(cfg.LEADS_CSV);
    if (!fs.existsSync(csvPath)) fs.writeFileSync(csvPath, "timestamp,sheet,whatsapp,data\n");
    const esc = (v) => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`;
    fs.appendFileSync(
      csvPath,
      [new Date().toISOString(), sheetName, to, JSON.stringify(row)].map(esc).join(",") + "\n"
    );
  } catch (e) {
    console.error("CSV save failed:", e.message);
  }

  if (cfg.SHEETS_WEBHOOK_URL) {
    try {
      await fetch(cfg.SHEETS_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // `sheet_name` + `row` drive the newer multi-tab Apps Script.
        // The flat `legacy` fields keep the original 5-column script working too.
        body: JSON.stringify({
          sheet_name: sheetName,
          row,
          timestamp: new Date().toISOString(),
          whatsapp: to,
          ...legacy,
        }),
      });
    } catch (e) {
      console.error("Sheets webhook failed:", e.message);
    }
  }
}

// ---------------------------------------------------------------
// Journey steps
// ---------------------------------------------------------------
async function sendGreeting(to) {
  getSession(to).state = "MENU";
  getSession(to).data = {};
  await sendButtons(to, C.MESSAGES.greeting, C.BUTTONS.greeting);
}

async function sendSchoolMenu(to) {
  getSession(to).state = "SCHOOL_SELECT";
  await sendButtons(to, C.MESSAGES.schoolMenu, C.BUTTONS.school);
}

async function sendCollegeMenu(to) {
  getSession(to).state = "COLLEGE_SELECT";
  await sendText(to, C.MESSAGES.collegeMenu);
}

// Start a lead-capture question sequence.
async function beginCapture(to, flow, questions, base) {
  const s = getSession(to);
  s.state = "CAPTURE";
  s.data.capture = { flow, questions, idx: 0, answers: {}, base };
  await askNext(to);
}

// Ask the next (non-skipped) question, or finish the sequence.
async function askNext(to) {
  const s = getSession(to);
  const cap = s.data.capture;
  while (cap.idx < cap.questions.length) {
    const q = cap.questions[cap.idx];
    if (q.skipIf && q.skipIf(cap.answers)) {
      cap.idx++;
      continue;
    }
    return sendText(to, q.text);
  }
  return finishCapture(to);
}

async function finishCapture(to) {
  const s = getSession(to);
  const cap = s.data.capture;
  const a = cap.answers;
  s.state = "DONE";

  if (cap.flow === "school") {
    const row = {
      Timestamp: new Date().toISOString(),
      WhatsApp: to,
      School: cap.base.schoolName,
      "Child name": a.child_name,
      Gender: a.child_gender,
      Age: a.child_age,
      "Currently at another school": a.current_school,
      "Preferred start": a.start_when,
      Email: a.email,
      "Wants appointment": a.wants_appointment,
    };
    await saveLead({
      to,
      sheetName: "School Leads",
      row,
      legacy: { name: a.child_name, email: a.email, study_options: cap.base.schoolName },
    });
    return sendText(to, C.MESSAGES.schoolEnd);
  }

  // college
  const row = {
    Timestamp: new Date().toISOString(),
    WhatsApp: to,
    "Courses selected": cap.base.coursesLabel,
    Name: a.name,
    Surname: a.surname,
    Email: a.email,
    "Courses of interest": a.courses_interested,
    Location: a.location,
    "Funding acknowledged": a.funding_acknowledged,
    "Wants appointment": a.wants_appointment,
    "Appointment preference": a.appointment_preference || "",
  };
  await saveLead({
    to,
    sheetName: "College Leads",
    row,
    legacy: {
      name: [a.name, a.surname].filter(Boolean).join(" "),
      email: a.email,
      study_options: cap.base.coursesLabel,
    },
  });
  return sendText(to, C.MESSAGES.collegeEnd);
}

async function startSchool(to, school) {
  const s = getSession(to);
  const isLinbro = school === "linbro";
  await sendText(to, isLinbro ? C.MESSAGES.linbroThanks : C.MESSAGES.gillittsThanks);
  for (const doc of cfg.PDFS[school]) await sendDocument(to, doc);
  const schoolName = isLinbro
    ? "Linbro Park, Sandton, Johannesburg"
    : "Gillitts / Hillcrest, KZN";
  await beginCapture(to, "school", C.SCHOOL_QUESTIONS, { schoolName, school });
}

async function startCollege(to, keys) {
  // Send prospectus + application for every selected course.
  for (const key of keys) {
    for (const doc of cfg.PDFS[key] || []) await sendDocument(to, doc);
  }
  // One combined blurb matching the exact selection.
  await sendText(to, C.courseBlurb(keys));
  const coursesLabel = C.humanJoin(
    C.COURSE_ORDER.filter((k) => keys.includes(k)).map((k) => C.COURSES[k].short)
  );
  await beginCapture(to, "college", C.COLLEGE_QUESTIONS, { keys, coursesLabel });
}

// Parse a numbered multi-select reply like "1, 3" -> ["fulltime","online"].
function parseCourseSelection(text) {
  const nums = (text.match(/[1-4]/g) || []).map((n) => Number(n));
  const keys = [...new Set(nums)].map((n) => C.COURSE_ORDER[n - 1]).filter(Boolean);
  return keys;
}

// ---------------------------------------------------------------
// Incoming message handler
// ---------------------------------------------------------------
async function handleMessage(msg) {
  const to = msg.from;
  const s = getSession(to);

  if (msg.type === "interactive") {
    const it = msg.interactive;
    if (it.type === "button_reply") {
      const id = it.button_reply.id;
      if (id === "school") return sendSchoolMenu(to);
      if (id === "college") return sendCollegeMenu(to);
      if (id === "school_linbro") return startSchool(to, "linbro");
      if (id === "school_gillitts") return startSchool(to, "gillitts");
    }
    return sendGreeting(to);
  }

  if (msg.type === "text") {
    const text = (msg.text.body || "").trim();

    if (/^(menu|hi|hello|start|good day|info|restart)$/i.test(text) || s.state === "NEW")
      return sendGreeting(to);

    if (s.state === "COLLEGE_SELECT") {
      const keys = parseCourseSelection(text);
      if (!keys.length) return sendText(to, C.MESSAGES.reprompt);
      return startCollege(to, keys);
    }

    if (s.state === "CAPTURE") {
      const cap = s.data.capture;
      const q = cap.questions[cap.idx];
      cap.answers[q.field] = text;
      cap.idx++;
      return askNext(to);
    }

    // MENU (awaiting a button tap) or DONE / anything else
    if (s.state === "MENU") return sendText(to, C.MESSAGES.invalid);
    return sendGreeting(to);
  }

  return sendText(to, C.MESSAGES.invalid);
}

// ---------------------------------------------------------------
// Webhook endpoints
// ---------------------------------------------------------------
app.get("/webhook", (req, res) => {
  const { "hub.mode": mode, "hub.verify_token": token, "hub.challenge": challenge } = req.query;
  if (mode === "subscribe" && token === cfg.VERIFY_TOKEN) return res.status(200).send(challenge);
  res.sendStatus(403);
});

app.post("/webhook", (req, res) => {
  res.sendStatus(200);
  try {
    const changes = req.body.entry?.flatMap((e) => e.changes || []) || [];
    for (const c of changes) {
      for (const msg of c.value?.messages || []) {
        handleMessage(msg).catch((err) => console.error("Handler error:", err));
      }
    }
  } catch (err) {
    console.error("Webhook parse error:", err);
  }
});

app.get("/", (_req, res) => res.send("MMG WhatsApp bot running"));

if (require.main === module) {
  app.listen(cfg.PORT, () => console.log(`MMG WhatsApp bot listening on port ${cfg.PORT}`));
}

module.exports = { app, handleMessage, sessions };
