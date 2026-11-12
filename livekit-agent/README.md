# LiveKit Voice Interview Agent (Open Source Vapi Alternative)

This worker agent connects to your LiveKit Cloud or self-hosted room and acts as the **Executive AI Voice Interviewer** with sub-500ms voice latency, real-time Silero VAD (instant interruption/barge-in), and adaptive questioning.

---

### Architecture
- **WebRTC Transport**: LiveKit (50GB free bandwidth/month on LiveKit Cloud)
- **Voice Activity Detection (VAD)**: Silero VAD (Runs locally, zero latency)
- **Speech-to-Text (STT)**: Deepgram Nova-2 ($200 free credit on signup)
- **Language Model (LLM)**: Groq `llama-3.3-70b-versatile` (100% Free on console.groq.com)
- **Text-to-Speech (TTS)**: Cartesia Sonic / Deepgram Aura

---

### Quick Setup (2 Minutes)

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
pip3 install -r requirements.txt
```

#### 3. Run the Agent:
```bash
python3 agent.py dev
```

That's it! The agent will automatically listen for candidates joining any interview room and start the dynamic adaptive voice session with ultra-low latency.

