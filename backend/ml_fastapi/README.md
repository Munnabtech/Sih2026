# DHARANETRA ML Service (FastAPI)

Reference backend that loads the DHARANETRA `.pkl` model artifacts and serves
real predictions to the web platform. The web app never touches the model
files — it talks to this service over HTTP through Convex actions.

```
Web frontend (React)  ->  Convex action  ->  this FastAPI service  ->  .pkl models
```

## Setup

1. Place your uploaded `.pkl` files in `backend/ml_fastapi/models/`:

   - `landslide_model.pkl`  (landslide risk prediction)
   - `satellite_model.pkl`  (satellite-derived risk)
   - `iot_alert_model.pkl`  (IoT telemetry alerting)

   Filenames and capability tags are configured in `config.py`
   (`MODEL_FILES`) — rename files there if the artifacts use other names.

2. Install and run:

   ```bash
   cd backend/ml_fastapi
   pip install -r requirements.txt
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

3. In the DHARANETRA web project's Keys UI, set:
   - `ML_API_URL` — e.g. `https://dharanetra-ml.yourdomain.com` (no trailing slash)
   - `ML_API_KEY` — optional bearer token; the service does not require it by
     default, but you can add middleware to enforce one.

## Endpoints

| Method | Path                   | Purpose                                        |
| ------ | ---------------------- | ---------------------------------------------- |
| GET    | `/api/v1/ml/status`    | Which models are loaded, their features, classes, capabilities |
| POST   | `/api/v1/ml/landslide` | Landslide risk prediction from model features  |
| POST   | `/api/v1/ml/satellite` | Satellite-derived risk prediction              |
| POST   | `/api/v1/ml/iot-alert` | IoT telemetry alert prediction                 |

Request body for prediction endpoints:

```json
{
  "features": {
    "rainfall_mm": 18.0,
    "soil_moisture_pct": 86.0
  }
}
```

The feature keys must match the model's `feature_names_in_` exactly. If a
pickle does not carry feature names, add `FEATURE_ORDER_OVERRIDES` in
`config.py` — the service refuses to guess.

Landslide response:

```json
{
  "prediction": "landslide_risk",
  "risk_probability": 0.82,
  "risk_percentage": 82,
  "risk_level": "HIGH",
  "model": "landslide_model.pkl",
  "model_status": "active"
}
```

`risk_level` is classified from `risk_probability` using the single source of
truth in `config.py` (`RISK_THRESHOLDS`).

## Honest failure states

- Model file missing / load failure → `/status` lists the model as
  `loaded: false`; prediction endpoints return `503`.
- Missing features → `422` with the exact missing-feature list.
- Feature metadata unknown and no override configured → `503`
  ("refusing to guess").
- Service unreachable from the web app → the frontend shows
  **"Backend not reachable"** — no fallback prediction is generated.

## Verification checklist

1. `GET /api/v1/ml/status` — confirm every `.pkl` loads.
2. `POST /api/v1/ml/landslide` with valid sample inputs from the model's own
   feature list — confirm the response came from the real model.
3. Send missing/invalid inputs — confirm `422` with the missing list.
4. Stop the service — confirm the website shows "Backend not reachable"
   rather than a fake number.
5. Confirm dashboard/map values shown in the website match the API responses
   byte for byte.