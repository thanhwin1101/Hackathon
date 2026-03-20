import logging
import os
from pathlib import Path
from typing import List, Optional

from langchain_chroma import Chroma
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.config import Settings

logger = logging.getLogger(__name__)

DOCTOR_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "Ban la tro ly y te (bac si ao), chi dua ra thong tin giao duc suc khoe, "
            "khong thay the chan doan hay dieu tri cua bac si that. "
            "Neu tinh trang nguy cap (dau nguc, tho gap, ngat, BPM cuc cao/thap keo dai), "
            "khuyen ngoi goi cap cuu hoac den co so y te ngay.\n"
            "Tra loi bang tieng Viet, ngan gon, ro rang, co goi y theo doi va khi nao can kham bac si.",
        ),
        (
            "human",
            "Nhip tim hien tai: {bpm} BPM.\n"
            "{extra}\n\n"
            "Tai lieu tham khao (trich tu huong dan noi bo):\n{context}\n\n"
            "Hay dua ra loi khuyen ca nhan hoa dua tren BPM va tai lieu tren.",
        ),
    ]
)

_EMBEDDINGS_PROVIDER_MARKER = ".embeddings_provider"


def _get_embeddings_provider(settings: Settings) -> str:
    if settings.openai_api_key:
        return "openai"
    if settings.gemini_api_key:
        return "gemini"
    return ""


def _build_embeddings(settings: Settings) -> object:
    provider = _get_embeddings_provider(settings)
    if provider == "openai":
        return OpenAIEmbeddings(model=settings.embedding_model, api_key=settings.openai_api_key)
    if provider == "gemini":
        return GoogleGenerativeAIEmbeddings(
            model=settings.gemini_embedding_model,
            google_api_key=settings.gemini_api_key,
        )
    raise ValueError("Thieu OPENAI_API_KEY hoac GEMINI_API_KEY trong .env")


def _get_chat_model(settings: Settings) -> object:
    if settings.openai_api_key:
        return ChatOpenAI(
            model=settings.openai_model,
            temperature=0.2,
            api_key=settings.openai_api_key,
        )
    if settings.gemini_api_key:
        return ChatGoogleGenerativeAI(
            model=(settings.gemini_model or "").strip(),
            temperature=0.2,
            api_key=settings.gemini_api_key,
        )
    raise ValueError("Thieu OPENAI_API_KEY hoac GEMINI_API_KEY trong .env")


def _load_documents(settings: Settings) -> List[Document]:
    pdf_path = Path(settings.knowledge_pdf_path)
    txt_path = Path(settings.knowledge_txt_fallback)
    docs: List[Document] = []

    if pdf_path.is_file():
        try:
            docs.extend(PyPDFLoader(str(pdf_path)).load())
            logger.info("Da nap PDF: %s", pdf_path)
        except Exception as e:
            logger.exception("Loi doc PDF: %s", e)
    if not docs and txt_path.is_file():
        docs.extend(TextLoader(str(txt_path), encoding="utf-8").load())
        logger.info("Da nap TXT fallback: %s", txt_path)

    if not docs:
        raise FileNotFoundError(
            "Khong tim thay tai lieu: them file PDF hoac TXT trong thu muc knowledge/"
        )
    return docs


def build_vectorstore(settings: Settings, force_rebuild: bool = False) -> Chroma:
    os.makedirs(settings.chroma_persist_dir, exist_ok=True)
    provider = _get_embeddings_provider(settings)
    if not provider:
        raise ValueError("Thieu OPENAI_API_KEY hoac GEMINI_API_KEY trong .env")

    embeddings = _build_embeddings(settings)

    persist = Path(settings.chroma_persist_dir)
    marker = persist / _EMBEDDINGS_PROVIDER_MARKER
    prev_provider = marker.read_text(encoding="utf-8").strip() if marker.exists() else None
    force_rebuild = force_rebuild or (prev_provider is not None and prev_provider != provider)

    if not force_rebuild and persist.exists() and any(persist.iterdir()):
        return Chroma(
            persist_directory=settings.chroma_persist_dir,
            embedding_function=embeddings,
        )

    documents = _load_documents(settings)
    splitter = RecursiveCharacterTextSplitter(chunk_size=900, chunk_overlap=120)
    chunks = splitter.split_documents(documents)

    if force_rebuild and persist.exists():
        import shutil

        shutil.rmtree(settings.chroma_persist_dir, ignore_errors=True)
        os.makedirs(settings.chroma_persist_dir, exist_ok=True)

    vs = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=settings.chroma_persist_dir,
    )
    Path(settings.chroma_persist_dir, _EMBEDDINGS_PROVIDER_MARKER).write_text(
        provider, encoding="utf-8"
    )
    return vs


class VirtualDoctorRAG:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._vs: Optional[Chroma] = None
        self._llm: Optional[object] = None

    def ensure_ready(self) -> None:
        provider = _get_embeddings_provider(self._settings)
        if not provider:
            raise ValueError("Thieu OPENAI_API_KEY hoac GEMINI_API_KEY trong .env")
        if self._vs is None:
            self._vs = build_vectorstore(self._settings)
        if self._llm is None:
            self._llm = _get_chat_model(self._settings)

    def advise(self, bpm: int, extra_context: Optional[str] = None, k: int = 4) -> tuple[str, int]:
        self.ensure_ready()
        assert self._vs is not None and self._llm is not None

        retriever = self._vs.as_retriever(search_kwargs={"k": k})
        docs = retriever.invoke(f"nhá»‹p tim {bpm} BPM báº¥t thÆ°á»ng tá»©c thĂ¬ hÆ°á»›ng dáº«n")
        context = "\n\n".join(d.page_content for d in docs)

        chain = DOCTOR_PROMPT | self._llm
        msg = chain.invoke(
            {
                "bpm": bpm,
                "extra": extra_context or "(Khong co them trieu chung.)",
                "context": context or "(Khong trich duoc doan lien quan.)",
            }
        )
        content = getattr(msg, "content", None)
        if isinstance(content, str):
            text = content
        elif isinstance(content, list):
            parts: list[str] = []
            for p in content:
                if isinstance(p, dict) and p.get("type") == "text":
                    t = p.get("text")
                    if isinstance(t, str):
                        parts.append(t)
            text = "\n".join(parts).strip() if parts else str(content)
        else:
            text = str(content if content is not None else msg)

        return text, len(docs)
