import requests
from .prompt import convert_to_openai_messages
import json
from bs4 import BeautifulSoup

def get_therapist_match_data(attributeIds, location=None, limit=0):
    """
    Get the number of therapists that match the chosen filters by calling Psychology Today API.
    
    Args:
        attributeIds (list): List of attribute IDs representing the chosen filters
        location (dict, optional): Location object with id, type, and regionCode
        
    Returns:
        dict: Contains the match count and filter information
    """
    print("started with " + str(attributeIds) + " and " + str(location))
    # Default location for Canada if not provided
   
    location = {
            "id": 68684,  # Default to Toronto
            "type": "City", 
            "regionCode": "ON"
        }
        
    if limit > 0:
        data_mode = True
    else:
        data_mode = False
    # Prepare the request payload as specified in plan.md
    payload = {
        "attributeIds": attributeIds,
        "costFilter": None,
        "psychiatristsFilter": None,
        "nameSearch": "",
        "listingSearchChar": "",
        "from": 0,
        "limit": limit,  # We only want the count, not actual results
        "seed": "default_seed",  # This will be generated dynamically in real implementation
        "location": location
    }
    
    try:
        # Make the API call to Psychology Today Results API
        response = requests.post(
            "https://www.psychologytoday.com/ca/therapists/results",
            json=payload,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "TheraMatch/1.0"
            },
            timeout=10
        )
        
        # Raise an exception for bad status codes
        response.raise_for_status()
        
        # Parse the response
        data = response.json()
        
        # Extract the total count from the response  
        total_count = data.get("data", {}).get("total", 0)
        print("data: " + str(data))
        print("response status: " + str(response.status_code))
        
        if data_mode:
            return data.get("data")
        return {
            "match_count": total_count,
            "filters_applied": attributeIds,
            "location": location,
            "message": f"{total_count} matching therapists"
        }


        
    except requests.RequestException as e:
        # Handle any errors that occur during the request
        print(f"Error fetching therapist data: {e}")
        return {
            "match_count": 0,
            "filters_applied": attributeIds,
            "location": location,
            "message": f"Error fetching therapist data: {str(e)}",
            "error": True
        }


def get_messages_attribute_ids(messages):
    """
    Get the attribute IDs from the messages
    """
    openai_messages = convert_to_openai_messages(messages)
    last_assistant = next(m for m in reversed(openai_messages) if m['role']=='assistant' and m.get('tool_calls'))
    attr_ids = json.loads(last_assistant['tool_calls'][-1]['function']['arguments'])['attributeIds']
    print("EXTRACTED ATTRIBUTE IDS: " + str(attr_ids))
    return attr_ids



def get_personal_statement_text(profile_url):
    """
    Fetch the page at profile_url and return all the text
    inside elements with class 'personal-statement'.
    """

    headers = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/125.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Referer": "https://www.google.ca/",
    }

    resp = requests.get(profile_url, headers=headers)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, 'html.parser')

    # find all elements with the 'personal-statement' class:
    elems = soup.select('.personal-statement')
    # extract and clean their text, flattening nested tags:
    texts = [
        elem.get_text(separator=' ', strip=True)
        for elem in elems
    ]
    # join multiple statements (if any) into one string:
    return ' '.join(texts)


def get_therapist_profile_data(profiles):
    """
    Given a list of profile dicts, fetch each profile page
    and add a 'personalStatement' field containing its text.
    """
    enriched = []
    for profile in profiles:
        print("profile: " + str(profile.get("listingName")))
        url = profile.get("canonicalUrl")
        if not url:
            continue
        print("url: " + str(url))
        profile["personalStatement"] = get_personal_statement_text(url)
        print("personalStatement: " + str(profile.get("personalStatement")))
        print("--------------------------------")
        enriched.append(profile)
    return enriched