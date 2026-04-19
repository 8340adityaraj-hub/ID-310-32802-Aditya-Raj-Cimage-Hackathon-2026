// ============================================================
// parser.js — Resume Parsing Engine (NLP-style extraction)
// Extracts structured data from unstructured resume text
// ============================================================

const ResumeParser = (() => {

  // ---- Skill keyword bank (maps aliases → canonical skill name) ----
  const SKILL_ALIASES = {
    "python": "Python", "py": "Python",
    "javascript": "JavaScript", "js": "JavaScript",
    "typescript": "TypeScript", "ts": "TypeScript",
    "java": "Java", "java8": "Java", "java11": "Java",
    "c++": "C++", "cpp": "C++", "c#": "C#", "csharp": "C#",
    "go": "Go", "golang": "Go",
    "rust": "Rust", "swift": "Swift", "kotlin": "Kotlin",
    "ruby": "Ruby", "php": "PHP", "scala": "Scala", "r": "R",
    "bash": "Bash", "shell": "Shell Scripting",
    "react": "React", "reactjs": "React", "react.js": "React",
    "angular": "Angular", "vue": "Vue.js", "vuejs": "Vue.js",
    "node": "Node.js", "nodejs": "Node.js", "node.js": "Node.js",
    "next": "Next.js", "nextjs": "Next.js",
    "django": "Django", "flask": "Flask", "fastapi": "FastAPI",
    "spring": "Spring Boot", "spring boot": "Spring Boot",
    "tensorflow": "TensorFlow", "tf": "TensorFlow",
    "pytorch": "PyTorch", "torch": "PyTorch",
    "keras": "Keras", "scikit": "Scikit-learn", "sklearn": "Scikit-learn",
    "scikit-learn": "Scikit-learn", "scikitlearn": "Scikit-learn",
    "hugging face": "HuggingFace", "huggingface": "HuggingFace",
    "pandas": "Pandas", "numpy": "NumPy", "scipy": "SciPy",
    "matplotlib": "Matplotlib", "seaborn": "Seaborn",
    "machine learning": "Machine Learning", "ml": "Machine Learning",
    "deep learning": "Deep Learning", "dl": "Deep Learning",
    "natural language processing": "NLP", "nlp": "NLP",
    "computer vision": "Computer Vision", "cv": "Computer Vision",
    "reinforcement learning": "Reinforcement Learning", "rl": "Reinforcement Learning",
    "llm": "LLMs", "large language model": "LLMs", "gpt": "GPT",
    "bert": "BERT", "transformers": "Transformers",
    "langchain": "LangChain", "llama": "LLaMA",
    "docker": "Docker", "kubernetes": "Kubernetes", "k8s": "Kubernetes",
    "terraform": "Terraform", "ansible": "Ansible",
    "jenkins": "Jenkins", "ci/cd": "CI/CD", "cicd": "CI/CD",
    "github actions": "GitHub Actions",
    "aws": "AWS", "amazon web services": "AWS",
    "gcp": "GCP", "google cloud": "GCP",
    "azure": "Azure", "microsoft azure": "Azure",
    "postgresql": "PostgreSQL", "postgres": "PostgreSQL",
    "mysql": "MySQL", "mongodb": "MongoDB", "mongo": "MongoDB",
    "redis": "Redis", "elasticsearch": "Elasticsearch",
    "sqlite": "SQLite", "cassandra": "Cassandra",
    "sql": "SQL", "nosql": "NoSQL",
    "git": "Git", "github": "GitHub", "gitlab": "GitLab",
    "linux": "Linux", "ubuntu": "Ubuntu",
    "rest": "REST APIs", "rest api": "REST APIs", "restful": "REST APIs",
    "graphql": "GraphQL", "grpc": "gRPC",
    "spark": "Apache Spark", "apache spark": "Apache Spark",
    "kafka": "Apache Kafka", "airflow": "Apache Airflow",
    "tableau": "Tableau", "power bi": "Power BI",
    "agile": "Agile", "scrum": "Scrum", "jira": "Jira",
    "figma": "Figma", "xd": "Adobe XD",
    "system design": "System Design",
    "microservices": "Microservices",
    "data structures": "Data Structures & Algorithms", "dsa": "Data Structures & Algorithms",
    "algorithms": "Data Structures & Algorithms",
  };

  // ---- Section header detection patterns ----
  const SECTION_PATTERNS = {
    education: /\b(education|academic|university|college|degree|b\.?tech|m\.?tech|b\.?sc|m\.?sc|b\.?e|bachelor|master|phd|bca|mca)\b/i,
    experience: /\b(experience|work|employment|career|professional|internship|intern|job|position|role)\b/i,
    skills: /\b(skills|technologies|tech stack|tools|expertise|competencies|proficiencies|technical)\b/i,
    projects: /\b(projects|portfolio|works|developed|built|created|personal projects|academic projects)\b/i,
    achievements: /\b(achievements|awards|honors|recognition|certifications|certificates|accomplishments)\b/i,
    summary: /\b(summary|objective|profile|about|overview|bio)\b/i,
  };

  // ---- Extract name (heuristic: first meaningful line or line after "Name:") ----
  function extractName(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    // Look for "Name:" label
    for (const line of lines.slice(0, 8)) {
      const m = line.match(/^name\s*[:–-]\s*(.+)/i);
      if (m) return m[1].trim();
    }
    // First line that looks like a name (2–4 words, mostly capitalized, no digits)
    for (const line of lines.slice(0, 5)) {
      if (/^[A-Z][a-zA-Z]+([\s][A-Z][a-zA-Z]+){1,3}$/.test(line) && line.length < 50) {
        return line;
      }
    }
    return lines[0] || "Unknown Candidate";
  }

  // ---- Extract email ----
  function extractEmail(text) {
    const m = text.match(/\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/);
    return m ? m[0] : null;
  }

  // ---- Extract phone ----
  function extractPhone(text) {
    const m = text.match(/(\+?\d[\d\s\-().]{8,15}\d)/);
    return m ? m[0].trim() : null;
  }

  // ---- Extract skills via alias matching ----
  function extractSkills(text) {
    const lower = text.toLowerCase();
    const found = new Set();
    // Sort aliases by length desc to match longer phrases first
    const entries = Object.entries(SKILL_ALIASES).sort((a, b) => b[0].length - a[0].length);
    for (const [alias, canonical] of entries) {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`(?<![\\w])(${escaped})(?![\\w])`, 'i');
      if (re.test(lower)) found.add(canonical);
    }
    return [...found];
  }

  // ---- Extract years of experience ----
  function extractExperience(text) {
    // Look for explicit "X years"
    const m = text.match(/(\d+\.?\d*)\s*\+?\s*years?\s*(of\s+)?(experience|exp|work)/i);
    if (m) return parseFloat(m[1]);
    // Count date ranges like 2021-2024 or Jan 2020 - Present
    const ranges = [...text.matchAll(/(\d{4})\s*[-–]\s*(present|\d{4})/gi)];
    if (ranges.length > 0) {
      const currentYear = 2026;
      let total = 0;
      for (const r of ranges) {
        const start = parseInt(r[1]);
        const end = r[2].toLowerCase() === 'present' ? currentYear : parseInt(r[2]);
        if (!isNaN(start) && !isNaN(end) && end >= start && end - start < 20) {
          total += (end - start);
        }
      }
      return Math.min(total, 20);
    }
    return 0;
  }

  // ---- Extract education ----
  function extractEducation(text) {
    const degrees = [];
    const degreePatterns = [
      /\b(B\.?Tech|Bachelor of Technology|B\.?E\.?|Bachelor of Engineering)\b[^.]*(?:Computer Science|CS|IT|Information Technology|ECE|EEE|Mechanical|Civil|Electronics)?[^.]*(?:\d{4})?/i,
      /\b(M\.?Tech|Master of Technology|M\.?E\.?)\b[^.]*(?:CS|AI|ML|Data Science)?[^.]*(?:\d{4})?/i,
      /\b(B\.?Sc?\.?|Bachelor of Science)\b[^.]*(?:CS|Math|Statistics|Physics)?[^.]*(?:\d{4})?/i,
      /\b(M\.?Sc?\.?|Master of Science)\b[^.]*(?:\d{4})?/i,
      /\b(MBA|Master of Business Administration)\b[^.]*(?:\d{4})?/i,
      /\b(B\.?C\.?A\.?|M\.?C\.?A\.?)\b[^.]*(?:\d{4})?/i,
      /\b(Ph\.?D\.?|Doctor of Philosophy)\b[^.]*(?:\d{4})?/i,
    ];
    for (const pat of degreePatterns) {
      const m = text.match(pat);
      if (m) degrees.push(m[0].replace(/\s+/g, ' ').trim().slice(0, 80));
    }
    return degrees.length ? degrees : ["Not specified"];
  }

  // ---- Extract GPA / CGPA ----
  function extractGPA(text) {
    const m = text.match(/(?:cgpa|gpa|grade|score)\s*[:–-]?\s*([0-9.]+)\s*(?:\/\s*([0-9.]+))?/i);
    if (m) {
      const score = parseFloat(m[1]);
      const max = m[2] ? parseFloat(m[2]) : (score > 10 ? 100 : 10);
      return { score, max };
    }
    return null;
  }

  // ---- Extract project count ----
  function extractProjects(text) {
    const lower = text.toLowerCase();
    const projectSection = lower.indexOf('project');
    if (projectSection === -1) return 0;
    const snippet = text.slice(projectSection, projectSection + 2000);
    // Count bullet points or numbered items in projects section
    const bullets = (snippet.match(/^[\s]*[-•*▸►]\s+\S/gm) || []).length;
    const numbered = (snippet.match(/^\s*\d+[\.\)]\s+\S/gm) || []).length;
    return Math.max(bullets, numbered, 0);
  }

  // ---- Extract certifications ----
  function extractCerts(text) {
    const certs = [];
    const certPatterns = [
      /AWS\s+Certified[^.\n]*/gi,
      /Google\s+Certified[^.\n]*/gi,
      /Microsoft\s+Certified[^.\n]*/gi,
      /Certified\s+\w+[^.\n]{0,40}/gi,
      /CKA|CKAD|CKS/g,
      /CISSP|CEH|OSCP/g,
      /PMP|Scrum Master|CSM/g,
    ];
    for (const pat of certPatterns) {
      const matches = text.match(pat) || [];
      certs.push(...matches.map(c => c.trim().slice(0, 60)));
    }
    return [...new Set(certs)];
  }

  // ---- Detect red flags ----
  function detectRedFlags(text, skills) {
    const flags = [];
    if (skills.length < 3) flags.push("Very few skills detected — resume may be incomplete");
    if (text.length < 300) flags.push("Resume text is too short — may be incomplete");
    if (!extractEmail(text)) flags.push("No email address found");
    if (extractExperience(text) === 0 && !/fresher|fresh graduate|entry level/i.test(text))
      flags.push("No clear work experience timeline found");
    return flags;
  }

  // ---- MAIN PARSE FUNCTION ----
  function parse(text) {
    if (!text || text.trim().length < 10) {
      return { error: "No resume content found. Please paste your resume text." };
    }
    const skills = extractSkills(text);
    const gpa = extractGPA(text);
    const exp = extractExperience(text);
    const projects = extractProjects(text);
    const certs = extractCerts(text);
    const flags = detectRedFlags(text, skills);
    return {
      name: extractName(text),
      email: extractEmail(text),
      phone: extractPhone(text),
      education: extractEducation(text),
      gpa: gpa,
      yearsExperience: exp,
      skills: skills,
      projectCount: projects,
      certifications: certs,
      redFlags: flags,
      rawLength: text.length,
      wordCount: text.split(/\s+/).filter(Boolean).length,
    };
  }

  return { parse, extractSkills };
})();
