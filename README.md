# ⬡ RakibAI — AI PDF Chat Bot

A full-stack AI application that lets you upload multiple PDFs and have an intelligent conversation with your documents — powered by **Google Gemini** and **LangChain RAG**.

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)
![LangChain](https://img.shields.io/badge/LangChain-0.3-FF6B35?style=flat-square)
![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-4285F4?style=flat-square&logo=google&logoColor=white)
![FAISS](https://img.shields.io/badge/FAISS-Vector%20Store-00897B?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-lightgrey?style=flat-square)

---

## ✨ Features

- 📄 **Multi-PDF Upload** — Upload multiple PDFs at once via drag & drop or file browser
- 🤖 **AI-Powered Q&A** — Ask anything and get accurate answers from your documents
- 🧠 **Conversation Memory** — Follow-up questions are fully context-aware
- 📍 **Source Citations** — Every answer shows exactly which PDF and page it came from
- 🔒 **Session Isolation** — Each user gets their own isolated session and vector store
- 🌑 **Dark Professional Dashboard** — Clean, modern UI with smooth animations
- ⚡ **100% Free API** — Uses Google Gemini free tier, no credit card required

---

## 🛠️ Tech Stack

| Layer        | Technology                                       |
|--------------|--------------------------------------------------|
| Backend      | FastAPI + Python 3.10+                           |
| AI / LLM     | Google Gemini 2.5 Flash (free tier)              |
| Embeddings   | Google Gemini Embedding (`gemini-embedding-001`) |
| Vector Store | FAISS (local, no external service needed)        |
| RAG Pipeline | LangChain ConversationalRetrievalChain           |
| PDF Parsing  | PyPDF                                            |
| Frontend     | Vanilla HTML + CSS + JavaScript                  |

---

## ⚠️ Important: PDF Compatibility

Not all PDFs work equally well. Here is what you need to know before uploading:

| PDF Type | Works? | Notes |
|----------|--------|-------|
| ✅ Plain text PDFs | **Best results** | Regular documents, reports, articles |
| ✅ Text-based PDFs with simple formatting | **Yes** | Headings, paragraphs, bullet points |
| ⚠️ PDFs with heavy tables or complex layouts | **Partial** | Table content may not extract correctly |
| ❌ Scanned PDFs / image-based PDFs | **No** | These contain no extractable text layer |
| ❌ Password-protected PDFs | **No** | Must be unlocked before uploading |

> **Tip:** If your PDF has important data inside tables, consider recreating that section as plain paragraph text for the best Q&A accuracy.

---

## 📁 Project Structure

```
pdf-chat-app/
├── backend/
│   ├── main.py              # FastAPI routes and endpoints
│   ├── rag.py               # LangChain RAG pipeline (ingest + Q&A)
│   ├── requirements.txt     # Python dependencies
│   ├── .env.example         # Environment variable template
│   ├── uploads/             # Uploaded PDFs — auto-created at runtime
│   └── vectorstore/         # FAISS vector indexes — auto-created at runtime
├── frontend/
│   ├── index.html           # Main dashboard UI
│   └── static/
│       ├── css/style.css    # Styling
│       └── js/app.js        # Frontend logic
└── README.md
```

---

## 🚀 Getting Started

### Step 1 — Get Your Free Gemini API Key

1. Go to **[https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)**
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy your key — completely free, no credit card needed

---

### Step 2 — Clone the Repository

```bash
git clone https://github.com/cryptic91/pdf-chat-app.git
cd pdf-chat-app
```

---

### Step 3 — Set Up the Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate — Windows:
venv\Scripts\activate

# Activate — Mac / Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

---

### Step 4 — Add Your API Key

```bash
# Windows:
copy .env.example .env

# Mac / Linux:
cp .env.example .env
```

Open `.env` and replace the placeholder with your actual key:

```env
GEMINI_API_KEY=your_actual_key_here
```

---

### Step 5 — Run the App

```bash
uvicorn main:app --reload
```

Open your browser at **[http://localhost:8000](http://localhost:8000)** 🎉

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Serves the frontend dashboard |
| `POST` | `/upload` | Upload PDFs and initialize a session |
| `POST` | `/chat` | Send a question, get an AI answer |
| `DELETE` | `/session/{id}` | Clear session data and vector store |
| `GET` | `/health` | Health check |

---

## 🧠 How It Works

```
User uploads PDFs
       ↓
PyPDF extracts text from each page
       ↓
Text is split into overlapping chunks (1000 chars, 200 overlap)
       ↓
Gemini Embeddings converts chunks into vectors
       ↓
FAISS stores vectors locally per session
       ↓
User asks a question
       ↓
FAISS retrieves top 5 most relevant chunks
       ↓
Gemini 2.5 Flash generates an answer using context + conversation memory
       ↓
Answer + source citations (filename + page number) returned to user
```

---

## 🧪 Sample PDF for Testing

Not sure which PDF to test with? A sample PDF is included in this repo!


📄 **[test-document-v2.pdf](https://github.com/user-attachments/files/26172226/test-document-v2.pdf)** — A 3-page document about Artificial Intelligence covering:
- What is AI and its key branches
- Popular AI models comparison
- AI in Healthcare, Finance and Transportation
- Economic impact, ethics and regulation
- How to get started with AI development

**How to use it:**
1. Download `test-document-v2.pdf` from this repo
2. Upload it in the app
3. Try asking these questions:
   - *"How much will AI contribute to the global economy by 2030?"*
   - *"What does the EU AI Act do?"*
   - *"Which AI model is best for long context?"*
   - *"How is AI used in healthcare?"*

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

## 👨‍💻 Author

**Rakib** — [@cryptic91](https://github.com/cryptic91)

> Built with curiosity and lots of debugging. Feel free to star the repo if you found it useful!

---

## 📜 License

MIT © 2026 — Rakib ([@cryptic91](https://github.com/cryptic91))
