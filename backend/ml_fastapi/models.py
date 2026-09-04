"""Model registry — loads the DHARANETRA .pkl models once at startup.

Design rules:
- Models are loaded a single time when the FastAPI server starts, never per
  request.
- Every model is inspected for predict(), predict_proba(), feature_names_in_
  and classes_ so the API can report capabilities honestly.
- If a model's required features cannot be determined, the service refuses
  to guess and reports the model as requiring configuration.
"""
from __future__ import annotations

import joblib
import numpy as np

from config import FEATURE_ORDER_OVERRIDES, MODEL_FILES, MODELS_DIR


class ModelNotLoadedError(Exception):
    def __init__(self, capability: str):
        super().__init__(f"No {capability} model is loaded.")
        self.capability = capability


class MissingFeaturesError(Exception):
    def __init__(self, missing: list[str]):
        super().__init__(f"Missing required features: {', '.join(missing)}")
        self.missing = missing


class UnknownFeaturesError(Exception):
    def __init__(self, capability: str):
        super().__init__(
            f"The {capability} model does not expose feature names and no "
            "FEATURE_ORDER_OVERRIDES entry is configured. Refusing to guess."
        )
        self.capability = capability


class ModelHandle:
    def __init__(self, filename: str, estimator, capability: str):
        self.filename = filename
        self.estimator = estimator
        self.capability = capability
        self.has_predict = callable(getattr(estimator, "predict", None))
        self.has_proba = callable(getattr(estimator, "predict_proba", None))
        raw_names = getattr(estimator, "feature_names_in_", None)
        if raw_names is not None:
            self.feature_names = [str(f) for f in raw_names]
        elif capability in FEATURE_ORDER_OVERRIDES:
            self.feature_names = list(FEATURE_ORDER_OVERRIDES[capability])
        else:
            self.feature_names = None
        classes = getattr(estimator, "classes_", None)
        self.classes = [str(c) for c in classes] if classes is not None else None

    # -- prediction -------------------------------------------------------
    def predict(self, features: dict[str, float]) -> dict:
        if not self.has_predict:
            raise ModelNotLoadedError(self.capability)
        if self.feature_names is None:
            raise UnknownFeaturesError(self.capability)
        missing = [f for f in self.feature_names if f not in features]
        if missing:
            raise MissingFeaturesError(missing)

        row = np.array([[features[f] for f in self.feature_names]], dtype=float)
        prediction = self.estimator.predict(row)[0]
        label = str(prediction)

        # Positive-class probability: for binary classifiers use the second
        # class; for multiclass use the probability of the predicted class.
        probability: float | None = None
        if self.has_proba:
            proba = np.asarray(self.estimator.predict_proba(row))[0]
            if proba.ndim == 1 and proba.shape[0] == 2:
                probability = float(proba[1])
            else:
                index = int(
                    np.where(np.asarray(self.classes or []) == label)[0][0]
                ) if self.classes is not None else 0
                probability = float(proba[index])

        return {
            "prediction": label,
            "risk_probability": probability,
            "risk_percentage": (
                round(float(probability) * 100) if probability is not None else None
            ),
        }


class ModelRegistry:
    def __init__(self) -> None:
        self.models: dict[str, ModelHandle] = {}
        self.errors: list[dict] = []

    def load(self) -> list[dict]:
        """Load every declared model. Returns per-model load errors."""
        for filename, meta in MODEL_FILES.items():
            path = MODELS_DIR / filename
            if not path.exists():
                self.errors.append(
                    {"model": filename, "loaded": False, "reason": "file not found"}
                )
                continue
            try:
                estimator = joblib.load(path)
                handle = ModelHandle(filename, estimator, meta["capability"])
                self.models[meta["capability"]] = handle
            except Exception as exc:  # noqa: BLE001 - report, never crash startup
                self.errors.append(
                    {"model": filename, "loaded": False, "reason": str(exc)}
                )
        return self.errors

    def get(self, capability: str) -> ModelHandle | None:
        return self.models.get(capability)

    def status(self) -> dict:
        models = []
        for capability, handle in self.models.items():
            models.append(
                {
                    "name": handle.filename,
                    "capability": capability,
                    "loaded": True,
                    "capabilities": (
                        ["predict", "predict_proba"] if handle.has_proba else ["predict"]
                    ),
                    "required_features": handle.feature_names or [],
                    "classes": handle.classes or [],
                }
            )
        for err in self.errors:
            models.append(
                {
                    "name": err["model"],
                    "capability": err.get("capability"),
                    "loaded": False,
                    "reason": err["reason"],
                    "capabilities": [],
                    "required_features": [],
                    "classes": [],
                }
            )
        return {
            "backend": "ok" if self.models else "degraded",
            "models": models,
        }


registry = ModelRegistry()