import os
import json
from typing import List
from openai.types.chat.chat_completion_message_param import ChatCompletionMessageParam
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi import FastAPI, Query
from fastapi.responses import StreamingResponse
from openai import OpenAI
from .utils.prompt import ClientMessage, convert_to_openai_messages
from .utils.tools import get_therapist_match_amount
from .utils.constants import CATEGORY_FILTERS


load_dotenv(".env.local")

app = FastAPI()

useGemini = True

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
    model = "gpt-4o"

class Request(BaseModel):
    messages: List[ClientMessage]


available_tools = {
    "get_therapist_match_amount": get_therapist_match_amount
}

def do_stream(messages: List[ChatCompletionMessageParam]):
    stream = client.chat.completions.create(
        messages=messages,
        model=model,
        stream=True,
        tools=[{
            "type": "function",
            "function": {
                "name": "get_therapist_match_amount",
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
    system_prompt = f"""You are a concise, direct therapist matching assistant. Your job is to help users find the best therapist for their needs by gathering information about their situation and preferences.

IMPORTANT INSTRUCTIONS:
1. Be clear and direct, just ask what you need to know
2. Ask 1-2 focused questions per response to gather information about:
   - What they're struggling with (anxiety, depression, trauma, etc.)
   - Their preferences (gender, session type, therapy type, etc.)
3. Based on their responses, maintain an internal array of attribute IDs that match their needs
4. ALWAYS call the get_therapist_match_amount tool with your current attribute ID array with EVERY response
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
                "name": "get_therapist_match_amount",
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




@app.post("/api/chat")
async def handle_chat_data(request: Request, protocol: str = Query('data')):
    messages = request.messages
    openai_messages = convert_to_openai_messages(messages)

    response = StreamingResponse(stream_text(openai_messages, protocol))
    response.headers['x-vercel-ai-data-stream'] = 'v1'
    return response
