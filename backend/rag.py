import os
from pathlib import Path
from typing import List, Dict
from dotenv import load_dotenv

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory

import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

VECTORSTORE_DIR = Path("vectorstore")
VECTORSTORE_DIR.mkdir(exist_ok=True)

# In-memory store for chains per session
_chains: Dict[str, ConversationalRetrievalChain] = {}
_vectorstores: Dict[str, FAISS] = {}


def ingest_pdfs(file_paths: List[str], session_id: str):
    """Load PDFs, split into chunks, embed and store in FAISS."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not set in .env file.")

    all_docs = []
    for path in file_paths:
        loader = PyPDFLoader(path)
        docs = loader.load()
        all_docs.extend(docs)

    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = splitter.split_documents(all_docs)

    embeddings = GoogleGenerativeAIEmbeddings(
        model="models/gemini-embedding-001",
        google_api_key=api_key
    )

    vectorstore = FAISS.from_documents(chunks, embeddings)
    vectorstore_path = str(VECTORSTORE_DIR / session_id)
    vectorstore.save_local(vectorstore_path)
    _vectorstores[session_id] = vectorstore

    # Build chain
    _chains[session_id] = _build_chain(vectorstore, api_key)


def _build_chain(vectorstore: FAISS, api_key: str) -> ConversationalRetrievalChain:
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=api_key,
        temperature=0.3,
        convert_system_message_to_human=True
    )
    memory = ConversationBufferMemory(
        memory_key="chat_history",
        return_messages=True,
        output_key="answer"
    )
    retriever = vectorstore.as_retriever(search_kwargs={"k": 5})
    chain = ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=retriever,
        memory=memory,
        return_source_documents=True,
        output_key="answer"
    )
    return chain


def ask_question(question: str, session_id: str) -> Dict:
    """Answer a question using the stored vectorstore for the session."""
    api_key = os.getenv("GEMINI_API_KEY")

    if session_id not in _chains:
        # Try to reload from disk
        vectorstore_path = str(VECTORSTORE_DIR / session_id)
        if not Path(vectorstore_path).exists():
            raise ValueError("Session not found. Please upload PDFs first.")
        embeddings = GoogleGenerativeAIEmbeddings(
            model="models/gemini-embedding-001",
            google_api_key=api_key
        )
        vectorstore = FAISS.load_local(
            vectorstore_path,
            embeddings,
            allow_dangerous_deserialization=True
        )
        _vectorstores[session_id] = vectorstore
        _chains[session_id] = _build_chain(vectorstore, api_key)

    chain = _chains[session_id]
    result = chain.invoke({"question": question})

    sources = []
    for doc in result.get("source_documents", []):
        source = doc.metadata.get("source", "Unknown")
        page = doc.metadata.get("page", "?")
        entry = f"{Path(source).name} (page {int(page)+1})"
        if entry not in sources:
            sources.append(entry)

    return {
        "answer": result["answer"],
        "sources": sources
    }


def clear_vectorstore(session_id: str):
    """Remove session data from memory and disk."""
    _chains.pop(session_id, None)
    _vectorstores.pop(session_id, None)
    vectorstore_path = VECTORSTORE_DIR / session_id
    if vectorstore_path.exists():
        import shutil
        shutil.rmtree(vectorstore_path)