🧠 PlacementAI
AI-Powered Placement Intelligence & Resume Analyzer > Transforming the "Black Box" of hiring into a transparent roadmap.

🚀 Overview
PlacementAI is a smart decision-support engine that goes beyond simple keyword matching. It understands the semantic context of a resume, calculates a multi-factor score, and provides Explainable AI (XAI) reasoning to help both recruiters and candidates.

Why it’s better than traditional ATS:
Context Aware: Understands that "React" means "Frontend."

Fast: Processes everything in your browser in <1s.

Helpful: Identifies skill gaps and suggests real courses.

🛠️ Tech Stack
Core: JavaScript (ES6+), HTML5, CSS3

NLP: TF-IDF Cosine Similarity (Semantic Matching)

AI: Claude API (Career Coaching)

Data: Custom Skill Ontology (60+ Tech nodes)

📁 Project Structure
index.html: The 4-page Dark-Theme Dashboard.

parser.js: Extracts names, emails, and skills from messy text.

scorer.js: The "Brain"—calculates scores based on 6 factors.

data.js: The "Knowledge Graph" of skills and job roles.

recommender.js: Maps skill gaps to courses and AI roadmaps.

📊 How Scoring Works
We don't just count words. We use a weighted formula:

Skills (38%): Direct and related skill matches.

Experience (22%): Years of work vs. Job requirements.

Semantic (20%): Mathematical similarity of the text.

Education (10%): Degree level and GPA.

Projects (7%): Breadth and depth of technical work.

Certs (3%): Relevant industry certifications.

🔧 How to Run
Clone the repository.

Open index.html in any modern web browser.

No installation required! (Client-side execution).

🔮 Future Roadmap
GitHub Integration: Automatic project verification via API.

Voice Bot: AI-driven mock interviews for candidates.

Server-Side Upgrade: Migrating to FastAPI and Sentence-BERT for production.

👨‍💻 Developed by
Team PlacementAI Built for Hackathon 2026
