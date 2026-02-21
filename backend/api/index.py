"""Vercel serverless entry point for the FastAPI backend."""
import sys
import os

# Add parent directory to path so app module is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
