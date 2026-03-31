import os
import json
import logging
import time
from typing import List, Dict, Any, Optional
from models import GenerateRequest, GenerateResponse, ItineraryDay, ItineraryItem

logger = logging.getLogger(__name__)

def build_travel_prompt(req: GenerateRequest) -> str:
    """Builds a sophisticated prompt for the AI model."""
    days = req.days or max(1, len(req.services))
    
    prompt = f"""You are an expert travel agent. Create a detailed, engaging {days}-day travel itinerary for a client.

Client Information:
- Name: {req.client.name}
- Preferences: {req.client.preferences or 'None specified'}

Reservation Details:
- Reservation No: {req.reservation.reservation_no}
- Status: {req.reservation.status or 'Unknown'}

Booked Services:
"""
    for s in req.services:
        prompt += f"- {s.name or s.destination or s.code or 'Service'} ({s.type or 'Unknown type'})"
        if s.destination:
            prompt += f" in {s.destination}"
        if s.latitude and s.longitude:
            prompt += f" [Location: {s.latitude}, {s.longitude}]"
        if s.description:
            prompt += f"\n  Description: {s.description}"
        prompt += "\n"

    prompt += f"""
Requirements:
1. Create a {days}-day itinerary incorporating the booked services.
2. Add logical morning, afternoon, and evening activities.
3. Include estimated times for each activity.
4. Provide travel tips and local recommendations.
5. Ensure the itinerary flows logically based on locations.

You MUST respond with ONLY a valid JSON object matching this exact structure:
{{
  "title": "Catchy Itinerary Title",
  "summary": "Brief overview of the trip",
  "days": [
    {{
      "day": 1,
      "theme": "Theme of the day",
      "items": [
        {{
          "time": "09:00",
          "title": "Activity name",
          "description": "Detailed description",
          "location": "Place name",
          "latitude": 36.8,
          "longitude": 10.1,
          "tips": "Local tips"
        }}
      ]
    }}
  ],
  "recommendations": ["Tip 1", "Tip 2"]
}}
"""
    return prompt

def generate_itinerary_with_openai(prompt: str) -> str:
    """Generates itinerary using OpenAI API with retries."""
    from openai import OpenAI
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    
    for attempt in range(3):
        try:
            logger.info(f"OpenAI attempt {attempt + 1}")
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are an expert travel agent. Always respond with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"OpenAI error on attempt {attempt + 1}: {e}")
            if attempt == 2:
                raise
            time.sleep(1)
    return ""

def generate_itinerary_with_gemini(prompt: str) -> str:
    """Generates itinerary using Google Gemini API with retries."""
    import google.generativeai as genai
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
    model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    model = genai.GenerativeModel(model_name)
    
    for attempt in range(3):
        try:
            logger.info(f"Gemini attempt {attempt + 1}")
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.7,
                    response_mime_type="application/json",
                )
            )
            return response.text.strip()
        except Exception as e:
            logger.error(f"Gemini error on attempt {attempt + 1}: {e}")
            if attempt == 2:
                raise
            time.sleep(1)
    return ""

def parse_ai_response(text: str) -> Dict[str, Any]:
    """Parses the AI JSON response."""
    try:
        # Sometimes models wrap JSON in markdown blocks
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        return json.loads(text.strip())
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse AI response as JSON: {e}\nResponse: {text}")
        raise ValueError("Invalid JSON response from AI")

def _generate_summary(req: GenerateRequest, days: List[ItineraryDay]) -> str:
    lines = [
        f"=== Itinerary for {req.client.name} ===",
        f"Reservation: {req.reservation.reservation_no}",
        f"Days: {len(days)}",
        ""
    ]
    for day in days:
        lines.append(f"Day {day.day}:")
        for item in day.items:
            lines.append(f"  • {item.time or ''} {item.title}")
            if item.description:
                lines.append(f"    {item.description[:100]}")
    return "\n".join(lines)

def _fallback_itinerary(req: GenerateRequest, source: str = "fallback", ai_data: Dict[str, Any] = None) -> GenerateResponse:
    if ai_data:
        try:
            days = []
            for d in ai_data.get("days", []):
                items = []
                for i in d.get("items", []):
                    items.append(ItineraryItem(
                        time=i.get("time"),
                        title=i.get("title", "Activity"),
                        description=i.get("description", ""),
                        location=i.get("location"),
                        latitude=float(i.get("latitude", 0.0)),
                        longitude=float(i.get("longitude", 0.0)),
                        tips=i.get("tips")
                    ))
                days.append(ItineraryDay(
                    day=int(d.get("day", 1)),
                    theme=d.get("theme"),
                    items=items
                ))
            
            return GenerateResponse(
                client_id=req.client.id,
                reservation_no=req.reservation.reservation_no,
                title=ai_data.get("title"),
                summary=ai_data.get("summary") or _generate_summary(req, days),
                days=days,
                recommendations=ai_data.get("recommendations"),
                source=source
            )
        except Exception as e:
            logger.error(f"Error mapping AI data to models: {e}")
            # Fall through to fallback generation

    # Fallback generation
    items: List[ItineraryDay] = []
    n = max(1, req.days or len(req.services) or 1)
    per_day = max(1, (len(req.services) + n - 1) // n)
    day = 1
    buf: List[ItineraryItem] = []
    for idx, s in enumerate(req.services):
        lat = float(s.latitude or 0.0)
        lon = float(s.longitude or 0.0)
        title = s.name or s.destination or s.code or f"Stop {idx+1}"
        desc = s.description or f"{s.type or 'Service'} in {s.destination or s.name or ''}".strip()
        buf.append(ItineraryItem(
            time="09:00",
            title=title, 
            description=desc, 
            location=s.destination,
            latitude=lat, 
            longitude=lon
        ))
        if len(buf) >= per_day:
            items.append(ItineraryDay(day=day, theme="Discovery", items=list(buf)))
            buf.clear()
            day += 1
    if buf:
        items.append(ItineraryDay(day=day, theme="Discovery", items=list(buf)))
        
    summary = _generate_summary(req, items)
        
    return GenerateResponse(
        client_id=req.client.id, 
        reservation_no=req.reservation.reservation_no, 
        title=f"Itinerary for {req.client.name}",
        summary=summary,
        days=items, 
        recommendations=["Enjoy your trip!"],
        source="fallback"
    )

def generate_itinerary(req: GenerateRequest) -> GenerateResponse:
    provider = os.getenv("AI_PROVIDER", "").lower()
    prompt = build_travel_prompt(req)
    
    ai_text = ""
    try:
        if provider == "openai" and os.getenv("OPENAI_API_KEY"):
            ai_text = generate_itinerary_with_openai(prompt)
        elif provider == "gemini" and os.getenv("GEMINI_API_KEY"):
            ai_text = generate_itinerary_with_gemini(prompt)
        else:
            logger.warning("No valid AI provider configured. Using fallback.")
            
        if ai_text:
            ai_data = parse_ai_response(ai_text)
            return _fallback_itinerary(req, source="ai", ai_data=ai_data)
    except Exception as e:
        logger.error(f"AI generation failed: {e}")
        
    return _fallback_itinerary(req, source="fallback")
