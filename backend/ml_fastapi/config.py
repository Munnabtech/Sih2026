"""Centralized configuration for the DHARANETRA ML service.

Risk classification thresholds live HERE, in exactly one place. The web
frontend receives the final risk level from this API and never re-derives
it, so model output is classified consistently for every consumer.
"""
from pathlib import Path

# Directory that holds the .pkl model artifacts. Drop the uploaded
# DHARANETRA model files in here before starting the service.
MODELS_DIR = Path(__file__).resolve().parent / "models"

# Model file name -> capability tag. Add or remove entries to match the
# actual .pkl files you deploy.
MODEL_FILES = {
    "landslide_model.pkl": {"capability": "landslide"},
    "satellite_model.pkl": {"capability": "satellite"},
    "iot_alert_model.pkl": {"capability": "iot-alert"},
}

# Risk thresholds: probability -> level. The interval is [lo, hi).
# A probability of exactly 0.8 is classified CRITICAL.
RISK_THRESHOLDS = {
    "LOW": (0.0, 0.4),
    "MODERATE": (0.4, 0.6),
    "HIGH": (0.6, 0.8),
    "CRITICAL": (0.8, 1.0001),
}


def classify(probability: float) -> str:
    """Map a model probability to a single risk level."""
    if probability < 0:
        probability = 0.0
    if probability > 1:
        probability = 1.0
    for level, (low, high) in RISK_THRESHOLDS.items():
        if low <= probability < high:
            return level
    return "CRITICAL"


# Optional: when a model was pickled without feature_names_in_ metadata,
# declare the exact feature order here so requests are validated instead of
# guessed. Key by capability tag.
#
# FEATURE_ORDER_OVERRIDES = {
#     "landslide": ["rainfall_mm", "soil_moisture_pct", "slope_deg",
#                   "elevation_m", "vegetation_index", "historic_slides_km"],
# }
FEATURE_ORDER_OVERRIDES = {}