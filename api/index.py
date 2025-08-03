import os
import json
from typing import List, Dict, Any
from openai.types.chat.chat_completion_message_param import ChatCompletionMessageParam
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi import FastAPI, Query
from fastapi.responses import StreamingResponse
from openai import OpenAI
from .utils.prompt import ClientMessage, convert_to_openai_messages
from .utils.tools import get_therapist_match_data, get_messages_attribute_ids, get_therapist_profile_data
from .utils.constants import CATEGORY_FILTERS


load_dotenv(".env.local")

app = FastAPI()

useGemini = False #True

if useGemini:
    client = OpenAI(
        api_key=os.environ.get("OPENROUTER_API_KEY"),
        base_url="https://openrouter.ai/api/v1",
    )
    model = "openrouter/horizon-beta"
else:
    client = OpenAI(
        api_key=os.environ.get("OPENAI_API_KEY"),
    )
    # model = "gpt-4.1-mini-2025-04-14"
    model = "gpt-4o"

class Request(BaseModel):
    messages: List[ClientMessage]


available_tools = {
    "get_therapist_match_data": get_therapist_match_data
}

def do_stream(messages: List[ChatCompletionMessageParam]):
    stream = client.chat.completions.create(
        messages=messages,
        model=model,
        stream=True,
        tools=[{
            "type": "function",
            "function": {
                "name": "get_therapist_match_data",
                "description": "Get the number of therapists that match the chosen filters",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "attributeIds": {
                            "type": "array",
                            "items": {
                                "type": "integer"
                            },
                            "description": "Array of attribute IDs representing the chosen filters"
                        },
                        "location": {
                            "type": "object",
                            "properties": {
                                "id": {"type": "integer"},
                                "type": {"type": "string"},
                                "regionCode": {"type": "string"}
                            },
                            "description": "Location object with id, type, and regionCode only use if given to you it's a specific format"
                        }
                    },
                    "required": ["attributeIds"]
                }
            }
        }]
    )

    return stream

def stream_text(messages: List[ChatCompletionMessageParam], protocol: str = 'data'):
    draft_tool_calls = []
    draft_tool_calls_index = -1

    # Add system prompt for therapist matching chatbot
    system_prompt = f"""You are a concise, direct therapist matching assistant. Your job is to help users find the best therapist available in Toronto Ontario for their needs by gathering information about their situation and preferences.

MOST IMPORTANT RULE: ALWAYS CALL THE get_therapist_match_data tool with the last called attribute IDs no matter what.

IMPORTANT INSTRUCTIONS:
1. Be clear and direct, just ask what you need to know
2. Ask 1-2 focused questions per response to gather information about:
   - What they're struggling with (anxiety, depression, trauma, etc.)
   - Their preferences (gender, session type, therapy type, etc.)
3. Based on their responses, maintain an internal array of attribute IDs that match their needs
4. ALWAYS call the get_therapist_match_data tool with your current attribute ID array with EVERY response
    - Even if the patient provides no information, call the tool with the last called attribute IDs
5. Be conversational but efficient - get to the point quickly
6. Never mention the number of matching therapists in your response - this is shown separately
7. Don't repeat information you've already acknowledged unless the user adds new details
8. Only allow one gender to be selected if specified, if they ask for another, just switch it

AVAILABLE ATTRIBUTE CATEGORIES AND IDS:
{CATEGORY_FILTERS}

Start by asking what brings them here and what they're looking for in a therapist."""

    # Insert system message at the beginning if not already present
    if not messages or messages[0].get("role") != "system":
        messages = [{"role": "system", "content": system_prompt}] + messages

    stream = client.chat.completions.create(
        messages=messages,
        model=model,
        stream=True,
        tools=[{
            "type": "function",
            "function": {
                "name": "get_therapist_match_data",
                "description": "Get the number of therapists that match the chosen filters - CALL THIS WITH EVERY RESPONSE",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "attributeIds": {
                            "type": "array",
                            "items": {
                                "type": "integer"
                            },
                            "description": "Array of attribute IDs representing the chosen filters based on user responses"
                        },
                        "location": {
                            "type": "object",
                            "properties": {
                                "id": {"type": "integer"},
                                "type": {"type": "string"},
                                "regionCode": {"type": "string"}
                            },
                            "description": "Location object with id, type, and regionCode"
                        }
                    },
                    "required": ["attributeIds"]
                }
            }
        }]
    )

    for chunk in stream:
        for choice in chunk.choices:
            if choice.finish_reason == "stop":
                continue

            elif choice.finish_reason == "tool_calls":
                print(choice)
                for tool_call in draft_tool_calls:
                    yield '9:{{"toolCallId":"{id}","toolName":"{name}","args":{args}}}\n'.format(
                        id=tool_call["id"],
                        name=tool_call["name"],
                        args=tool_call["arguments"])

                for tool_call in draft_tool_calls:
                    tool_result = available_tools[tool_call["name"]](
                        **json.loads(tool_call["arguments"]))

                    yield 'a:{{"toolCallId":"{id}","toolName":"{name}","args":{args},"result":{result}}}\n'.format(
                        id=tool_call["id"],
                        name=tool_call["name"],
                        args=tool_call["arguments"],
                        result=json.dumps(tool_result))

            elif choice.delta.tool_calls:
                for tool_call in choice.delta.tool_calls:
                    id = tool_call.id
                    name = tool_call.function.name
                    arguments = tool_call.function.arguments

                    if (id is not None):
                        draft_tool_calls_index += 1
                        draft_tool_calls.append(
                            {"id": id, "name": name, "arguments": ""})

                    else:
                        draft_tool_calls[draft_tool_calls_index]["arguments"] += arguments

            else:
                yield '0:{text}\n'.format(text=json.dumps(choice.delta.content))

        if chunk.choices == []:
            usage = chunk.usage
            prompt_tokens = usage.prompt_tokens
            completion_tokens = usage.completion_tokens

            yield 'e:{{"finishReason":"{reason}","usage":{{"promptTokens":{prompt},"completionTokens":{completion}}},"isContinued":false}}\n'.format(
                reason="tool-calls" if len(
                    draft_tool_calls) > 0 else "stop",
                prompt=prompt_tokens,
                completion=completion_tokens
            )


def create_condensed_profiles(profiles: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Create condensed versions of profiles with only key fields for AI analysis.
    """
    condensed = []
    for i, profile in enumerate(profiles):
        condensed_profile = {
            "id": i + 1,  # Simple ID for reference
            "listingName": profile.get("listingName", ""),
            "healthRole": profile.get("healthRole", ""),
            "healthRoleWriteIn": profile.get("healthRoleWriteIn", ""),
            "personalStatement": profile.get("personalStatement", "")
        }
        condensed.append(condensed_profile)
    return condensed


def get_ai_ranked_matches(profiles: List[Dict[str, Any]], user_context: str = "") -> Dict[str, Any]:
    """
    Use AI to analyze profiles and return ranked matches with professional descriptions.
    """
    condensed_profiles = create_condensed_profiles(profiles)
    
    system_prompt = f"""You are a professional therapist matching specialist. You will receive {len(profiles)} therapist profiles and need to:

1. Analyze each therapist's qualifications, specialties, and personal statement
2. Rank them 1-{len(profiles)} based on overall therapeutic fit and quality
3. Write a concise, professional 2-3 sentence description for each explaining why they'd be a good therapist

You must respond with a JSON object containing a "rankedMatches" array. Each item in the array should have:
- "originalId": the therapist's ID number from the input (1, 2, 3, etc.)
- "rank": their ranking from 1 (best) to {len(profiles)} (lowest)
- "description": a professional explanation of why they're recommended

Consider:
- Clinical expertise and specializations
- Professional background and credentials  
- Communication style from personal statement
- Overall therapeutic approach and philosophy

Base your rankings on therapeutic quality and the user's context, not just specialization matches. The message should be quite small but personalized to the user's messages to address them directly. All therapists already match the basic filters."""

    user_message = f"""Please analyze and rank these {len(profiles)} therapist profiles:

{json.dumps(condensed_profiles, indent=2)}

{f"Additional context about the patient: {user_context}" if user_context else ""}"""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message}
    ]

    try:
        response = client.chat.completions.create(
            messages=messages,
            model=model,
            temperature=0.3,  # Lower temperature for more consistent rankings
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "ranked_matches",
                    "schema": {
                        "type": "object",
                        "properties": {
                            "rankedMatches": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "originalId": {"type": "integer"},
                                        "rank": {"type": "integer"},
                                        "description": {"type": "string"}
                                    },
                                    "required": ["originalId", "rank", "description"]
                                }
                            }
                        },
                        "required": ["rankedMatches"],
                        "additionalProperties": False
                    }
                }
            }
        )
        
        content = response.choices[0].message.content
        
        # Parse the structured JSON response
        try:
            ranking_data = json.loads(content)
            return ranking_data
                
        except json.JSONDecodeError as e:
            print(f"Failed to parse AI response as JSON: {e}")
            print(f"Raw response: {content}")
            # Return an error with fallback structure
            return {
                "error": f"Failed to parse AI response: {str(e)}",
                "rankedMatches": [
                    {
                        "originalId": i + 1,
                        "rank": i + 1,
                        "description": f"Qualified therapist with relevant experience and professional approach to mental health care."
                    }
                    for i in range(len(profiles))
                ]
            }
            
    except Exception as e:
        print(f"Error getting AI rankings: {e}")
        return {
            "error": f"Error getting AI rankings: {str(e)}",
            "rankedMatches": [
                {
                    "originalId": i + 1,
                    "rank": i + 1,
                    "description": f"Experienced therapist with professional training and commitment to client care."
                }
                for i in range(len(profiles))
            ]
        }


@app.post("/api/chat")
async def handle_chat_data(request: Request, protocol: str = Query('data')):
    messages = request.messages
    openai_messages = convert_to_openai_messages(messages)
    print(openai_messages)
    response = StreamingResponse(stream_text(openai_messages, protocol))
    response.headers['x-vercel-ai-data-stream'] = 'v1'
    return response


@app.post("/api/match-ranking")
async def handle_match_ranking(request: Request):
    """
    Get therapist matches with AI-powered rankings and professional descriptions.
    """
    messages = request.messages
    attr_ids = get_messages_attribute_ids(messages)
    data = get_therapist_match_data(attributeIds=attr_ids, limit=3)
    profiles = get_therapist_profile_data(data.get("profiles"))
    
    if not profiles:
        return {"error": "No profiles found"}
    
    # Get user context from the conversation for better matching
    user_context = ""
    if messages:
        # Extract user messages to understand their needs
        user_messages = [msg for msg in messages if msg.role == "user"]
        if user_messages:
            user_context = " ".join([msg.content for msg in user_messages])
    
    try:
        # Get AI rankings and descriptions
        ai_analysis = get_ai_ranked_matches(profiles, user_context)
        
        # Check if AI analysis returned an error
        if "error" in ai_analysis:
            return {
                "profiles": [],
                "aiAnalysis": ai_analysis
            }
        
        # Combine original profiles with AI rankings
        ranked_profiles = []
        for ranking in ai_analysis.get("rankedMatches", []):
            original_id = ranking["originalId"] - 1  # Convert to 0-based index
            if 0 <= original_id < len(profiles):
                profile = profiles[original_id].copy()
                profile["aiRank"] = ranking["rank"]
                profile["aiDescription"] = ranking["description"]
                ranked_profiles.append(profile)
        
        # Sort by AI rank
        ranked_profiles.sort(key=lambda x: x.get("aiRank", 999))
        
        return {
            "profiles": ranked_profiles,
            "aiAnalysis": ai_analysis
        }
        
    except Exception as e:
        print(f"Error in match-ranking endpoint: {e}")
        return {
            "profiles": [],
            "aiAnalysis": {"error": f"Failed to process therapist rankings: {str(e)}"}
        }
    