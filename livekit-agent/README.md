# LiveKit Voice Interview Agent (Open Source Vapi Alternative)

This worker agent connects to your LiveKit Cloud or self-hosted room and acts as the **Executive AI Voice Interviewer** with sub-500ms voice latency, real-time Silero VAD (instant interruption/barge-in), and adaptive questioning.

> ⚠️ **This agent must be deployed as a persistent background service — it cannot run on Vercel.**
> Deploy it on [Railway.app](https://railway.app).

---

### Architecture
- **WebRTC Transport**: LiveKit (50GB free bandwidth/month on LiveKit Cloud)
- **Voice Activity Detection (VAD)**: Silero VAD (Runs locally, zero latency)
- **Speech-to-Text (STT)**: Deepgram Nova-2 ($200 free credit on signup)
- **Language Model (LLM)**: Groq `llama-3.3-70b-versatile` (100% Free on console.groq.com)
- **Text-to-Speech (TTS)**: Cartesia Sonic / Deepgram Aura

---

## 🚀 Deploy on Railway.app

### Step 1 — Create a Railway account
Go to [railway.app](https://railway.app) and sign up with GitHub.

### Step 2 — New Project
1. Dashboard → **New Project** → **Deploy from GitHub repo**
2. Select repo: `riteshdavv/ai-recruitment-system`
3. Railway auto-detects `railway.json` in `livekit-agent/` — but you need to set the **Root Directory**:
   - Go to **Settings** → **Source** → set **Root Directory** to `livekit-agent`
4. Railway will use these settings from `railway.json`:
   - **Builder**: Nixpacks (auto-detects Python)
   - **Start Command**: `python agent.py start`
   - **Restart Policy**: On failure (auto-restarts if it crashes)

### Step 3 — Add Environment Variables
In the Railway service → **Variables** tab, add all 6 keys:

| Key | Where to get it |
|-----|----------------|
| `LIVEKIT_URL` | [cloud.livekit.io](https://cloud.livekit.io) → your project → `wss://...` |
| `LIVEKIT_API_KEY` | LiveKit Cloud → Settings → Keys |
| `LIVEKIT_API_SECRET` | LiveKit Cloud → Settings → Keys |
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) (free) |
| `DEEPGRAM_API_KEY` | [console.deepgram.com](https://console.deepgram.com) ($200 free credit) |
| `CARTESIA_API_KEY` | [play.cartesia.ai](https://play.cartesia.ai) (free tier) |

### Step 4 — Deploy
Click **Deploy**. Railway builds and starts the agent.
Once you see `Agent started. Waiting for jobs...` in the logs — it's live. ✅

### Step 5 — Verify it works
1. Open your deployed Next.js app on Vercel
2. Start an interview as a candidate
3. Watch Railway logs — you should see: `Job received for room: interview_<id>`

---

## 🧪 Local Development

#### 1. Configure `.env` in the root project directory:
```env
# LiveKit Cloud (Get free from https://cloud.livekit.io)
LIVEKIT_URL=wss://your-project.livekit.cloud
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret

# AI Providers
GROQ_API_KEY=gsk_your_groq_key
DEEPGRAM_API_KEY=your_deepgram_key
CARTESIA_API_KEY=your_cartesia_key
```

#### 2. Install dependencies:
```bash
cd livekit-agent
python3 -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### 3. Run locally (dev mode with auto-reload):
```bash
python agent.py dev
```

#### 4. Run in production mode (same as Render):
```bash
python agent.py start
```

That's it! The agent listens for candidates joining any `interview_*` room and starts the dynamic adaptive voice session automatically.

