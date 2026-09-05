"""
MedLens Clinical Intelligence Backend (Python FastAPI Version)
Deterministic Reference-Range Engine & Gemini Multimodal Extraction
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Union, Dict, Any
import datetime
import re

app = FastAPI(
    title="MedLens Clinical Information Intelligence API",
    description="Deterministic Validation Layer, WHO-ATC Safety Radar, and Gemini Multimodal Medical Ingestion",
    version="2.5.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Data Models ---

class ReferenceRangeModel(BaseModel):
    low: Optional[float] = None
    high: Optional[float] = None
    text_range: str = "Unspecified by Laboratory"
    is_present: bool = False

class BiomarkerReadingModel(BaseModel):
    id: str
    test_name: str
    category: str = "Other"
    value: Union[float, str]
    unit: str = ""
    reference_range: ReferenceRangeModel
    status: str = "NORMAL"
    date_collected: str = Field(default_factory=lambda: datetime.date.today().isoformat())
    specimen_type: Optional[str] = "Blood"
    confidence: float = 1.0
    needs_review: bool = False
    source_snippet: str = ""
    provenance: str = "EXTRACTED_VERIFIED"
    notes: Optional[str] = None

class PatientAllergy(BaseModel):
    substance: str
    reaction: str = "Allergic reaction"
    severity: str = "Moderate"

class PatientMedication(BaseModel):
    name: str
    dosage: str = ""
    frequency: str = ""
    prescribed_for: Optional[str] = None

class PatientProfileModel(BaseModel):
    id: str
    name: str
    age: int
    sex: str
    symptoms: List[str] = []
    conditions: List[str] = []
    medications: List[PatientMedication] = []
    allergies: List[PatientAllergy] = []
    notes: Optional[str] = None
    provenance: str = "USER_REPORTED"

# --- Deterministic Range Evaluator ---

def evaluate_biomarker_status(test_name: str, raw_val: Union[float, str], ref_range: ReferenceRangeModel) -> str:
    """Evaluates values deterministically without LLM hallucination."""
    if not ref_range.is_present or not ref_range.text_range or "unspecified" in ref_range.text_range.lower():
        return "UNSPECIFIED"

    clean_range = ref_range.text_range.strip()

    # Qualitative evaluation
    if isinstance(raw_val, str) and not raw_val.replace(".", "", 1).isdigit():
        if "negative" in clean_range.lower() or "non-reactive" in clean_range.lower():
            if "positive" in raw_val.lower() or "reactive" in raw_val.lower():
                return "HIGH"
        return "NORMAL"

    try:
        numeric_val = float(str(raw_val).replace(",", "").replace("*", "").strip())
    except ValueError:
        return "UNSPECIFIED"

    # Critical thresholds check
    name_lower = test_name.lower()
    if "potassium" in name_lower and (numeric_val < 2.8 or numeric_val > 6.2):
        return "CRITICAL"
    if "glucose" in name_lower and (numeric_val < 50 or numeric_val > 380):
        return "CRITICAL"
    if "platelet" in name_lower and numeric_val < 25:
        return "CRITICAL"

    # Interval parsing: e.g. "70 - 99"
    interval_match = re.match(r"^([0-9.]+)\s*[-–—to]+\s*([0-9.]+)$", clean_range)
    if interval_match:
        low = float(interval_match.group(1))
        high = float(interval_match.group(2))
        if numeric_val < low:
            return "LOW"
        elif numeric_val > high:
            return "HIGH"
        return "NORMAL"

    # Less-than bound: e.g. "< 5.7"
    lt_match = re.match(r"^[<≤]\s*([0-9.]+)$", clean_range)
    if lt_match:
        high = float(lt_match.group(1))
        return "HIGH" if numeric_val >= high else "NORMAL"

    # Greater-than bound: e.g. "> 60"
    gt_match = re.match(r"^[>≥]\s*([0-9.]+)$", clean_range)
    if gt_match:
        low = float(gt_match.group(1))
        return "LOW" if numeric_val <= low else "NORMAL"

    return "NORMAL"

# --- Endpoints ---

@app.get("/api/health")
def healthcheck():
    return {
        "status": "online",
        "service": "MedLens Python FastAPI Clinical Intelligence API",
        "version": "2.5.0",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }

@app.post("/api/evaluate")
def evaluate_endpoint(test_name: str, value: Union[float, str], reference_range: ReferenceRangeModel):
    status = evaluate_biomarker_status(test_name, value, reference_range)
    return {"test_name": test_name, "value": value, "status": status}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)
