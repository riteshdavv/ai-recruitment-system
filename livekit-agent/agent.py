import asyncio
import os
import logging
from dotenv import load_dotenv
from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli, Agent, AgentSession
from livekit.plugins import deepgram, groq, silero

# Load .env from current or parent directory
load_dotenv()
parent_env = os.path.join(os.path.dirname(__file__), "..", ".env")
if os.path.exists(parent_env):
    load_dotenv(dotenv_path=parent_env)

logger = logging.getLogger("recruitai-agent")
logging.basicConfig(level=logging.INFO)


async def entrypoint(ctx: JobContext):
    logger.info(f"Agent job received for room: {ctx.room.name}")

    # Connect to room and subscribe to all participant tracks
    await ctx.connect(auto_subscribe=AutoSubscribe.SUBSCRIBE_ALL)
    logger.info("Connected to LiveKit room")

    # Wait for the candidate participant to join
    participant = await ctx.wait_for_participant()
    candidate_name = participant.name or "Candidate"
    logger.info(f"Candidate joined: {candidate_name} ({participant.identity})")

    # Dynamic Adaptive Interviewer instructions
    adaptive_prompt = f"""
You are an expert Executive AI Technical Interviewer conducting a live adaptive voice screening.
Candidate Name: {candidate_name}

YOUR CORE DIRECTIVE - ADAPTIVE DYNAMIC INTERVIEWING:
Evaluate the candidate's answers in real time and dynamically adjust the difficulty, depth, and direction:
1. IF THE CANDIDATE GIVES A STRONG / QUALIFIED ANSWER:
   - Acknowledge their point in half a sentence.
   - Elevate the challenge. Ask an advanced follow-up exploring architecture trade-offs, edge cases, failure recovery, or concurrency.
2. IF THE CANDIDATE GIVES A VAGUE OR BUZZWORD-HEAVY ANSWER:
   - Ask for a concrete practical implementation example from their real work experience.
3. IF THE CANDIDATE STRUGGLES:
   - Pivot warmly to another core competency area so they can demonstrate their strengths.

CONVERSATIONAL VOICE CONSTRAINTS:
- Ask exactly ONE question at a time.
- Keep each response under 2 to 3 sentences maximum so the candidate has airtime.
- Be conversational, friendly, professional, and natural.
- Cover 4 to 5 key competency domains across the interview, then conclude warmly.
""".strip()

    # Configure VAD to naturally capture fluent speech without cutting off thinking pauses:
    # - activation_threshold=0.45 : detects natural, fluent speech accurately without missing quiet words
    # - min_speech_duration=0.15  : requires 150ms of audio to trigger speech
    # - min_silence_duration=1.4  : allows candidate 1.4s of breathing/thinking pause before VAD marks silence
    vad = silero.VAD.load(
        activation_threshold=0.45,
        min_speech_duration=0.15,
        min_silence_duration=1.4,
    )

    session = AgentSession(
        vad=vad,
        stt=deepgram.STT(model="nova-2", language="en"),
        llm=groq.LLM(model="openai/gpt-oss-20b"),
        tts=deepgram.TTS(model="aura-asteria-en"),
        # Start with interruptions disabled for the introductory questions
        allow_interruptions=False,
        # Give candidate ample time to think: wait 1.6s of silence after speech stops before responding
        min_endpointing_delay=1.6,
        max_endpointing_delay=3.5,
    )

    # Track user turns so VAD interruptions (barge-in) are enabled only after 1-2 initial questions
    user_turns_completed = 0

    @session.on("conversation_item_added")
    def on_conversation_item_added(ev):
        nonlocal user_turns_completed
        if ev.item.role == "user":
            user_turns_completed += 1
            logger.info(f"Candidate turn {user_turns_completed} recorded")
            # Enable natural conversational barge-in after the first 2 questions/answers
            if user_turns_completed >= 2:
                try:
                    interruption_cfg = session.options.turn_handling.get("interruption", {})
                    interruption_cfg["enabled"] = True
                    interruption_cfg["min_words"] = 2
                    logger.info("VAD interruption (barge-in) ACTIVATED for technical evaluation")
                except Exception as e:
                    logger.warning(f"Failed to enable VAD interruption: {e}")

    agent = Agent(instructions=adaptive_prompt)
    await session.start(agent, room=ctx.room)
    logger.info("AgentSession started")

    # Give the pipeline 1 second to stabilize before accepting any user audio.
    # This prevents ambient noise captured at session.start() from being
    # treated as the candidate's first utterance.
    await asyncio.sleep(1.0)

    # Deliver greeting with interruptions disabled so early mic noise
    # cannot cut off the greeting mid-sentence and jam the pipeline.
    logger.info("Delivering greeting...")
    await session.say(
        f"Hello {candidate_name}. Welcome to your live technical interview. "
        "I'm looking forward to speaking with you today. When you're ready, let's begin: "
        "could you start by introducing yourself and sharing what you've been working on recently?",
        allow_interruptions=False,
    )
    logger.info("Greeting delivered — interview is live")


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
