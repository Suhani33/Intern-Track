from pypdf import PdfReader
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def extract_text_from_pdf(pdf_path):
    try:
        reader = PdfReader(pdf_path)
        text = " ".join(page.extract_text() or "" for page in reader.pages)
        return text.strip()
    except Exception:
        return ""

def calculate_resume_match(pdf_path, job_title, job_description, required_skills):
    resume_text = extract_text_from_pdf(pdf_path)
    if not resume_text:
        return 0.0

    jd_corpus = f"{job_title} {job_description} {' '.join(required_skills)}"
    try:
        vectorizer = TfidfVectorizer(stop_words="english")
        tfidf = vectorizer.fit_transform([resume_text, jd_corpus])
        score = cosine_similarity(tfidf[0:1], tfidf[1:2])[0][0]
        return round(float(score) * 100, 1)
    except Exception:
        return 0.0