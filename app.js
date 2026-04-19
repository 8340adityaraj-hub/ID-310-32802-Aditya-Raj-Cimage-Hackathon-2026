// ============================================================
// app.js — Main Application Controller
// Wires together parser, scorer, recommender, and UI
// ============================================================

(function () {
  // ---- State ----
  let state = {
    resumeText: '',
    parsed: null,
    jdText: '',
    jdTitle: '',
    scoreResult: null,
    recs: null,
  };

  // ---- DOM helpers ----
  const $ = id => document.getElementById(id);
  const qs = sel => document.querySelector(sel);
  const qsa = sel => document.querySelectorAll(sel);

  function showPage(pageId) {
    qsa('.page').forEach(p => p.classList.remove('active'));
    $(`page-${pageId}`).classList.add('active');
    qsa('.nav-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.page === pageId);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showLoading(msg, sub) {
    $('loading-msg').textContent = msg || 'Processing...';
    $('loading-sub').textContent = sub || '';
    $('loading-overlay').style.display = 'flex';
  }

  function hideLoading() {
    $('loading-overlay').style.display = 'none';
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  // ---- Nav buttons ----
  qsa('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = btn.dataset.page;
      if (page === 'results' && !state.scoreResult) return;
      if (page === 'recs' && !state.recs) return;
      showPage(page);
    });
  });

  // ---- File upload ----
  const fileInput = $('resume-file');
  const uploadZone = $('upload-zone');

  uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop', e => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) handleFile(fileInput.files[0]);
  });

  async function handleFile(file) {
    const allowed = ['application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
      alert('Please upload a PDF or Word document.');
      return;
    }
    showLoading('Reading file...', 'Extracting text content');
    await sleep(600);
    // In browser we can't parse binary PDFs natively — read as text for demo
    // In production: send to backend endpoint for PyMuPDF/pdfplumber extraction
    const reader = new FileReader();
    reader.onload = async (e) => {
      let text = e.target.result;
      // If it looks like binary PDF, show helpful message
      if (text.startsWith('%PDF') || text.includes('endobj')) {
        text = extractPdfTextFallback(text);
      }
      $('resume-text').value = text;
      hideLoading();
      if (text.length > 50) {
        await triggerParse(text);
      }
    };
    reader.readAsText(file);
  }

  // Attempt to extract readable text from raw PDF bytes (very basic fallback)
  function extractPdfTextFallback(raw) {
    // Extract text between BT...ET markers (basic PDF text extraction)
    const matches = [...raw.matchAll(/BT[\s\S]*?ET/g)];
    let out = '';
    for (const m of matches) {
      const inner = m[0].replace(/BT|ET/g, '');
      const strs = [...inner.matchAll(/\(([^)]+)\)/g)];
      out += strs.map(s => s[1]).join(' ') + '\n';
    }
    if (out.trim().length > 30) return out;
    // Last resort: extract printable ASCII sequences
    return raw.replace(/[^\x20-\x7E\n]/g, ' ').replace(/\s{3,}/g, '\n').slice(0, 5000);
  }

  // ---- Parse button ----
  $('btn-parse').addEventListener('click', async () => {
    const text = $('resume-text').value.trim();
    if (!text) {
      alert('Please paste your resume text or upload a file.');
      return;
    }
    await triggerParse(text);
  });

  async function triggerParse(text) {
    showLoading('Parsing Resume', 'Running NLP extraction pipeline...');
    await sleep(800);
    $('loading-sub').textContent = 'Extracting skills via ontology graph...';
    await sleep(700);

    state.resumeText = text;
    state.parsed = ResumeParser.parse(text);

    hideLoading();

    if (state.parsed.error) {
      alert(state.parsed.error);
      return;
    }

    renderParsedOutput(state.parsed);
    $('parse-section').style.display = 'block';
    $('parse-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderParsedOutput(p) {
    const grid = $('parsed-output');
    grid.innerHTML = '';

    const cards = [
      {
        label: 'Candidate', value: `
          <div>${p.name}</div>
          ${p.email ? `<div style="color:var(--text-dim);font-size:0.8rem;margin-top:4px">${p.email}</div>` : ''}
          ${p.phone ? `<div style="color:var(--text-dim);font-size:0.8rem">${p.phone}</div>` : ''}
        `
      },
      {
        label: 'Education',
        value: p.education.map(e => `<div>${e}</div>`).join('') +
          (p.gpa ? `<div style="margin-top:4px;color:var(--accent);font-size:0.8rem">CGPA: ${p.gpa.score}/${p.gpa.max}</div>` : '')
      },
      {
        label: 'Experience',
        value: p.yearsExperience > 0
          ? `${p.yearsExperience} year${p.yearsExperience !== 1 ? 's' : ''} detected`
          : '<span style="color:var(--text-dim)">Fresher / Not specified</span>'
      },
      {
        label: `Skills Detected (${p.skills.length})`,
        value: `<div class="tag-row">${p.skills.slice(0, 20).map(s => `<span class="tag">${s}</span>`).join('')}${p.skills.length > 20 ? `<span class="tag blue">+${p.skills.length - 20} more</span>` : ''}</div>`
      },
      {
        label: 'Projects',
        value: p.projectCount > 0 ? `~${p.projectCount} project${p.projectCount !== 1 ? 's' : ''} found` : 'No projects detected'
      },
      ...(p.certifications.length ? [{
        label: `Certifications (${p.certifications.length})`,
        value: `<div class="tag-row">${p.certifications.slice(0, 4).map(c => `<span class="tag blue">${c}</span>`).join('')}</div>`
      }] : []),
      ...(p.redFlags.length ? [{
        label: '⚠ Data Quality Flags',
        value: `<div class="tag-row">${p.redFlags.map(f => `<span class="tag red">${f}</span>`).join('')}</div>`
      }] : []),
    ];

    for (const card of cards) {
      const el = document.createElement('div');
      el.className = 'parsed-card';
      el.innerHTML = `<div class="parsed-card-label">${card.label}</div><div class="parsed-card-value">${card.value}</div>`;
      grid.appendChild(el);
    }

    // Auto-navigate to JD page
    setTimeout(() => {
      showPage('jd');
    }, 1400);
  }

  // ---- JD Presets ----
  qsa('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.jd;
      const preset = JD_PRESETS[key];
      if (!preset) return;
      $('jd-text').value = preset.text;
      state.jdTitle = preset.title;
      qsa('.preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  $('btn-back-upload').addEventListener('click', () => showPage('upload'));
  $('btn-back-jd').addEventListener('click', () => showPage('jd'));
  $('btn-back-results').addEventListener('click', () => showPage('results'));

  // ---- Score button ----
  $('btn-score').addEventListener('click', async () => {
    const jd = $('jd-text').value.trim();
    if (!jd) { alert('Please enter a job description.'); return; }
    if (!state.parsed) { alert('Please parse a resume first.'); return; }

    state.jdText = jd;
    if (!state.jdTitle) state.jdTitle = 'Target Role';

    showLoading('Scoring Candidate', 'Running multi-factor analysis...');
    await sleep(600);
    $('loading-sub').textContent = 'Building skill ontology graph...';
    await sleep(500);
    $('loading-sub').textContent = 'Computing semantic similarity...';
    await sleep(500);
    $('loading-sub').textContent = 'Applying fairness normalization...';
    await sleep(400);

    state.scoreResult = Scorer.score(state.parsed, jd);
    hideLoading();

    if (!state.scoreResult) {
      alert('Scoring failed. Please check both resume and job description.');
      return;
    }

    renderResults(state.scoreResult);
    showPage('results');
  });

  // ---- Render Results ----
  function renderResults(r) {
    // Score ring
    const circumference = 2 * Math.PI * 52; // 326.7
    const offset = circumference * (1 - r.finalScore / 100);
    const ring = $('ring-fill');
    ring.style.strokeDasharray = circumference;
    ring.style.strokeDashoffset = circumference;
    $('score-num').textContent = '--';
    setTimeout(() => {
      ring.style.strokeDashoffset = offset;
      // Count up animation
      let current = 0;
      const target = r.finalScore;
      const step = Math.ceil(target / 40);
      const timer = setInterval(() => {
        current = Math.min(current + step, target);
        $('score-num').textContent = current;
        if (current >= target) clearInterval(timer);
      }, 25);
    }, 100);

    // Color the ring by score
    if (r.finalScore >= 70) ring.style.stroke = '#00e5a0';
    else if (r.finalScore >= 50) ring.style.stroke = '#ffc400';
    else ring.style.stroke = '#ff4d6d';

    $('score-verdict').textContent = r.verdict;

    // Factors
    const factorsList = $('factors-list');
    factorsList.innerHTML = '';
    for (const f of r.factors) {
      const el = document.createElement('div');
      el.className = 'factor-row';
      el.innerHTML = `
        <div class="factor-info">
          <span class="factor-name">${f.name}</span>
          <span class="factor-pct">${f.pct}%</span>
        </div>
        <div class="factor-bar-bg">
          <div class="factor-bar-fill" style="width:0%" data-target="${f.pct}"></div>
        </div>`;
      factorsList.appendChild(el);
    }
    setTimeout(() => {
      factorsList.querySelectorAll('.factor-bar-fill').forEach(bar => {
        bar.style.width = bar.dataset.target + '%';
      });
    }, 200);

    // Skills map
    const skillsWrap = $('skills-wrap');
    skillsWrap.innerHTML = '';
    const { matched, partial, missing } = r.skillMatch;
    for (const s of matched) skillsWrap.innerHTML += `<span class="skill-chip skill-match">✓ ${s}</span>`;
    for (const s of partial) skillsWrap.innerHTML += `<span class="skill-chip skill-partial">~ ${s}</span>`;
    for (const s of missing.slice(0, 8)) skillsWrap.innerHTML += `<span class="skill-chip skill-missing">✗ ${s}</span>`;

    // Gap analysis
    const gapContent = $('gap-content');
    gapContent.innerHTML = '';
    if (r.criticalGaps.length === 0) {
      gapContent.innerHTML = '<div class="gap-item"><div class="gap-dot green"></div><div class="gap-text"><strong>No critical gaps</strong> — All key skills are present.</div></div>';
    }
    for (const g of r.criticalGaps) {
      gapContent.innerHTML += `<div class="gap-item"><div class="gap-dot red"></div><div class="gap-text"><strong>${g}</strong> — Critical missing skill. High priority to learn.</div></div>`;
    }
    for (const g of r.partialGaps.slice(0, 3)) {
      gapContent.innerHTML += `<div class="gap-item"><div class="gap-dot yellow"></div><div class="gap-text"><strong>${g}</strong> — Partial match via related skills. Strengthen.</div></div>`;
    }
    if (r.skillMatch.bonusSkills.length > 0) {
      gapContent.innerHTML += `<div class="gap-item"><div class="gap-dot green"></div><div class="gap-text"><strong>Bonus:</strong> ${r.skillMatch.bonusSkills.slice(0,4).join(', ')} — Extra skills not required but valued.</div></div>`;
    }

    // XAI explanation
    $('explain-text').innerHTML = r.explanation;
  }

  // ---- Recs button ----
  $('btn-recs').addEventListener('click', async () => {
    showLoading('Generating Roadmap', 'Building personalized learning plan...');
    await sleep(600);
    $('loading-sub').textContent = 'Fetching AI insights...';

    // Build static recs immediately
    state.recs = Recommender.buildStaticRecs(state.parsed, state.scoreResult);
    renderRecs(state.recs);

    // Try to get AI insight (may fail if no API key)
    const aiInsight = await Recommender.generateAIInsight(state.parsed, state.scoreResult, state.jdTitle);

    hideLoading();
    showPage('recs');

    // Inject AI insight if we got one
    if (aiInsight && aiInsight.length > 50) {
      const aiBlock = document.createElement('div');
      aiBlock.className = 'rec-block';
      aiBlock.innerHTML = `
        <div class="rec-header">
          <div class="rec-icon green">🤖</div>
          <div>
            <div class="rec-title">AI Career Coach Insight</div>
            <div class="rec-subtitle">Personalized · Claude-powered analysis</div>
          </div>
        </div>
        <div style="font-size:0.88rem;color:var(--text-mid);line-height:1.8;">${aiInsight.split('\n\n').map(p => `<p style="margin-bottom:10px">${p}</p>`).join('')}</div>`;
      $('recs-container').prepend(aiBlock);
    }
  });

  function renderRecs(recs) {
    const container = $('recs-container');
    container.innerHTML = '';
    for (const rec of recs) {
      const block = document.createElement('div');
      block.className = 'rec-block';
      block.innerHTML = `
        <div class="rec-header">
          <div class="rec-icon ${rec.iconClass}">${rec.icon}</div>
          <div>
            <div class="rec-title">${rec.title}</div>
            <div class="rec-subtitle">${rec.subtitle}</div>
          </div>
        </div>
        <div class="rec-items">
          ${rec.items.map((item, i) => `
            <div class="rec-item">
              <div class="rec-item-num">${item.label || String(i + 1).padStart(2, '0')}</div>
              <div class="rec-item-text">
                <strong>${item.title}</strong>
                ${item.detail}
              </div>
            </div>
          `).join('')}
        </div>`;
      container.appendChild(block);
    }
  }

  // ---- Restart ----
  $('btn-restart').addEventListener('click', () => {
    state = { resumeText: '', parsed: null, jdText: '', jdTitle: '', scoreResult: null, recs: null };
    $('resume-text').value = '';
    $('jd-text').value = '';
    $('parse-section').style.display = 'none';
    qsa('.preset-btn').forEach(b => b.classList.remove('active'));
    showPage('upload');
  });

  // ---- Demo auto-fill ----
  // Provide a sample resume for demo purposes
  const DEMO_RESUME = `John Sharma
john.sharma@email.com | +91 9876543210

Summary:
Final year B.Tech Computer Science student with 1.5 years of internship experience in software development. Passionate about machine learning and full-stack development.

Education:
B.Tech Computer Science Engineering — IIT Bombay | CGPA: 8.4/10 | 2022-2026

Experience:
Software Engineering Intern — Flipkart | Jun 2024 - Dec 2024
- Built recommendation engine using Python and scikit-learn, improving CTR by 12%
- Developed REST APIs using FastAPI and PostgreSQL
- Used Docker for containerization and deployed on AWS EC2

ML Research Intern — IITB AI Lab | Jan 2024 - May 2024
- Implemented NLP pipeline for document classification using BERT and HuggingFace Transformers
- Data preprocessing with Pandas and NumPy

Skills:
Languages: Python, JavaScript, SQL, C++
ML/AI: TensorFlow, PyTorch, scikit-learn, NLP, Machine Learning, Deep Learning, Transformers
Web: React, Node.js, FastAPI, REST APIs
DevOps: Docker, Git, GitHub, Linux, CI/CD
Databases: PostgreSQL, MongoDB, Redis
Tools: Jupyter, VS Code, Jira, Agile

Projects:
1. PlacementAI — AI resume analyzer using NLP and semantic scoring. Built with Python, FastAPI, React.
2. Stock Price Predictor — LSTM-based model trained on NSE data. Achieved 89% directional accuracy.
3. Chat Application — Real-time chat with Socket.io, React, Node.js, MongoDB. 500+ concurrent users.
4. Open Source — Contributed 8 PRs to scikit-learn and HuggingFace repositories.

Certifications:
- AWS Cloud Practitioner (2024)
- Google Machine Learning Crash Course

Achievements:
- Smart India Hackathon 2024 — Finalist
- Competitive Programming: Leetcode 1850+ rating, Codeforces Specialist`;

  // Add demo button in upload page
  const demoBtn = document.createElement('button');
  demoBtn.className = 'btn-secondary';
  demoBtn.textContent = '⚡ Load Demo Resume';
  demoBtn.style.cssText = 'margin-left:auto; font-size:0.75rem;';
  demoBtn.addEventListener('click', async () => {
    $('resume-text').value = DEMO_RESUME;
    await triggerParse(DEMO_RESUME);
  });
  qs('#page-upload .action-row').appendChild(demoBtn);

})();
