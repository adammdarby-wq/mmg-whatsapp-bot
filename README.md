# Modern Montessori Group — WhatsApp Chatbot
<!-- auto-deploy check: 2026-07-19 -->

A complete WhatsApp chatbot for the number **+27 78 255 8159**, built on the official **Meta WhatsApp Cloud API**. The 12 prospectus and application PDFs are bundled inside the app and served automatically, so there is nothing else to host.

## What it does

The conversation follows exactly this journey:

1. **Greeting** — "Thank you for contacting the Modern Montessori Group. How may we help you today?" with two buttons: *School enrolment* and *Teacher training*.
2. **School enrolment** → "Which school are you interested in?" → *Linbro Park, Sandton* or *Gillitts / Hillcrest* → a thank-you message plus that school's **prospectus and application form**.
3. **Teacher training** → "Which study options are you interested in?" → *Full-time*, *Part-time*, *Online*, *Distance learning* → the matching **prospectus and application form(s)**, then it asks for the person's **name and email** so a course consultant can follow up.
4. Every enquiry's **name, email and chosen options are saved** (to `leads.csv`, and optionally straight into a Google Sheet).

By default the study options use a numbered reply ("reply 1,3") so it works the moment you deploy. You can later switch to a tick-box form (a published WhatsApp Flow) — see the last section.

## What you need before starting

Most of this is already done from the earlier setup:

- A **Meta app** with the WhatsApp product added.
- Your **Phone number ID** (Meta → WhatsApp → API Setup).
- A **permanent access token** (from a Meta System User) with `whatsapp_business_messaging` permission.
- The number **+27 78 255 8159** registered on the Cloud API (already done).

If you need the token again: Meta Business Settings → Users → System users → your user → Generate token → select the app → tick `whatsapp_business_messaging` and `whatsapp_business_management`.

## Deploy it (about 15 minutes, no coding)

These steps use **Render.com**, which has a free tier and is the simplest for a non-developer. Any Node 18+ host (Railway, Fly.io, a VPS) works the same way.

### 1. Put the code on GitHub
1. Create a free account at github.com if you don't have one.
2. Create a new repository (e.g. `mmg-whatsapp-bot`), then use GitHub's **"uploading an existing file"** link and drag in **everything inside the `mmg-whatsapp-bot` folder** (including the `pdfs` folder). Commit.

### 2. Create the web service on Render
1. Sign up at render.com and click **New → Web Service**.
2. Connect your GitHub and pick the `mmg-whatsapp-bot` repo.
3. Settings: **Build command** `npm install`, **Start command** `npm start`. Choose the Free instance.
4. Under **Environment**, add these variables:

   | Key | Value |
   |---|---|
   | `WHATSAPP_TOKEN` | your permanent Meta token |
   | `PHONE_NUMBER_ID` | your WhatsApp phone number ID |
   | `VERIFY_TOKEN` | make up any password, e.g. `mmg-verify-2026` |
   | `BASE_URL` | leave blank for now — you'll set it after the first deploy |

5. Click **Create Web Service** and wait for it to go live. Render gives you a URL like `https://mmg-whatsapp-bot.onrender.com`.
6. Copy that URL, go back to **Environment**, set **`BASE_URL`** to it (no trailing slash), and let it redeploy. `BASE_URL` is how WhatsApp finds the PDFs, so this step matters.

### 3. Connect the Meta webhook
In your Meta app dashboard → **WhatsApp → Configuration → Edit** the webhook:

- **Callback URL:** `https://your-render-url.onrender.com/webhook`
- **Verify token:** the same `VERIFY_TOKEN` you set on Render
- Click **Verify and save**, then **Subscribe** to the **messages** field.

### 4. Test it
From your personal WhatsApp, message **+27 78 255 8159** with "Hi". You should get the greeting with two buttons and be able to walk the whole journey, PDFs and all.

## Where the leads go

Leads are written to `leads.csv` (timestamp, WhatsApp number, name, email, study options).

**Important:** Render's free tier wipes the filesystem on every restart, so for durable lead capture use the included Google Sheets option:

1. Create a Google Sheet with headers: `timestamp | whatsapp | name | email | study_options`.
2. Extensions → Apps Script, paste the contents of `google-sheets-webhook.gs`, then **Deploy → New deployment → Web app** (Execute as *Me*, Who has access *Anyone*).
3. Copy the web-app URL into a `SHEETS_WEBHOOK_URL` environment variable on Render. Leads then land in the sheet in real time.

## Optional: tick-box study options (WhatsApp Flow)

The numbered-reply fallback lets people pick options one at a time. For a true multi-select tick-box form:

1. In [WhatsApp Manager → Flows](https://business.facebook.com/wa/manage/flows) → **Create Flow** → category *Sign up* → JSON editor.
2. Paste the contents of `flow/study-options-flow.json`, accept any version it suggests, **Preview**, then **Publish**.
3. Copy the **Flow ID** into a `FLOW_ID` environment variable on Render and redeploy. The bot switches to the form automatically.

## Files in this project

| File | Purpose |
|---|---|
| `server.js` | The webhook and all conversation logic |
| `config.js` | Reads settings from environment variables; maps the PDFs |
| `pdfs/` | The 12 bundled prospectus + application PDFs |
| `flow/study-options-flow.json` | Optional WhatsApp Flow (tick-box multi-select) |
| `google-sheets-webhook.gs` | Optional Apps Script to send leads to a Google Sheet |
| `test/simulate.js` | Offline test of every conversation path (`npm test`) |
| `.env.example` | Template of the environment variables |

## Run it on your own computer (optional)

```bash
cp .env.example .env      # fill in your values, set BASE_URL to a public tunnel URL
npm install
npm start                 # serves on port 3000
npm test                  # runs the offline conversation tests
```

To receive real messages locally you'd need a public tunnel (e.g. ngrok) as the `BASE_URL` and webhook. For live use, the Render deployment above is simpler.
