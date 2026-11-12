import asyncio
import os
import logging
from dotenv import load_dotenv
from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli, Agent, AgentSession
from livekit.plugins import deepgram, groq, silero, cartesia

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

    # Configure VAD conservatively to prevent ambient noise / early speech
    # from triggering a turn before the greeting is delivered.
    # - activation_threshold=0.6  : only trigger on clear speech (default is ~0.5)
    # - min_speech_duration=0.2   : require 200ms of continuous speech (ignores blips)
    # - min_silence_duration=0.8  : wait 800ms of silence before ending a turn (prevents cutting off)
    vad = silero.VAD.load(
        activation_threshold=0.6,
        min_speech_duration=0.2,
        min_silence_duration=0.8,
    )

    session = AgentSession(
        vad=vad,
        stt=deepgram.STT(model="nova-2", language="en"),
        llm=groq.LLM(model="llama-3.3-70b-versatile"),
        tts=cartesia.TTS(model="sonic-english", voice="47c38ca4-5f35-497b-b1a3-415245fb35e1"),
        # Wait at least 600ms after user stops speaking before the agent responds.
        # Prevents the agent from reacting to noise or partial utterances.
        min_endpointing_delay=0.6,
    )

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
