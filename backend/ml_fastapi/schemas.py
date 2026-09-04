"""Request/response schemas for the DHARANETRA ML API."""
from pydantic import BaseModel, Field


class FeaturesRequest(BaseModel):
    """Numeric features for a single prediction.

    The feature keys must match the model's feature_names_in_ exactly (or the
    FEATURE_ORDER_OVERRIDES list in config.py). The API validates them and
    returns 422 with the missing list — it never silently substitutes values.
    """

    features: dict[str, float] = Field(..., description="Model input features")


class LandslideResponse(BaseModel):
    prediction: str
    risk_probability: float
    risk_percentage: int
    risk_level: str
    model: str
    model_status: str


class GenericPredictionResponse(BaseModel):
    prediction: str
    risk_percentage: int | None
    risk_level: str | None
    model: str
    model_status: str