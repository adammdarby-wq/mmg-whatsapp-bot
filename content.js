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
    "A member of our admissions team will be in touch with you to assist further and, where applicable, arrange an appointment for you to visit the school.",

  collegeMenu:
    "Thank you for your interest in The College of Modern Montessori.\n\n" +
    "Please select the course option or options that you would like more information on. " +
    "Reply with the number(s), separated by commas (for example: 1,3).\n\n" +
    "1. Full-time Montessori Teacher Training\n" +
    "2. Part-time Montessori Teacher Training\n" +
    "3. Online Montessori Teacher Training\n" +
    "4. Distance Learning Montessori Course",

  collegeEnd:
    "Thank you. Your information has been received.\n\n" +
    "A member of our course advisory team will be in touch with you to answer your questions and, where applicable, arrange an appointment either in person, online or telephonically.\n\n" +
    "We look forward to assisting you on your Montessori journey.",

  invalid:
    "Sorry, I didn't quite catch that. Please reply using the options provided, or type *menu* to start again.",

  reprompt:
    "Please reply with the number(s) of the option(s) you'd like, separated by commas (for example: 1,3).",
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
};

// ---------------------------------------------------------------
// 3. Courses — SINGLE SOURCE OF TRUTH.
// Change a fee or detail here once and every blurb updates.
// `single` = the polished blurb used when only this course is chosen.
// `combo`  = one sentence used when building multi-course blurbs.
// ---------------------------------------------------------------
const COURSES = {
  fulltime: {
    order: 1,
    short: "Full-time",
    fee: "R73,000",
    single:
      "Thank you for your interest in our Full-time Montessori Teacher Training Course.\n\n" +
      "This is our most immersive option and is ideal if you are ready to commit to full-time study. The course runs for one year, starts in March, and lectures take place in Johannesburg only, at our Linbro Park, Sandton campus, on Mondays, Tuesdays and Thursdays from 08:30–14:30, with teaching practice from Term 2.\n\n" +
      "The course carries International MACTE and National ETDP SETA NQF Level 5 accreditation. The 2027 course fee is R73,000.\n\n" +
      "A course advisor will be happy to discuss the course and your plans with you.",
    combo:
      "The Full-time course is a one-year accredited course starting in March, offered in Johannesburg only at our Linbro Park, Sandton campus, with weekday lectures (Mondays, Tuesdays and Thursdays) — our most immersive option.",
  },
  parttime: {
    order: 2,
    short: "Part-time",
    fee: "R63,000",
    single:
      "Thank you for your interest in our Part-time Montessori Teacher Training Course.\n\n" +
      "This option is ideal if you would like to study while still working or managing other commitments. The course runs for one year, starts in March, and lectures take place on Saturdays during term time.\n\n" +
      "The Part-time course is offered in Johannesburg and Durban only. It carries International MACTE and National ETDP SETA NQF Level 5 accreditation. The 2027 course fee is R63,000.\n\n" +
      "A course advisor will be happy to discuss whether this is the best option for you.",
    combo:
      "The Part-time course is a one-year accredited course starting in March, offered in Johannesburg and Durban only, with lectures on Saturdays during term time — ideal if you are working or have other commitments.",
  },
  online: {
    order: 3,
    short: "Online",
    fee: "R63,000",
    single:
      "Thank you for your interest in our Online Montessori Teacher Training Course.\n\n" +
      "This option is ideal if you need more flexibility but still want an accredited qualification. The course runs for one year, starts in March, and lectures take place live online on Monday and Thursday evenings from 17:30–20:30.\n\n" +
      "The course carries International MACTE and National ETDP SETA NQF Level 5 accreditation. Please note that compulsory face-to-face/practicum attendance is required in either Johannesburg or Cape Town. The 2027 course fee is R63,000.\n\n" +
      "A course advisor will be happy to discuss whether the online structure will suit you.",
    combo:
      "The Online course is a one-year accredited course starting in March, with live evening lectures on Mondays and Thursdays (17:30–20:30) and compulsory face-to-face/practicum attendance in either Johannesburg or Cape Town — ideal if you need more flexibility.",
  },
  distance: {
    order: 4,
    short: "Distance Learning",
    fee: "R23,000",
    single:
      "Thank you for your interest in our Distance Learning Montessori Course.\n\n" +
      "This is our most flexible option and can be started at any time. Students receive up to three years to complete the course and are assigned a tutor for support.\n\n" +
      "Please note that this is a non-accredited course. The 2027 course fee is R23,000.\n\n" +
      "A course advisor will be happy to discuss whether Distance Learning is the right fit for your goals.",
    combo:
      "The Distance Learning course is a flexible, non-accredited option that can be started at any time and completed over up to three years, with a tutor assigned for support.",
  },
};

// Maps the reply number (from the college menu) to a course key.
const COURSE_ORDER = ["fulltime", "parttime", "online", "distance"];

// ---------------------------------------------------------------
// 4. Lead-capture question sequences (edit / reorder freely).
// `field` is the column name saved to your Google Sheet.
// ---------------------------------------------------------------
const SCHOOL_QUESTIONS = [
  { field: "child_name", text: "What is the name of your child?" },
  { field: "child_gender", text: "Is your child male or female?" },
  { field: "child_age", text: "How old is your child?" },
  { field: "current_school", text: "Is your child at another school at present?" },
  { field: "start_when", text: "When would you like your child to begin?" },
  { field: "email", text: "What is your email address?" },
  { field: "wants_appointment", text: "Would you like to book an appointment to visit the school? (Yes / No)" },
];

const COLLEGE_QUESTIONS = [
  { field: "name", text: "What is your name?" },
  { field: "surname", text: "What is your surname?" },
  { field: "email", text: "What is your email address?" },
  { field: "courses_interested", text: "Which course option or options are you most interested in?" },
  { field: "location", text: "Where do you live?" },
  {
    field: "funding_acknowledged",
    text:
      "Are you aware that The College of Modern Montessori's courses are self-funded by students, and that it is the student's responsibility to arrange their own bursary, sponsorship or funding? (Yes / No)",
  },
  { field: "wants_appointment", text: "Would you like to book an appointment to speak with us? (Yes / No)" },
  {
    field: "appointment_preference",
    text:
      "Would you prefer your appointment to be:\n\n1. In person at the college\n2. Online\n3. A phone call",
    // Only asked if they said yes to booking an appointment.
    skipIf: (a) => /^\s*(no|n|nope|not|nah)\b/i.test((a.wants_appointment || "").trim()),
  },
];

// ---------------------------------------------------------------
// 5. Combined college blurb generator (handles ALL combinations).
// ---------------------------------------------------------------
function humanJoin(items) {
  if (items.length === 1) return items[0];
  if (items.length === 2) return items[0] + " and " + items[1];
  return items.slice(0, -1).join(", ") + " and " + items[items.length - 1];
}

function courseBlurb(keys) {
  const ordered = COURSE_ORDER.filter((k) => keys.includes(k));
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
  SCHOOL_QUESTIONS,
  COLLEGE_QUESTIONS,
  courseBlurb,
  humanJoin,
};
