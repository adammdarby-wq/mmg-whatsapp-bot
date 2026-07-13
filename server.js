// ================================================================
// Modern Montessori Group - WhatsApp chatbot (Meta Cloud API)
//
// Journey:
//   greeting -> [School enrolment | Teacher training]
//   enrolment -> [Linbro Park | Gillitts/Hillcrest] -> prospectus PDF
//   training  -> WhatsApp Flow (multi-select study options + lead
//               capture) -> matching prospectus PDFs -> thank you
//   Fallback (no FLOW_ID): numbered multi-select via plain text.
// ================================================================
const express = require("express");
const fs = require("fs");
const path = require("path");
const cfg = require("./config");

const app = express();
app.use(express.json());

// Serve the bundled prospectus / application PDFs so WhatsApp can fetch
// them by URL (BASE_URL/pdfs/<file>). No separate file hosting needed.
// Works whether the PDFs sit in a ./pdfs folder or next to server.js.
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
const sessions = new Map(); // waNumber -> { state, data }
const getSession = (wa) => {
  if (!sessions.has(wa)) sessions.set(wa, { state: "NEW", data: {} });
  return sessions.get(wa);
};

// ---------------------------------------------------------------
// Copy
// ---------------------------------------------------------------
const MSG = {
  greeting:
    "Thank you for contacting the Modern Montessori Group. How may we help you today?",
  schoolQuestion: "Which school are you interested in?",
  linbroThanks:
    "Thank you. Please find attached the prospectus and application form for The School of Modern Montessori, Linbro Park.",
  gillittsThanks:
    "Thank you. Please find attached the prospectus and application form for The School of Modern Montessori, Gillitts / Hillcrest.",
  studyIntro:
    "Which study options are you interested in? You may select more than one.",
  fallbackStudy:
    "Which study options are you interested in? You may select more than one.\n\n" +
    "1. Full-time\n2. Part-time\n3. Online\n4. Distance learning\n\n" +
    "Please reply with the numbers, separated by commas (e.g. 1,3).",
  leadAsk:
    "Please may we have your name and email address so that one of our course consultants can follow up?\n\n" +
    "Reply in the format: Jane Smith, jane@example.com",
  leadThanks: (name) =>
    `Thank you${name ? ", " + name.split(" ")[0] : ""}! One of our course consultants will be in touch shortly.`,
  invalid:
    "Sorry, I didn't understand that. Please use the buttons provided, or type *menu* to start again.",
};

const STUDY_OPTIONS = {
  fulltime: "Full-time",
  parttime: "Part-time",
  online: "Online",
  distance: "Distance learning",
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
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      ...payload,
    }),
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
      action: {
        buttons: buttons.map((b) => ({
          type: "reply",
          reply: { id: b.id, title: b.title }, // title max 20 chars
        })),
      },
    },
  });

const sendDocument = (to, { url, filename }, caption) =>
  waSend({
    to,
    type: "document",
    document: { link: url, filename, ...(caption ? { caption } : {}) },
  });

const sendFlow = (to) =>
  waSend({
    to,
    type: "interactive",
    interactive: {
      type: "flow",
      body: { text: MSG.studyIntro },
      action: {
        name: "flow",
        parameters: {
          flow_message_version: "3",
          flow_token: `mmg-${to}-${Date.now()}`,
          flow_id: cfg.FLOW_ID,
          flow_cta: "Choose options",
          flow_action: "navigate",
          flow_action_payload: { screen: "STUDY_OPTIONS" },
        },
      },
    },
  });

// ---------------------------------------------------------------
// Lead storage (CSV + optional Google Sheets webhook)
// ---------------------------------------------------------------
async function saveLead({ wa, name, email, options }) {
  const csvPath = path.resolve(cfg.LEADS_CSV);
  if (!fs.existsSync(csvPath))
    fs.writeFileSync(csvPath, "timestamp,whatsapp,name,email,study_options\n");
  const esc = (v) => `"${String(v || "").replace(/"/g, '""')}"`;
  fs.appendFileSync(
    csvPath,
    [new Date().toISOString(), wa, name, email, options.join("; ")]
      .map(esc)
      .join(",") + "\n"
  );
  if (cfg.SHEETS_WEBHOOK_URL) {
    try {
      await fetch(cfg.SHEETS_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          whatsapp: wa,
          name,
          email,
          study_options: options.join("; "),
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
  getSession(to).state = "MAIN_MENU";
  await sendButtons(to, MSG.greeting, [
    { id: "enrolment", title: "School enrolment" },
    { id: "training", title: "Teacher training" },
  ]);
}

async function sendSchoolMenu(to) {
  getSession(to).state = "SCHOOL_MENU";
  await sendButtons(to, MSG.schoolQuestion, [
    { id: "school_linbro", title: "Linbro Park, Sandton" },
    { id: "school_gillitts", title: "Gillitts / Hillcrest" },
  ]);
}

async function sendSchoolPack(to, school) {
  const s = getSession(to);
  s.state = "DONE";
  await sendText(to, school === "linbro" ? MSG.linbroThanks : MSG.gillittsThanks);
  for (const doc of cfg.PDFS[school]) await sendDocument(to, doc);
}

async function startTraining(to) {
  const s = getSession(to);
  if (cfg.FLOW_ID) {
    s.state = "AWAITING_FLOW";
    await sendFlow(to);
  } else {
    s.state = "STUDY_FALLBACK";
    await sendText(to, MSG.fallbackStudy);
  }
}

async function sendStudyPacks(to, optionKeys) {
  await sendText(
    to,
    "Thank you. Please find attached the prospectus" +
      (optionKeys.length > 1 ? "es" : "") +
      " for your selected study option" +
      (optionKeys.length > 1 ? "s" : "") +
      "."
  );
  for (const key of optionKeys) {
    for (const doc of cfg.PDFS[key] || []) await sendDocument(to, doc);
  }
}

// ---------------------------------------------------------------
// Incoming message handler
// ---------------------------------------------------------------
async function handleMessage(msg) {
  const to = msg.from;
  const s = getSession(to);

  // --- Interactive replies -------------------------------------
  if (msg.type === "interactive") {
    const it = msg.interactive;

    if (it.type === "button_reply") {
      const id = it.button_reply.id;
      if (id === "enrolment") return sendSchoolMenu(to);
      if (id === "training") return startTraining(to);
      if (id === "school_linbro") return sendSchoolPack(to, "linbro");
      if (id === "school_gillitts") return sendSchoolPack(to, "gillitts");
    }

    // WhatsApp Flow completion (study options + lead capture)
    if (it.type === "nfm_reply") {
      let data = {};
      try {
        data = JSON.parse(it.nfm_reply.response_json);
      } catch (e) {
        console.error("Bad flow response:", e.message);
      }
      const options = (data.study_options || []).filter(
        (k) => STUDY_OPTIONS[k]
      );
      await sendStudyPacks(to, options);
      await saveLead({
        wa: to,
        name: data.full_name || "",
        email: data.email || "",
        options: options.map((k) => STUDY_OPTIONS[k]),
      });
      s.state = "DONE";
      return sendText(to, MSG.leadThanks(data.full_name));
    }
  }

  // --- Text messages -------------------------------------------
  if (msg.type === "text") {
    const text = msg.text.body.trim();

    if (/^(menu|hi|hello|start)$/i.test(text) || s.state === "NEW")
      return sendGreeting(to);

    // Fallback multi-select: "1,3"
    if (s.state === "STUDY_FALLBACK") {
      const keys = Object.keys(STUDY_OPTIONS);
      const picked = [
        ...new Set(
          (text.match(/[1-4]/g) || []).map((n) => keys[Number(n) - 1])
        ),
      ];
      if (!picked.length) return sendText(to, MSG.fallbackStudy);
      s.data.options = picked;
      await sendStudyPacks(to, picked);
      s.state = "LEAD_CAPTURE";
      return sendText(to, MSG.leadAsk);
    }

    // Fallback lead capture: "Name, email"
    if (s.state === "LEAD_CAPTURE") {
      const emailMatch = text.match(/[^\s,]+@[^\s,]+\.[^\s,]+/);
      if (!emailMatch) return sendText(to, MSG.leadAsk);
      const email = emailMatch[0];
      const name = text
        .replace(email, "")
        .replace(/[,;]+/g, " ")
        .trim();
      await saveLead({
        wa: to,
        name,
        email,
        options: (s.data.options || []).map((k) => STUDY_OPTIONS[k]),
      });
      s.state = "DONE";
      return sendText(to, MSG.leadThanks(name));
    }

    return sendGreeting(to);
  }

  // Anything else (media, stickers, etc.)
  return sendText(to, MSG.invalid);
}

// ---------------------------------------------------------------
// Webhook endpoints
// ---------------------------------------------------------------
app.get("/webhook", (req, res) => {
  const { "hub.mode": mode, "hub.verify_token": token, "hub.challenge": challenge } = req.query;
  if (mode === "subscribe" && token === cfg.VERIFY_TOKEN)
    return res.status(200).send(challenge);
  res.sendStatus(403);
});

app.post("/webhook", (req, res) => {
  res.sendStatus(200); // ack immediately
  try {
    const changes = req.body.entry?.flatMap((e) => e.changes || []) || [];
    for (const c of changes) {
      for (const msg of c.value?.messages || []) {
        handleMessage(msg).catch((err) =>
          console.error("Handler error:", err)
        );
      }
    }
  } catch (err) {
    console.error("Webhook parse error:", err);
  }
});

app.get("/", (_req, res) => res.send("MMG WhatsApp bot running"));

if (require.main === module) {
  app.listen(cfg.PORT, () =>
    console.log(`MMG WhatsApp bot listening on port ${cfg.PORT}`)
  );
}

module.exports = { app, handleMessage, sessions, _internal: { waSend } };
