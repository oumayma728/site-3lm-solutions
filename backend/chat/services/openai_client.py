import logging
import re
from functools import lru_cache

from django.conf import settings

from chat.models import Message
from chat.services.knowledge_base import load_business_knowledge

logger = logging.getLogger(__name__)


SYSTEM_PROMPT = """You are the official assistant for 3LM Solutions.
Answer in the user's language when possible. Be concise, helpful, and grounded only in the provided business knowledge.
Use plain text only. Do not use Markdown, bold markers, tables, or bullet symbols.
Prefer short paragraphs with line breaks. Keep answers easy to read in a chat bubble.
If a user asks for something outside the knowledge base, say you can help connect them with the 3LM Solutions team.
When the user shows buying intent, suggest they book a meeting via the "Prendre rendez-vous" page of the site.
Answer in 2 to 5 short sentences. Never stop in the middle of a sentence or a list.
If you are about to run out of space, wrap up with a short closing sentence instead of cutting off.

Business knowledge:
{knowledge}
"""


def _fallback_response() -> str:
    return (
        "Je peux vous aider sur les services de 3LM Solutions : IA, analyse de donnees, IoT, ERP, DevOps, "
        "developpement web/mobile et community management.\n"
        "Pour discuter de votre projet ou fixer un rendez-vous, utilisez la page \"Prendre rendez-vous\" du site "
        "ou contactez l'equipe au +216 54 507 574 / contact@3lmsolutions.net."
    )


def _missing_api_key_response() -> str:
    return (
        "Le chatbot est bien connecte au backend, mais la cle Anthropic n'est pas encore configuree cote serveur.\n"
        "Ajoutez ANTHROPIC_API_KEY dans le fichier .env pour activer les reponses IA."
    )


def _clean_response(text: str) -> str:
    cleaned = text.replace("**", "")
    cleaned = re.sub(r"^\s*[-*+]\s+", "", cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    cleaned = re.sub(r"[ \t]+\n", "\n", cleaned)
    return cleaned.strip()


@lru_cache(maxsize=1)
def _system_instruction() -> str:
    return SYSTEM_PROMPT.format(knowledge=load_business_knowledge())


def _to_anthropic_messages(messages: list[Message]) -> list[dict[str, str]]:
    # Note: no "system" role here — Anthropic takes the system prompt as a
    # separate top-level `system` parameter, not as part of the messages list.
    chat_messages = []

    for message in messages[-settings.CHAT_CONTEXT_MESSAGE_LIMIT :]:
        role = "assistant" if message.sender == Message.Sender.BOT else "user"
        chat_messages.append({"role": role, "content": message.content})

    return chat_messages


def build_chat_response(messages: list[Message]) -> str:
    """Generate a business-grounded response with Claude (Anthropic)."""
    if not settings.ANTHROPIC_API_KEY:
        logger.warning("ANTHROPIC_API_KEY is missing")
        return _missing_api_key_response()

    try:
        from anthropic import Anthropic

        client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        response = client.messages.create(
            model=settings.ANTHROPIC_MODEL,
            system=_system_instruction(),
            messages=_to_anthropic_messages(messages),
            max_tokens=settings.ANTHROPIC_MAX_OUTPUT_TOKENS,
        )

        content = response.content[0].text if response.content else ""
        if not content:
            logger.error("Anthropic returned an empty response")
            return _fallback_response()

        cleaned = _clean_response(content)
        logger.info("Anthropic success model=%s length=%d", settings.ANTHROPIC_MODEL, len(cleaned))
        return cleaned or _fallback_response()
    except Exception as exc:
        logger.exception("Anthropic chat completion failed: %s", exc)
        return _fallback_response()