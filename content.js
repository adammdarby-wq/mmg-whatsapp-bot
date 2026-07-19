// ================================================================
// Modern Montessori — ALL editable content lives here.
// Non-developers can safely change wording, fees, questions and
// PDF mappings in this one file without touching the bot logic.
// ================================================================

// ---------------------------------------------------------------
// 1. Top-level messages
// ---------------------------------------------------------------
const MESSAGES = {
  greeting:
    "Welcome to Modern Montessori.\n\n" +
    "Modern Montessori is comprised of two divisions:\n\n" +
    "*The School of Modern Montessori* — we have two schools: one in Linbro Park, Sandton, Johannesburg, and one in Gillitts / Hillcrest, KZN.\n\n" +
    "*The College of Modern Montessori* — a Montessori teacher training organisation.\n\n" +
    "Which would you like more information on?",

  schoolMenu:
    "Thank you for your interest in The School of Modern Montessori.\n\n" +
    "Which school would you like more information about?\n\n" +
    "1. Linbro Park, Sandton, Johannesburg\n" +
    "2. Gillitts / Hillcrest, KZN",

  linbroThanks:
    "Thank you for the interest you have shown in The School of Modern Montessori, Linbro Park.\n\n" +
    "We recommend that you make an appointment to see our beautiful school. In order for us to assist you further, please answer the following questions.",

  gillittsThanks:
    "Thank you for the interest you have shown in The School of Modern Montessori, Gillitts / Hillcrest.\n\n" +
    "We recommend that you make an appointment to see our beautiful school. In order for us to assist you further, please answer the following questions.",

  schoolEnd:
    "Thank you. Your information has been received.\n\n" +
    "A member of our admissions team will be in touch with you to assist further and, where applicable, arrange an appointment for you to visit the school.\n\n" +
    "If you'd prefer to speak to someone now, just reply *CALL* at any time.",

  collegeMenu:
    "Thank you for your interest in The College of Modern Montessori.\n\n" +
    "Please select the course option or options that you would like more information on. " +
    "Reply with the number(s), separated by commas (for example: 1,3).\n\n" +
    "1. Full-time Montessori Teacher Training\n" +
    "2. Part-time Montessori Teacher Training\n" +
    "3. Online Montessori Teacher Training\n" +
    "4. Distance Learning Montessori Course",

  // Matric / equivalent gate (asked before any course info is sent)
  matricPrompt: "Do you have matric or an equivalent qualification?",
  matricIneligible:
    "Regrettably, matric or an equivalent qualification is a requirement for entry onto the Full-time, Part-time and Online courses.\n\n" +
    "That said, matric is not a requirement for the Distance Learning course. Distance Learning is a non-accredited course, can be started at any time, and allows up to three years for completion with tutor support.\n\n" +
    "I will send you the Distance Learning information now.",

  // Location prompts (only asked when Full-time and/or Part-time are chosen)
  locFT: "The Full-time course takes place in Johannesburg only. Where do you live?",
  locPT: "The Part-time course is offered in Johannesburg and Durban only. Where do you live?",
  locBoth:
    "The Full-time course is offered in Johannesburg only, and the Part-time course in Johannesburg and Durban only. Where do you live?",

  // Location-based redirect messages
  redirect_ftDurban:
    "The Full-time course takes place in Johannesburg only.\n\n" +
    "As you live in Durban, you may wish to consider the Part-time course, which is offered in Durban and Johannesburg.\n\n" +
    "I will send you the Part-time course information now.",
  redirect_ftOther:
    "The Full-time course takes place in Johannesburg only.\n\n" +
    "If you live in Durban, you may be able to do the Part-time course. If you live outside of Johannesburg and Durban, we suggest that you consider the Online course.\n\n" +
    "I will send you the Online course information now.",
  redirect_ptOther:
    "The Part-time course is a face-to-face course offered in Johannesburg and Durban only.\n\n" +
    "If you live outside of these areas, we suggest that you consider the Online course. The Online course is an accredited one-year course with live evening lectures and compulsory face-to-face/practicum attendance in either Johannesburg or Cape Town.\n\n" +
    "I will send you the Online course information now.",

  collegeEnd:
    "Thank you. Your information has been received.\n\n" +
    "A member of our course advisory team will be in touch with you to answer your questions and, where applicable, arrange an appointment either in person, online or telephonically.\n\n" +
    "We look forward to assisting you on your Montessori journey.\n\n" +
    "If you'd prefer to speak to someone now, just reply *CALL* at any time.",

  // Sent when the person has said YES to booking. {{link}} is replaced with
  // the correct Calendly link for their branch / age group / course.
  appointmentSchool:
    "Wonderful! You can book your visit to the school here:\n\n{{link}}\n\n" +
    "Just choose any time that suits you and you'll receive a confirmation with all the details. We look forward to welcoming you.",
  appointmentCollege:
    "Wonderful! You can book your appointment here:\n\n{{link}}\n\n" +
    "Just choose any time that suits you and you'll receive a confirmation with all the details. We look forward to assisting you on your Montessori journey.",

  invalid: "Sorry, I didn't quite catch that. Please reply using the options provided, or type *menu* to start again.",
  reprompt: "Please reply with the number(s) of the option(s) you'd like, separated by commas (for example: 1,3).",
  tapReprompt: "Please tap one of the buttons above to continue.",

  // --- Live call / callback hand-off ---
  handoffPrompt:
    "Of course — we'd be glad to speak with you. How would you like to connect?",
  callNow:
    "Here are our contact details — tap the card above and choose *Call* to reach us right away (over your own network, or as a WhatsApp call). We look forward to speaking with you.",
  callbackDone:
    "Thank you. We've logged your callback request and a member of our team will call you at the time you requested.",
};

// ---------------------------------------------------------------
// 2. Buttons (WhatsApp titles must be <= 20 characters)
// ---------------------------------------------------------------
const BUTTONS = {
  greeting: [
    { id: "school", title: "The School" },
    { id: "college", title: "The College" },
  ],
  school: [
    { id: "school_linbro", title: "Linbro Park" },
    { id: "school_gillitts", title: "Gillitts / Hillcrest" },
  ],
  matric: [
    { id: "matric_yes", title: "Yes" },
    { id: "matric_no", title: "No" },
  ],
  location: [
    { id: "loc_jhb", title: "Johannesburg" },
    { id: "loc_durban", title: "Durban" },
    { id: "loc_other", title: "Other" },
  ],
  handoff: [
    { id: "call_now", title: "Call now" },
    { id: "call_back", title: "Request callback" },
  ],
};

// ---------------------------------------------------------------
// Contact details used for the live-call hand-off (edit here).
// phoneE164 / waId must be digits only (waId without the +).
// ---------------------------------------------------------------
const CONTACT = {
  name: "Modern Montessori (Adam)",
  firstName: "Adam",
  display: "+27 82 896 6162",
  phoneE164: "+27828966162",
  waId: "27828966162",
};

// Whole-word / phrase triggers for "I'd like to speak to a person".
const HANDOFF_RE =
  /(call me|call back|call you|phone me|phone you|speak to (someone|a|an|you)|talk to (someone|a|an|you)|speak with|a real person|a human|an agent|live agent|customer service|help ?desk|can i call|want to (call|speak|talk)|your (phone )?number|contact number)/i;

function wantsHandoff(text) {
  const t = String(text || "").trim().toLowerCase();
  if (["call", "callback", "call back", "phone", "agent", "human", "call now", "speak", "talk"].includes(t)) return true;
  return HANDOFF_RE.test(t);
}

// ---------------------------------------------------------------
// 3. Courses — SINGLE SOURCE OF TRUTH.
// Change a fee or detail here once and every blurb updates.
// ---------------------------------------------------------------
const COURSES = {
  fulltime: {
    order: 1, short: "Full-time", fee: "R73,000", accredited: true,
    single:
      "Thank you for your interest in our Full-time Montessori Teacher Training Course.\n\n" +
      "This is our most immersive option and is ideal if you are ready to commit to full-time study. The course runs for one year, starts in March, and lectures take place in Johannesburg only, at our Linbro Park, Sandton campus, on Mondays, Tuesdays and Thursdays from 08:30–14:30, with teaching practice from Term 2.\n\n" +
      "The course carries International MACTE and National ETDP SETA NQF Level 5 accreditation. The 2027 course fee is R73,000.\n\n" +
      "A course advisor will be happy to discuss the course and your plans with you.",
    combo:
      "The Full-time course is a one-year accredited course starting in March, offered in Johannesburg only at our Linbro Park, Sandton campus, with weekday lectures (Mondays, Tuesdays and Thursdays) — our most immersive option.",
  },
  parttime: {
    order: 2, short: "Part-time", fee: "R63,000", accredited: true,
    single:
      "Thank you for your interest in our Part-time Montessori Teacher Training Course.\n\n" +
      "This option is ideal if you would like to study while still working or managing other commitments. The course runs for one year, starts in March, and lectures take place on Saturdays during term time.\n\n" +
      "The Part-time course is offered in Johannesburg and Durban only. It carries International MACTE and National ETDP SETA NQF Level 5 accreditation. The 2027 course fee is R63,000.\n\n" +
      "A course advisor will be happy to discuss whether this is the best option for you.",
    combo:
      "The Part-time course is a one-year accredited course starting in March, offered in Johannesburg and Durban only, with lectures on Saturdays during term time — ideal if you are working or have other commitments.",
  },
  online: {
    order: 3, short: "Online", fee: "R63,000", accredited: true,
    single:
      "Thank you for your interest in our Online Montessori Teacher Training Course.\n\n" +
      "This option is ideal if you need more flexibility but still want an accredited qualification. The course runs for one year, starts in March, and lectures take place live online on Monday and Thursday evenings from 17:30–20:30.\n\n" +
      "The course carries International MACTE and National ETDP SETA NQF Level 5 accreditation. Please note that compulsory face-to-face/practicum attendance is required in either Johannesburg or Cape Town. The 2027 course fee is R63,000.\n\n" +
      "A course advisor will be happy to discuss whether the online structure will suit you.",
    combo:
      "The Online course is a one-year accredited course starting in March, with live evening lectures on Mondays and Thursdays (17:30–20:30) and compulsory face-to-face/practicum attendance in either Johannesburg or Cape Town — ideal if you need more flexibility.",
  },
  distance: {
    order: 4, short: "Distance Learning", fee: "R23,000", accredited: false,
    single:
      "Thank you for your interest in our Distance Learning Montessori Course.\n\n" +
      "This is our most flexible option and can be started at any time. Students receive up to three years to complete the course and are assigned a tutor for support.\n\n" +
      "Please note that this is a non-accredited course. The 2027 course fee is R23,000.\n\n" +
      "A course advisor will be happy to discuss whether Distance Learning is the right fit for your goals.",
    combo:
      "The Distance Learning course is a flexible, non-accredited option that can be started at any time and completed over up to three years, with a tutor assigned for support.",
  },
};

const COURSE_ORDER = ["fulltime", "parttime", "online", "distance"];

// ---------------------------------------------------------------
// 3b. Calendly booking links — SINGLE SOURCE OF TRUTH.
// If you ever rename a Calendly event link (slug), update it here
// (only the part after calendly.com/modmont/).
// ---------------------------------------------------------------
const CALENDLY = {
  base: "https://calendly.com/modmont/",
  school: {
    linbroBabyToddler: "linbro-baby-toddler-0-3",   // ages 0–3
    linbroTreeHouse: "school-linbro-tree-house-3-6", // ages 3–6
    linbroElementary: "linbro-elementary-6-12",      // ages 6–12
    gillitts: "gillitts-hillcrest",                  // Gillitts (any age)
  },
  college: {
    faceToFace: "college-face-to-face",              // in person, Joburg
    online: "college-online-zoom",                   // online, Zoom
    distance: "distance-learning-15-min-call",       // 15-min phone call
  },
};

// Parse a child's age in YEARS from free text ("3", "5 years", "18 months").
function parseChildAge(text) {
  if (!text) return null;
  const t = String(text).toLowerCase();
  const m = t.match(/(\d+(?:[.,]\d+)?)/);
  if (!m) return null;
  let n = parseFloat(m[1].replace(",", "."));
  if (/month/.test(t)) n = n / 12; // "18 months" -> 1.5 years
  return isNaN(n) ? null : n;
}

// School: pick the Calendly event by branch + child age.
function schoolBookingUrl(school, childAgeText) {
  if (school === "gillitts") return CALENDLY.base + CALENDLY.school.gillitts;
  const age = parseChildAge(childAgeText);
  let key;
  if (age == null) key = "linbroTreeHouse";     // sensible default if unclear
  else if (age < 3) key = "linbroBabyToddler";
  else if (age < 6) key = "linbroTreeHouse";
  else key = "linbroElementary";
  return CALENDLY.base + CALENDLY.school[key];
}

// College: pick by recommended path + preference (1 in person / 2 online / 3 phone).
function collegeBookingUrl(finalArr, preference) {
  // A Distance-only recommendation can only be the 15-minute phone call.
  if (Array.isArray(finalArr) && finalArr.length === 1 && finalArr[0] === "distance")
    return CALENDLY.base + CALENDLY.college.distance;
  const p = String(preference || "").trim();
  if (/(^|\b)(1|in.?person|campus|face)/i.test(p)) return CALENDLY.base + CALENDLY.college.faceToFace;
  if (/(^|\b)(2|online|zoom|virtual)/i.test(p)) return CALENDLY.base + CALENDLY.college.online;
  if (/(^|\b)(3|phone|call|tele)/i.test(p)) return CALENDLY.base + CALENDLY.college.distance;
  return CALENDLY.base + CALENDLY.college.faceToFace; // default
}

// ---------------------------------------------------------------
// 4. Lead-capture question sequences (edit / reorder freely).
// `field` is the column name saved to your Google Sheet.
// `skipIf(answers)` optionally skips a question.
// ---------------------------------------------------------------
const SCHOOL_QUESTIONS = [
  { field: "parent_name", text: "What is the parent's name?" },
  { field: "parent_surname", text: "What is the parent's surname?" },
  { field: "child_name", text: "What is the name of your child?" },
  { field: "child_gender", text: "Is your child male or female?" },
  { field: "child_age", text: "How old is your child?" },
  { field: "current_school", text: "Is your child at another school at present?" },
  { field: "start_when", text: "When would you like your child to begin?" },
  { field: "email", text: "What is your email address?" },
  { field: "wants_appointment", text: "Would you like to book an appointment to visit the school? (Yes / No)" },
];

const COLLEGE_QUESTIONS = [
  { field: "name_surname", text: "What is your name and surname?" },
  { field: "email", text: "What is your email address?" },
  // Skipped if we already learned their location from the Full-time/Part-time step.
  { field: "location", text: "Where do you live?", skipIf: (a) => !!a.location },
  {
    field: "funding_acknowledged",
    text:
      "Are you aware that The College of Modern Montessori's courses are self-funded by students, and that it is the student's responsibility to arrange their own bursary, sponsorship or funding? (Yes / No)",
  },
  { field: "wants_appointment", text: "Would you like to book an appointment to speak with us? (Yes / No)" },
  {
    field: "appointment_preference",
    text: "Would you prefer your appointment to be:\n\n1. In person at the college\n2. Online\n3. A phone call",
    skipIf: (a) => /^\s*(no|n|nope|not|nah)\b/i.test((a.wants_appointment || "").trim()),
  },
];

// Questions asked when someone requests a callback.
const CALLBACK_QUESTIONS = [
  { field: "callback_name", text: "No problem — who should we ask for? (your name)" },
  { field: "callback_number", text: "What's the best number to call you on?" },
  { field: "callback_time", text: "And what day and time would suit you best for the call?" },
];

// ---------------------------------------------------------------
// 5. Combined college blurb generator (handles ALL combinations).
// ---------------------------------------------------------------
function humanJoin(items) {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return items[0] + " and " + items[1];
  return items.slice(0, -1).join(", ") + " and " + items[items.length - 1];
}

function courseBlurb(keys) {
  const ordered = COURSE_ORDER.filter((k) => keys.includes(k));
  if (ordered.length === 0) return "";
  if (ordered.length === 1) return COURSES[ordered[0]].single;

  const names = ordered.map((k) => COURSES[k].short);
  const sentences = ordered.map((k) => COURSES[k].combo).join("\n\n");
  const fees = ordered.map((k) => `${COURSES[k].short} ${COURSES[k].fee}`).join(", ");

  return (
    `Thank you for your interest in our ${humanJoin(names)} Montessori course options.\n\n` +
    `${sentences}\n\n` +
    `Fees: ${fees}.\n\n` +
    `A course advisor will be happy to help you compare these options and choose the best route for your circumstances.`
  );
}

module.exports = {
  MESSAGES,
  BUTTONS,
  COURSES,
  COURSE_ORDER,
  CALENDLY,
  CONTACT,
  SCHOOL_QUESTIONS,
  COLLEGE_QUESTIONS,
  CALLBACK_QUESTIONS,
  courseBlurb,
  humanJoin,
  parseChildAge,
  schoolBookingUrl,
  collegeBookingUrl,
  wantsHandoff,
};
