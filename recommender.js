// ============================================================
// recommender.js — AI-Powered Recommendation Engine
// Generates personalized learning roadmaps based on gap analysis
// Uses Claude API for AI-generated personalized insights
// ============================================================

const Recommender = (() => {

  // ---- Generate static recommendations from gap analysis ----
  function buildStaticRecs(parsed, scoreResult) {
    const { skillMatch, finalScore, criticalGaps } = scoreResult;
    const recs = [];

    // 1. Priority courses for missing skills
    const coursesToTake = [];
    const skillsToLearn = [...criticalGaps, ...scoreResult.partialGaps].slice(0, 6);
    for (const skill of skillsToLearn) {
      const skillKey = skill.toLowerCase().replace(/\s+/g, ' ');
      const courses = COURSE_DB[skillKey] || COURSE_DB[Object.keys(COURSE_DB).find(k => skillKey.includes(k))] || COURSE_DB.default;
      for (const c of courses.slice(0, 2)) {
        if (!coursesToTake.find(x => x.title === c.title)) {
          coursesToTake.push({ ...c, skill });
        }
      }
    }
    if (coursesToTake.length > 0) {
      recs.push({
        type: 'courses',
        icon: '📚',
        iconClass: 'blue',
        title: 'Recommended Courses',
        subtitle: `Fill ${skillsToLearn.length} skill gaps · Priority learning path`,
        items: coursesToTake.slice(0, 5).map(c => ({
          label: `${c.skill} Gap`,
          title: c.title,
          detail: `${c.platform} · ${c.duration}`,
        }))
      });
    }

    // 2. Project recommendations
    const projects = generateProjectRecs(parsed, skillMatch, criticalGaps);
    if (projects.length > 0) {
      recs.push({
        type: 'projects',
        icon: '⚡',
        iconClass: 'green',
        title: 'Build These Projects',
        subtitle: 'Portfolio projects that demonstrate missing skills',
        items: projects
      });
    }

    // 3. Interview prep based on JD type
    const prepItems = generatePrepItems(parsed, scoreResult);
    recs.push({
      type: 'prep',
      icon: '🎯',
      iconClass: 'yellow',
      title: 'Interview Preparation',
      subtitle: 'Role-specific prep topics and resources',
      items: prepItems
    });

    // 4. Profile strengthening
    const profileItems = generateProfileItems(parsed, scoreResult);
    recs.push({
      type: 'profile',
      icon: '🔧',
      iconClass: 'red',
      title: 'Profile Strengthening',
      subtitle: 'Quick wins to improve your candidacy',
      items: profileItems
    });

    return recs;
  }

  function generateProjectRecs(parsed, skillMatch, criticalGaps) {
    const projectIdeas = {
      "Machine Learning": {
        title: "End-to-End ML Pipeline",
        detail: "Build a model from data collection → training → deployment with FastAPI. Host on Hugging Face Spaces."
      },
      "NLP": {
        title: "Text Classification / Sentiment API",
        detail: "Fine-tune a BERT model on a Kaggle dataset. Deploy as a REST API with model performance dashboard."
      },
      "React": {
        title: "Full-Stack CRUD Application",
        detail: "React frontend + Node.js backend + PostgreSQL. Include auth, CRUD operations, and deployment to Vercel/Railway."
      },
      "Docker": {
        title: "Containerized Microservices App",
        detail: "Split a monolith into 3 services, orchestrate with Docker Compose, add CI/CD via GitHub Actions."
      },
      "AWS": {
        title: "Serverless Data Pipeline",
        detail: "Lambda + S3 + DynamoDB + API Gateway. Process uploaded CSV files and expose results via REST API."
      },
      "System Design": {
        title: "Scalable URL Shortener",
        detail: "Implement a URL shortener with Redis caching, rate limiting, and a dashboard. Document design decisions."
      },
      "SQL": {
        title: "Analytics Dashboard",
        detail: "Build a Streamlit app connecting to a PostgreSQL database with real-time KPI charts and filtering."
      },
      "Kubernetes": {
        title: "Multi-Service K8s Deployment",
        detail: "Deploy a 3-service app on Minikube/k3s with Ingress, horizontal pod autoscaling, and Prometheus monitoring."
      },
    };

    const items = [];
    for (const gap of criticalGaps.slice(0, 3)) {
      const idea = projectIdeas[gap];
      if (idea) {
        items.push({
          label: `Covers: ${gap}`,
          title: idea.title,
          detail: idea.detail,
        });
      }
    }
    if (items.length < 2) {
      items.push({
        label: "Open Source",
        title: "Contribute to a GitHub Project",
        detail: "Find beginner-friendly issues on GitHub (label: good-first-issue) in your skill area. Great for resume credibility."
      });
    }
    return items;
  }

  function generatePrepItems(parsed, scoreResult) {
    const items = [];
    const score = scoreResult.finalScore;
    const skills = parsed.skills.map(s => s.toLowerCase());
    const isML = skills.some(s => ['machine learning', 'pytorch', 'tensorflow', 'nlp'].includes(s));
    const isSWE = skills.some(s => ['react', 'node.js', 'django', 'spring boot'].includes(s));
    const isDevOps = skills.some(s => ['docker', 'kubernetes', 'terraform', 'aws'].includes(s));

    items.push({
      label: "Always Needed",
      title: "Data Structures & Algorithms",
      detail: "LeetCode: solve 2 Easy + 1 Medium per day. Focus on Arrays, Trees, Graphs, DP. Target: 80+ problems in 4 weeks."
    });

    if (isML) {
      items.push({
        label: "ML Focus",
        title: "ML System Design Interviews",
        detail: "Practice: recommendation systems, fraud detection, ad ranking. Read 'Designing ML Systems' by Chip Huyen."
      });
    }
    if (isSWE) {
      items.push({
        label: "SWE Focus",
        title: "System Design Fundamentals",
        detail: "Study: CAP theorem, consistent hashing, load balancing, caching. Grokking System Design on Educative.io."
      });
    }
    if (isDevOps) {
      items.push({
        label: "DevOps Focus",
        title: "Scenario-based DevOps Q&A",
        detail: "Prepare answers to: how you'd debug a K8s pod crash, design a zero-downtime deployment, or a CI/CD pipeline failure."
      });
    }
    if (score < 60) {
      items.push({
        label: "Priority",
        title: "Target Adjacent Roles First",
        detail: `Consider: Junior/Associate levels, internship-to-hire tracks, or roles emphasizing your strongest ${parsed.skills.slice(0,2).join(' & ')} skills while you build the missing ones.`
      });
    }
    return items.slice(0, 4);
  }

  function generateProfileItems(parsed, scoreResult) {
    const items = [];
    if (!parsed.certifications || parsed.certifications.length === 0) {
      items.push({
        label: "Quick Win",
        title: "Get an Industry Certification",
        detail: "AWS Cloud Practitioner (6 hrs, free tier available) or Google Data Analytics Certificate on Coursera can significantly boost your profile."
      });
    }
    if (parsed.projectCount < 3) {
      items.push({
        label: "Resume Gap",
        title: "Add 2–3 Quantified Projects",
        detail: "Each project bullet should follow: 'Built X using Y, resulting in Z% improvement / handling Z users'. Numbers matter."
      });
    }
    items.push({
      label: "Visibility",
      title: "Publish on GitHub + LinkedIn",
      detail: "Pin 3 best projects on GitHub with detailed READMEs. Write a 2-paragraph LinkedIn post about each project — recruiters notice activity."
    });
    if (parsed.redFlags && parsed.redFlags.length > 0) {
      items.push({
        label: "Fix Now",
        title: "Address Resume Gaps",
        detail: parsed.redFlags[0] + " — Fix this before applying. A strong resume increases callback rate by 3×."
      });
    }
    return items.slice(0, 4);
  }

  // ---- Async: use Claude API to generate personalized insight ----
  async function generateAIInsight(parsed, scoreResult, jdTitle) {
    const prompt = `You are a placement counselor and career coach. A candidate's resume has been analyzed for a "${jdTitle || 'software engineering'}" role.

CANDIDATE SUMMARY:
- Matched skills: ${scoreResult.skillMatch.matched.slice(0,8).join(', ') || 'none detected'}
- Missing skills: ${scoreResult.criticalGaps.slice(0,5).join(', ') || 'none'}
- Experience: ${parsed.yearsExperience} years
- Education: ${parsed.education[0]}
- Match score: ${scoreResult.finalScore}/100
- Verdict: ${scoreResult.verdict}

In 3 short, direct, actionable paragraphs (no bullet points, no headers), give:
1. A candid assessment of this candidate's current standing for this role.
2. The single most impactful thing they should do in the next 30 days.
3. A motivational but realistic 3-month plan to bridge the gap.

Be specific, honest, and encouraging. Max 200 words total.`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }]
        })
      });
      const data = await response.json();
      const text = data.content?.map(b => b.text || '').join('') || '';
      return text;
    } catch (e) {
      return null;
    }
  }

  return { buildStaticRecs, generateAIInsight };
})();
