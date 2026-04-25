# 🧠 PlacementAI
> **AI-Powered Placement Intelligence & Resume Analyzer** > *Transforming the "Black Box" of hiring into a transparent roadmap.*

![License](https://img.shields.io/badge/License-MIT-green.svg)
![Version](https://img.shields.io/badge/Version-1.0.0-blue.svg)
![Build](https://img.shields.io/badge/Build-Hackathon%202026-orange.svg)

---

## 🚀 Overview
**PlacementAI** is a smart decision-support engine that goes beyond simple keyword matching. It understands the semantic context of a resume, calculates a multi-factor score, and provides **Explainable AI (XAI)** reasoning to bridge the gap between recruiters and candidates.

### Why it’s better than traditional ATS:
* **Context Aware:** Uses semantic matching to understand that "React" implies "Frontend Development."
* **Lightning Fast:** Fully client-side processing in your browser in `<1s`.
* **Actionable Insights:** Identifies specific skill gaps and suggests real-world courses.

---

## 🛠️ Tech Stack
* **Core:** JavaScript (ES6+), HTML5, CSS3
* **NLP:** TF-IDF & Cosine Similarity for Semantic Matching
* **AI:** Claude API (Personalized Career Coaching)
* **Data Structure:** Custom Skill Ontology (60+ Tech nodes)

---

## 📁 Project Structure
| File | Role |
| :--- | :--- |
| `index.html` | The 4-page responsive Dark-Theme Dashboard. |
| `parser.js` | Text extraction engine for names, emails, and skills. |
| `scorer.js` | **The Brain:** Calculates multi-factor scores. |
| `data.js` | **Knowledge Graph:** Maps skills to specific job roles. |
| `recommender.js` | Maps skill gaps to curated courses and AI roadmaps. |

---

## 📊 How Scoring Works
We move beyond word-counting. PlacementAI utilizes a weighted formula to ensure a holistic evaluation:

| Factor | Weight | Description |
| :--- | :--- | :--- |
| **Skills** | 38% | Direct and related semantic skill matches. |
| **Experience** | 22% | Years of professional work vs. job requirements. |
| **Semantic** | 20% | Mathematical similarity (Cosine) of the text. |
| **Education** | 10% | Degree level and GPA relevance. |
| **Projects** | 7% | Breadth and depth of technical implementation. |
| **Certs** | 3% | Relevant industry-recognized certifications. |

---

## 🔧 Getting Started
Since PlacementAI is built for efficiency, there is **zero installation** required.

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/8340adityaraj-hub/ID-310-32802-Aditya-Raj-Cimage-Hackathon-2026.git](https://github.com/8340adityaraj-hub/ID-310-32802-Aditya-Raj-Cimage-Hackathon-2026.git)
    ```
2.  **Run the App:**
    Simply open `index.html` in any modern web browser.

---

## 🔮 Future Roadmap
* **GitHub Integration:** Automatic project verification and contribution analysis via API.
* **Voice Bot:** AI-driven mock interviews to prep candidates.
* **Production Upgrade:** Migrating the backend to **FastAPI** and **Sentence-BERT**.

---

## 👨‍💻 Developed by
**Team PlacementAI** *Built for Cimage Hackathon 2026*
