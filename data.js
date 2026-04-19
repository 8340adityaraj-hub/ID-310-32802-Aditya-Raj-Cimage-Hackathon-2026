// ============================================================
// data.js — Job Description Presets + Skill Ontology Graph
// ============================================================

const JD_PRESETS = {
  swe: {
    title: "Software Engineer",
    text: `We are looking for a Software Engineer to join our product team.

Requirements:
- 2+ years of experience in software development
- Strong proficiency in Python, JavaScript, or Java
- Experience with React or other modern frontend frameworks
- RESTful API design and development
- Familiarity with databases: SQL (PostgreSQL/MySQL) and NoSQL (MongoDB/Redis)
- Git version control and CI/CD pipelines
- Understanding of data structures and algorithms
- Experience with Docker and basic cloud services (AWS/GCP/Azure)

Nice to have:
- TypeScript, Node.js experience
- Microservices architecture knowledge
- Agile/Scrum methodology
- System design experience

Responsibilities:
- Design, develop, and maintain scalable web applications
- Collaborate with cross-functional teams to define and ship features
- Write clean, testable code with unit and integration tests
- Participate in code reviews and technical discussions`
  },
  ml: {
    title: "Machine Learning Engineer",
    text: `We're hiring a Machine Learning Engineer to build and deploy AI systems at scale.

Requirements:
- Strong Python programming skills
- Experience with ML frameworks: TensorFlow, PyTorch, or Scikit-learn
- Deep understanding of supervised/unsupervised learning algorithms
- NLP experience: transformers, BERT, GPT, embeddings, tokenization
- Data preprocessing, feature engineering, and EDA
- Experience with MLflow, Weights & Biases, or similar experiment tracking
- Model deployment using FastAPI, Flask, or similar
- Familiarity with cloud ML platforms (SageMaker, Vertex AI, Azure ML)
- Knowledge of vector databases (Pinecone, Weaviate, Chroma)
- Statistics and linear algebra fundamentals

Nice to have:
- LLM fine-tuning experience (LoRA, PEFT)
- Kubernetes and containerization for model serving
- Data pipelines with Apache Airflow or Spark
- Computer Vision experience

Responsibilities:
- Build and train ML models for production use
- Design end-to-end ML pipelines from data ingestion to deployment
- Optimize models for latency and throughput
- Collaborate with data engineering and product teams`
  },
  data: {
    title: "Data Scientist",
    text: `Join our analytics team as a Data Scientist to derive insights from complex datasets.

Requirements:
- Proficiency in Python (Pandas, NumPy, Matplotlib, Seaborn)
- SQL expertise for data extraction and manipulation
- Statistical modeling: regression, classification, clustering, time series
- A/B testing and experimental design
- Experience with Jupyter Notebooks and data storytelling
- Tableau, Power BI, or Looker for dashboards
- Machine learning fundamentals (Scikit-learn)
- Experience with big data tools (Spark, Hive) is a plus
- R language knowledge is a bonus

Nice to have:
- Bayesian inference and probabilistic modeling
- Causal inference methods
- Experience with dbt for data transformation
- Familiarity with Apache Kafka for streaming data

Responsibilities:
- Analyze large datasets to uncover trends and patterns
- Build predictive models to support business decisions
- Communicate findings to non-technical stakeholders
- Define and track KPIs and business metrics`
  },
  pm: {
    title: "Product Manager",
    text: `We are seeking a Product Manager to lead our core product development.

Requirements:
- 3+ years of product management experience
- Strong analytical skills and data-driven decision making
- Experience with Agile/Scrum methodologies
- Proficiency in product tools: Jira, Confluence, Figma, Notion
- User research and customer discovery skills
- Roadmap planning and stakeholder communication
- SQL knowledge for querying product analytics
- Understanding of API design and technical architecture
- Experience with product analytics tools (Mixpanel, Amplitude, GA)

Nice to have:
- Technical background (engineering or computer science)
- Experience with growth and experimentation frameworks
- B2B SaaS product experience
- Understanding of machine learning concepts

Responsibilities:
- Define product vision, strategy, and roadmap
- Work closely with engineering, design, and business teams
- Translate customer needs into product requirements
- Measure and improve product performance through metrics`
  },
  devops: {
    title: "DevOps Engineer",
    text: `We're looking for a DevOps Engineer to build and maintain our cloud infrastructure.

Requirements:
- Strong Linux/Unix administration skills
- Experience with cloud platforms: AWS, GCP, or Azure
- Infrastructure as Code: Terraform, CloudFormation, or Pulumi
- Container orchestration: Kubernetes and Docker
- CI/CD pipelines: GitHub Actions, Jenkins, GitLab CI, or CircleCI
- Monitoring and observability: Prometheus, Grafana, ELK Stack, Datadog
- Scripting: Python, Bash, or Go
- Networking: VPC, load balancers, DNS, firewalls
- Security best practices: IAM, secrets management (Vault)

Nice to have:
- Service mesh experience (Istio, Linkerd)
- Site Reliability Engineering (SRE) principles
- Cost optimization on cloud
- Database administration (PostgreSQL, Redis, MongoDB)

Responsibilities:
- Design and maintain scalable, highly available infrastructure
- Automate deployment and operational processes
- Implement security and compliance standards
- Improve system reliability and reduce toil`
  }
};

// =====================
// SKILL ONTOLOGY GRAPH
// A simplified knowledge graph mapping skill → related skills, category, weight
// =====================
const SKILL_ONTOLOGY = {
  // Programming Languages
  python: { category: "language", related: ["django", "flask", "fastapi", "pandas", "numpy", "scikit-learn"], weight: 1.0 },
  javascript: { category: "language", related: ["react", "nodejs", "typescript", "vue", "angular"], weight: 1.0 },
  java: { category: "language", related: ["spring", "maven", "gradle", "jvm"], weight: 0.9 },
  typescript: { category: "language", related: ["javascript", "react", "angular", "nodejs"], weight: 0.95 },
  go: { category: "language", related: ["kubernetes", "docker", "microservices"], weight: 0.9 },
  rust: { category: "language", related: ["systems", "performance"], weight: 0.85 },
  sql: { category: "language", related: ["postgresql", "mysql", "sqlite", "database"], weight: 0.95 },
  r: { category: "language", related: ["statistics", "ggplot", "tidyverse"], weight: 0.8 },
  cpp: { category: "language", related: ["c", "systems", "performance"], weight: 0.85 },
  bash: { category: "language", related: ["linux", "scripting", "devops"], weight: 0.8 },

  // ML/AI
  tensorflow: { category: "ml_framework", related: ["keras", "python", "deep_learning"], weight: 1.0 },
  pytorch: { category: "ml_framework", related: ["python", "deep_learning", "transformers"], weight: 1.0 },
  "scikit-learn": { category: "ml_framework", related: ["python", "machine_learning", "pandas"], weight: 0.95 },
  "machine learning": { category: "ml_concept", related: ["python", "statistics", "scikit-learn"], weight: 1.0 },
  "deep learning": { category: "ml_concept", related: ["tensorflow", "pytorch", "neural_networks"], weight: 1.0 },
  nlp: { category: "ml_concept", related: ["transformers", "bert", "gpt", "embeddings", "spacy"], weight: 1.0 },
  transformers: { category: "ml_framework", related: ["bert", "gpt", "nlp", "huggingface"], weight: 1.0 },
  bert: { category: "ml_model", related: ["nlp", "transformers", "embeddings"], weight: 0.9 },

  // Web Frameworks
  react: { category: "frontend", related: ["javascript", "typescript", "jsx", "redux"], weight: 1.0 },
  nodejs: { category: "backend", related: ["javascript", "express", "npm"], weight: 0.95 },
  django: { category: "backend", related: ["python", "rest", "postgresql"], weight: 0.9 },
  flask: { category: "backend", related: ["python", "rest", "api"], weight: 0.85 },
  fastapi: { category: "backend", related: ["python", "async", "rest", "pydantic"], weight: 0.9 },
  spring: { category: "backend", related: ["java", "microservices", "rest"], weight: 0.85 },

  // DevOps/Cloud
  docker: { category: "devops", related: ["kubernetes", "containers", "ci/cd"], weight: 1.0 },
  kubernetes: { category: "devops", related: ["docker", "helm", "microservices", "cloud"], weight: 1.0 },
  aws: { category: "cloud", related: ["ec2", "s3", "lambda", "rds", "cloudformation"], weight: 1.0 },
  gcp: { category: "cloud", related: ["bigquery", "vertex_ai", "cloud_run"], weight: 0.9 },
  azure: { category: "cloud", related: ["azure_ml", "cosmos_db", "azure_devops"], weight: 0.9 },
  terraform: { category: "devops", related: ["iac", "aws", "gcp", "azure"], weight: 0.95 },
  "ci/cd": { category: "devops", related: ["github_actions", "jenkins", "gitlab_ci", "docker"], weight: 0.95 },
  linux: { category: "devops", related: ["bash", "ubuntu", "centos", "networking"], weight: 0.9 },

  // Databases
  postgresql: { category: "database", related: ["sql", "relational", "indexes"], weight: 0.9 },
  mongodb: { category: "database", related: ["nosql", "json", "atlas"], weight: 0.85 },
  redis: { category: "database", related: ["caching", "nosql", "pubsub"], weight: 0.85 },
  mysql: { category: "database", related: ["sql", "relational"], weight: 0.85 },

  // Data
  pandas: { category: "data", related: ["python", "numpy", "data_analysis"], weight: 0.9 },
  numpy: { category: "data", related: ["python", "pandas", "scipy", "linear_algebra"], weight: 0.85 },
  spark: { category: "data", related: ["big_data", "hadoop", "pyspark"], weight: 0.9 },
  tableau: { category: "visualization", related: ["data_viz", "analytics", "business_intelligence"], weight: 0.8 },

  // Soft skills
  agile: { category: "methodology", related: ["scrum", "kanban", "jira", "sprint"], weight: 0.75 },
  "system design": { category: "concept", related: ["scalability", "microservices", "architecture"], weight: 1.0 },
  "git": { category: "tool", related: ["github", "version_control", "branching"], weight: 0.85 },
};

// Courses recommendation database
const COURSE_DB = {
  python: [
    { title: "Python for Everybody", platform: "Coursera (Michigan)", url: "#", duration: "4 weeks" },
    { title: "Complete Python Bootcamp", platform: "Udemy", url: "#", duration: "22 hours" }
  ],
  "machine learning": [
    { title: "Machine Learning Specialization", platform: "Coursera (Stanford/Andrew Ng)", url: "#", duration: "3 months" },
    { title: "Fast.ai Practical Deep Learning", platform: "fast.ai", url: "#", duration: "Self-paced" }
  ],
  nlp: [
    { title: "Natural Language Processing Specialization", platform: "Coursera (deeplearning.ai)", url: "#", duration: "4 months" },
    { title: "Hugging Face NLP Course", platform: "HuggingFace", url: "#", duration: "Free, self-paced" }
  ],
  react: [
    { title: "React - The Complete Guide", platform: "Udemy", url: "#", duration: "48 hours" },
    { title: "Full Stack Open", platform: "University of Helsinki", url: "#", duration: "Free, 12 weeks" }
  ],
  docker: [
    { title: "Docker & Kubernetes: The Practical Guide", platform: "Udemy", url: "#", duration: "23 hours" }
  ],
  aws: [
    { title: "AWS Cloud Practitioner Essentials", platform: "AWS Training", url: "#", duration: "6 hours" },
    { title: "AWS Solutions Architect Associate", platform: "A Cloud Guru", url: "#", duration: "Self-paced" }
  ],
  sql: [
    { title: "SQL for Data Science", platform: "Coursera (UC Davis)", url: "#", duration: "4 weeks" },
    { title: "Mode SQL Tutorial", platform: "Mode Analytics", url: "#", duration: "Free" }
  ],
  "system design": [
    { title: "Grokking the System Design Interview", platform: "Educative.io", url: "#", duration: "Self-paced" },
    { title: "System Design Primer", platform: "GitHub (Free)", url: "#", duration: "Self-paced" }
  ],
  kubernetes: [
    { title: "Kubernetes for Absolute Beginners", platform: "KodeKloud", url: "#", duration: "5 hours" }
  ],
  default: [
    { title: "CS50: Introduction to Computer Science", platform: "Harvard / edX", url: "#", duration: "12 weeks, Free" },
    { title: "The Missing Semester of CS Education", platform: "MIT (Free)", url: "#", duration: "Self-paced" }
  ]
};
