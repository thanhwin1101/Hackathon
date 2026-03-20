"""
Xoa va xay lai ChromaDB tu PDF (uu tien) hoac file TXT fallback.

Chay tu thu muc backend:
  python scripts/rebuild_chroma.py
"""
import os
import shutil
import sys
from pathlib import Path

_backend = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(_backend))
os.chdir(_backend)

from dotenv import load_dotenv

load_dotenv()

from app.config import get_settings
from app.services.rag_doctor import build_vectorstore


def main() -> None:
    s = get_settings()
    if os.path.isdir(s.chroma_persist_dir):
        shutil.rmtree(s.chroma_persist_dir, ignore_errors=True)
    os.makedirs(s.chroma_persist_dir, exist_ok=True)
    build_vectorstore(s, force_rebuild=True)
    print("Da xay lai vector store tai:", s.chroma_persist_dir)


if __name__ == "__main__":
    main()
