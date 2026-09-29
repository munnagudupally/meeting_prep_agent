import os
from hindsight_service import HindsightService
# Trying to import dotenv if user installed it, otherwise ignore
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

def run_tests():
    print("Starting Hindsight memory tests...")

    # Safety check: Ensure the API key is set before running tests
    if not os.environ.get("HINDSIGHT_API_KEY"):
        print("Error: HINDSIGHT_API_KEY environment variable is not set. Please check your .env file.")
        return

    # Initialize our service
    service = HindsightService()

    # 1. RETAIN
    print("\n--- Testing RETAIN ---")
    memory_content = "Meeting with Rahul Sharma at Acme Technologies. Rahul is very concerned about deployment time and pricing. He strongly prefers technical demonstrations over high-level marketing pitches."
    print("Retaining sample meeting notes...")
    try:
        retain_result = service.retain_memory(memory_content)
        print("Retain successful!")
        print("Response:", retain_result)
    except Exception as e:
        print("Retain Error:", e)
    
    # 2. RECALL
    print("\n--- Testing RECALL ---")
    print("Recalling information about Rahul's concerns and preferences...")
    try:
        recall_result = service.recall_memory("What are Rahul Sharma's concerns and presentation preferences?")
        print("Recall successful!")
        print("Response:", recall_result)
    except Exception as e:
        print("Recall Error:", e)

    # 3. REFLECT
    print("\n--- Testing REFLECT ---")
    print("Reflecting on the memory bank to build connections...")
    try:
        reflect_result = service.reflect_memory("Summarize what we should remember about Rahul Sharma before the next meeting.")
        print("Reflect successful!")
        print("Response:", reflect_result)
    except Exception as e:
        print("Reflect Error:", e)

    print("\nTests finished successfully!")

if __name__ == "__main__":
    run_tests()
