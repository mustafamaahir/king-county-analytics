"""
services/groq_service.py
Single Groq client used by all route handlers.
Each tab passes its own context dict and prompt template.
"""

import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

SYSTEM_PROMPT = """You are a senior data scientist presenting findings to a 
business audience. Write in clear, professional prose. Be specific — 
reference the actual numbers provided. Keep responses to 3–4 sentences. 
Never use bullet points. Never say 'certainly' or 'great question' or 'our analysis'."""


def get_interpretation(context: dict, prompt_template: str) -> str:
    """
    Call Groq with a context dict injected into the prompt template.
    Returns the interpretation string or a fallback message on failure.
    """
    prompt = prompt_template.format(**context)
    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": prompt},
            ],
            temperature=0.4,
            max_tokens=220,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"AI interpretation unavailable: {str(e)}"


# ── Tab-specific prompt templates ────────────────────────────────────
PROMPTS = {

    "overview": (
        "The King County housing dataset covers {total_properties} residential property sales "
        "from {date_range}. The median sale price is ${median_price:,} with a range of "
        "{price_range}. The median living area is {median_sqft} sqft. "
        "Only {waterfront_pct}% of properties are waterfront. {renovated_pct}% have been renovated. "
        "Grade 11+ properties have a median price of ${top_grade_median:,}. "
        "Interpret what this tells us about the King County market structure and "
        "what a first-time analyst should know before diving deeper."
    ),

    "trends": (
        "King County house prices changed by {price_change_pct}% between {observation_window}. "
        "Sales volume peaked in {peak_volume_month}. Seasonal decomposition shows that "
        "{seasonal_variance_pct}% of price variance is attributable to seasonal cycles. "
        "The cheapest month to buy is {cheapest_month} and the most expensive is {priciest_month}. "
        "Waterfront properties command a median premium of ${waterfront_premium:,} over non-waterfront. "
        "Interpret what these trends mean for buyers considering timing their purchase."
    ),

    "segments": (
        "K-Means clustering (silhouette score: {silhouette_score}) identified {n_clusters} distinct "
        "property segments in King County. Market composition: Entry-Level {entry_share_pct}%, "
        "Mid-Market {mid_share_pct}%, Premium {premium_share_pct}%, Luxury {luxury_share_pct}%. "
        "Entry-level median: ${entry_median_price:,}. Luxury median: ${luxury_median_price:,}. "
        "{luxury_waterfront_pct}% of Luxury properties are waterfront. "
        "Explain why treating this as a single homogeneous market would lead to flawed pricing decisions."
    ),

    "drivers": (
        "A Random Forest model (R²={r2_score}, MAE=${mae:,}, MAPE={mape}%) was trained on "
        "King County housing data. The top predictor is '{top_feature}' ({top_feature_pct}% importance), "
        "followed by '{second_feature}' ({second_feature_pct}% importance). "
        "The top 3 features combined explain {top3_combined_pct}% of variance. "
        "Waterfront status contributes {waterfront_importance}% importance. "
        "Moving from grade 7 to grade 8 adds an average of ${grade_7_to_8_delta:,}. "
        "Explain what these findings mean for someone deciding whether to renovate before selling."
    ),

    "actions": (
        "Analysis of King County housing data yields these actionable findings: "
        "Renovated properties sell for ${reno_premium:,} more than non-renovated equivalents. "
        "ZIP code {top_undervalued_zip} is the most undervalued area (price per sqft: ${top_zip_price_psf}). "
        "The 3-month price forecast is ${forecast_3m_price:,}, a change of {forecast_change_pct}% "
        "from the current median of ${current_median:,}. "
        "The primary price driver for Entry-Level properties is '{entry_top_driver}', "
        "while for Luxury properties it is '{luxury_top_driver}'. "
        "Synthesise these into a ranked set of recommendations for a property investor."
    ),
}
