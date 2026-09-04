"""DHARANETRA ML service — FastAPI entry point.

Loads the .pkl models once at startup and serves real model inference to the
DHARANETRA web platform. No predictions are fabricated: if a model is not
loaded, or the request does not supply the exact features the model needs,
the API returns an explicit error.

Run (from this directory, with the .pkl files in ./models):

    pip install -r requirements.txt
    uvicorn main:app --host 0.0.0.0 --port 8000
"""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException

from config import RISK_THRESHOLDS, classify
from models import (
    MissingFeaturesError,
    ModelNotLoadedError,
    UnknownFeaturesError,
    registry,
)
from schemas import FeaturesRequest, GenericPredictionResponse, LandslideResponse


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Models load exactly once, at startup.
    registry.load()
    yield


app = FastAPI(
    title="DHARANETRA ML Service",
    version="1.0.0",
    lifespan=lifespan,
)


def _prediction_payload(capability: str, request: FeaturesRequest) -> dict:
    handle = registry.get(capability)
    if handle is None:
        raise ModelNotLoadedError(capability)
    result = handle.predict(request.features)
    probability = result["risk_probability"]
    return {
        "prediction": result["prediction"],
        "risk_probability": probability,
        "risk_percentage": result["risk_percentage"],
        "risk_level": classify(probability) if probability is not None else None,
        "model": handle.filename,
        "model_status": "active",
    }


@app.get("/api/v1/ml/status")
def ml_status() -> dict:
    """Model registry health. Reports loaded/not-loaded per model."""
    status = registry.status()
    return {
        "backend": status["backend"],
        "models": status["models"],
        "thresholds": {
            level: {"min": lo, "max_exclusive": hi}
            for level, (lo, hi) in RISK_THRESHOLDS.items()
        },
    }


@app.post("/api/v1/ml/landslide", response_model=LandslideResponse)
def predict_landslide(request: FeaturesRequest) -> dict:
    try:
        return _prediction_payload("landslide", request)
    except MissingFeaturesError as exc:
        raise HTTPException(422, detail=f"Missing required features: {', '.join(exc.missing)}")
    except (ModelNotLoadedError, UnknownFeaturesError) as exc:
        raise HTTPException(503, detail=str(exc))


@app.post("/api/v1/ml/satellite", response_model=GenericPredictionResponse)
def predict_satellite(request: FeaturesRequest) -> dict:
    try:
        return _prediction_payload("satellite", request)
    except MissingFeaturesError as exc:
        raise HTTPException(422, detail=f"Missing required features: {', '.join(exc.missing)}")
    except (ModelNotLoadedError, UnknownFeaturesError) as exc:
        raise HTTPException(503, detail=str(exc))


@app.post("/api/v1/ml/iot-alert", response_model=GenericPredictionResponse)
def predict_iot_alert(request: FeaturesRequest) -> dict:
    try:
        return _prediction_payload("iot-alert", request)
    except MissingFeaturesError as exc:
        raise HTTPException(422, detail=f"Missing required features: {', '.join(exc.missing)}")
    except (ModelNotLoadedError, UnknownFeaturesError) as exc:
        raise HTTPException(503, detail=str(exc))