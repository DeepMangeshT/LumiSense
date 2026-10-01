"""Direct launcher script for LumiSense Backend API.
Usage:
    python run.py
"""
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import uvicorn

if __name__ == "__main__":
    print("=" * 60)
    print("  LumiSense - IoT & ML Energy Usage Monitoring System")
    print("  Starting FastAPI server on http://localhost:8000")
    print("  Interactive OpenAPI Docs: http://localhost:8000/docs")
    print("=" * 60)
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
