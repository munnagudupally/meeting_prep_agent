import os
from dotenv import load_dotenv
# pyrefly: ignore [missing-import]
from hindsight_client import Hindsight

load_dotenv()

api_key = os.getenv("HINDSIGHT_API_KEY")

if not api_key:
    raise RuntimeError("HINDSIGHT_API_KEY is missing")

client = Hindsight(
    base_url="https://api.hindsight.vectorize.io",
    api_key=api_key
)

MEMORY_BANK = "meeting-prep-agent-v1"

class HindsightService:
    def __init__(self):
        # We read the API key from environment variables to keep it secure.
        # This prevents the key from being hardcoded in the source code.
        api_key = os.environ.get("HINDSIGHT_API_KEY")
        
        # Connect to the Hindsight Cloud memory system
        self.client = Hindsight(
            api_key=api_key,
            base_url="https://api.hindsight.vectorize.io"
        )
        # The memory bank we are using for our hackathon project
        self.memory_bank = "Meeting Prep Agent"

    def retain_memory(self, content, metadata=None):
        """
        Saves new information (like meeting transcripts) into our Hindsight memory bank.
        """
        return self.client.retain(
            bank_id=self.memory_bank,
            content=content,
            metadata=metadata
        )

    def recall_memory(self, query):
        """
        Searches past memories in our Hindsight memory bank to find relevant context.
        """
        return self.client.recall(
            bank_id=self.memory_bank,
            query=query
        )

    def reflect_memory(self, query):
        """
        Triggers the memory system to analyze, summarize, and connect past memories.
        """
        return self.client.reflect(
            bank_id=self.memory_bank,
            query=query
        )
