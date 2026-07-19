// ---------------------------------------------------------------
// Modern Montessori Group WhatsApp Bot - configuration
// All values come from environment variables (see .env.example)
// ---------------------------------------------------------------
require("dotenv").config();

// The PDFs are bundled with the app and served from /pdfs.
// BASE_URL is the public https URL of your deployed app, e.g.
//   https://mmg-bot.onrender.com
// WhatsApp fetches each document from BASE_URL/pdfs/<file>.
const BASE_URL = (process.env.BASE_URL || "").replace(/\/$/, "");
const pdf = (file, filename) => ({
  url: `${BASE_URL}/pdfs/${file}`,
  filename,
});

module.exports = {
  BASE_URL,

  // Meta / WhatsApp Cloud API
  WHATSAPP_TOKEN: process.env.WHATSAPP_TOKEN, // permanent system-user token
  PHONE_NUMBER_ID: process.env.PHONE_NUMBER_ID, // from WhatsApp > API Setup
  VERIFY_TOKEN: process.env.VERIFY_TOKEN || "mmg-verify-token",
  GRAPH_API_VERSION: process.env.GRAPH_API_VERSION || "v21.0",

  // Published WhatsApp Flow ID for the study-options form.
  // Leave empty to use the numbered-reply fallback instead.
  FLOW_ID: process.env.FLOW_ID || "",

  // Each branch sends the prospectus AND the application form.
  // Files are bundled in ./pdfs and served by this app.
  PDFS: {
    linbro: [
      pdf("linbro-prospectus.pdf", "Linbro Park - Prospectus 2026.pdf"),
      pdf("linbro-application.pdf", "Linbro Park - Application 2026.pdf"),
    ],
    gillitts: [
      pdf("gillitts-prospectus.pdf", "Gillitts Hillcrest - Prospectus 2026.pdf"),
      pdf("gillitts-application.pdf", "Gillitts Hillcrest - Application 2026.pdf"),
    ],
    fulltime: [
      pdf("fulltime-prospectus.pdf", "Full-Time Course - Prospectus 2027.pdf"),
      pdf("fulltime-application.pdf", "Full-Time Course - Application 2027.pdf"),
    ],
    parttime: [
      pdf("parttime-prospectus.pdf", "Part-Time Course - Prospectus 2026.pdf"),
      pdf("parttime-application.pdf", "Part-Time Course - Application 2027.pdf"),
    ],
    online: [
      pdf("online-prospectus.pdf", "Online Course - Prospectus 2027.pdf"),
      pdf("online-application.pdf", "Online Course - Application 2027.pdf"),
    ],
    distance: [
      pdf("distance-prospectus.pdf", "Distance Learning - Prospectus 2026.pdf"),
      pdf("distance-application.pdf", "Distance Learning - Application 2026.pdf"),
    ],
  },

  // Lead storage
  LEADS_CSV: process.env.LEADS_CSV || "./leads.csv",
  // Optional: Google Apps Script web-app URL to append leads to a Google Sheet
  SHEETS_WEBHOOK_URL: process.env.SHEETS_WEBHOOK_URL || "",

  // Calendly -> Google Sheet booking sync (see /calendly endpoint).
  // Shared secret: set the same value here and in the ?key= of the Calendly
  // webhook callback URL, so only Calendly can post to /calendly.
  // Leave empty to disable the check (not recommended in production).
  CALENDLY_WEBHOOK_SECRET: process.env.CALENDLY_WEBHOOK_SECRET || "",
  // Tab name that completed bookings are written to.
  BOOKINGS_SHEET: process.env.BOOKINGS_SHEET || "Bookings",

  PORT: process.env.PORT || 3000,
};
