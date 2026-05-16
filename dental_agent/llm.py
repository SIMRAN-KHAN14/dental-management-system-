import os
from langchain_openai import ChatOpenAI
from dental_agent.config.settings import GROQ_API_KEY, MODEL_NAME, TEMPERATURE

def get_llm():
    if not GROQ_API_KEY:
        # Fallback to os.environ just in case
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise RuntimeError("No valid GROQ_API_KEY found.")
    else:
        api_key = GROQ_API_KEY
        
    return ChatOpenAI(
        api_key=api_key,
        base_url="https://api.groq.com/openai/v1",
        model=MODEL_NAME,
        temperature=TEMPERATURE,
    )
