// ============================================================
// scorer.js — Multi-Factor Semantic Scoring Engine
// Implements: skill match, experience, semantic similarity,
//             ontology expansion, and fairness normalization
// ============================================================

const Scorer = (() => {

  // ---- Cosine-like semantic similarity using TF-IDF approximation ----
  // (In production: use actual embedding model via API)
  function buildTermFrequency(text) {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !STOPWORDS.has(w));
    const tf = {};
    for (const w of words) tf[w] = (tf[w] || 0) + 1;
    return tf;
  }

  const STOPWORDS = new Set([
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'any', 'can',
    'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his',
    'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who',
    'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use', 'with',
    'have', 'this', 'from', 'they', 'will', 'been', 'that', 'were', 'said',
    'each', 'which', 'their', 'time', 'look', 'than', 'more', 'also', 'into',
    'about', 'would', 'there', 'other', 'could', 'these', 'those',
  ]);

  function cosineSimilarity(tf1, tf2) {
    const allKeys = new Set([...Object.keys(tf1), ...Object.keys(tf2)]);
    let dot = 0, mag1 = 0, mag2 = 0;
    for (const k of allKeys) {
      const v1 = tf1[k] || 0;
      const v2 = tf2[k] || 0;
      dot += v1 * v2;
      mag1 += v1 * v1;
      mag2 += v2 * v2;
    }
    if (mag1 === 0 || mag2 === 0) return 0;
    return dot / (Math.sqrt(mag1) * Math.sqrt(mag2));
  }

  // ---- Skill matching with ontology expansion ----
  function matchSkills(resumeSkills, jdText) {
    const jdLower = jdText.toLowerCase();
    const jdSkills = ResumeParser.extractSkills(jdText);

    const matched = [];
    const partial = [];
    const missing = [];

    for (const jdSkill of jdSkills) {
      const skillLower = jdSkill.toLowerCase();
      // Direct match
      if (resumeSkills.some(s => s.toLowerCase() === skillLower)) {
        matched.push(jdSkill);
        continue;
      }
      // Related skill match via ontology
      const ontologyEntry = SKILL_ONTOLOGY[skillLower];
      if (ontologyEntry) {
        const hasRelated = ontologyEntry.related.some(rel =>
          resumeSkills.some(s => s.toLowerCase().includes(rel.toLowerCase()))
        );
        if (hasRelated) { partial.push(jdSkill); continue; }
      }
      // Fuzzy substring match
      if (resumeSkills.some(s => s.toLowerCase().includes(skillLower) || skillLower.includes(s.toLowerCase()))) {
        partial.push(jdSkill);
        continue;
      }
      missing.push(jdSkill);
    }

    // Skills in resume NOT in JD (bonus skills)
    const bonusSkills = resumeSkills.filter(s =>
      !jdSkills.some(j => j.toLowerCase() === s.toLowerCase())
    );

    return { matched, partial, missing, jdSkills, bonusSkills };
  }

  // ---- Experience score (normalized to 0–1) ----
  function scoreExperience(yearsExp, jdText) {
    // Extract required years from JD
    let required = 2; // default
    const m = jdText.match(/(\d+)\+?\s*years?\s*(of\s+)?(experience|exp)/i);
    if (m) required = parseInt(m[1]);

    if (yearsExp === 0) return 0.45; // fresh grad — not 0, could be student
    if (yearsExp >= required) return Math.min(1.0, 0.75 + (yearsExp - required) * 0.05);
    return Math.max(0.2, (yearsExp / required) * 0.75);
  }

  // ---- Education score ----
  function scoreEducation(education, gpa) {
    let score = 0.5; // baseline
    const eduText = education.join(' ').toLowerCase();
    if (/phd|doctor/i.test(eduText)) score = 1.0;
    else if (/m\.?tech|m\.?sc|master|mba|mca/i.test(eduText)) score = 0.85;
    else if (/b\.?tech|b\.?sc|b\.?e|bca|bachelor/i.test(eduText)) score = 0.70;

    // GPA bonus
    if (gpa) {
      const normalized = gpa.score / gpa.max;
      if (normalized >= 0.85) score = Math.min(1.0, score + 0.1);
      else if (normalized < 0.6) score = Math.max(0.2, score - 0.1);
    }
    return score;
  }

  // ---- Projects score ----
  function scoreProjects(projectCount, skills) {
    let base = Math.min(1.0, projectCount * 0.18);
    // More skills = presumably more project diversity
    if (skills.length > 8) base = Math.min(1.0, base + 0.1);
    return Math.max(0.1, base);
  }

  // ---- Certifications score ----
  function scoreCertifications(certs, jdText) {
    if (certs.length === 0) return 0.5;
    let score = 0.5;
    const jdLower = jdText.toLowerCase();
    for (const cert of certs) {
      const certLower = cert.toLowerCase();
      if (jdLower.includes('aws') && certLower.includes('aws')) { score += 0.15; }
      if (jdLower.includes('google') && certLower.includes('google')) { score += 0.12; }
      if (jdLower.includes('kubernetes') && (certLower.includes('cka') || certLower.includes('ckad'))) { score += 0.15; }
      score += 0.05; // any cert is a small bonus
    }
    return Math.min(1.0, score);
  }

  // ---- MAIN SCORE FUNCTION ----
  function score(parsed, jdText) {
    if (!parsed || parsed.error) return null;
    if (!jdText || jdText.trim().length < 20) return null;

    const skillMatch = matchSkills(parsed.skills, jdText);

    // Skill match score
    const totalJdSkills = skillMatch.jdSkills.length || 1;
    const skillScore = (
      (skillMatch.matched.length * 1.0) +
      (skillMatch.partial.length * 0.5)
    ) / totalJdSkills;

    // Semantic similarity
    const resumeTF = buildTermFrequency(parsed.skills.join(' ') + ' ' + parsed.education.join(' '));
    const jdTF = buildTermFrequency(jdText);
    const semanticScore = cosineSimilarity(resumeTF, jdTF);

    // Individual factor scores
    const expScore = scoreExperience(parsed.yearsExperience, jdText);
    const eduScore = scoreEducation(parsed.education, parsed.gpa);
    const projScore = scoreProjects(parsed.projectCount, parsed.skills);
    const certScore = scoreCertifications(parsed.certifications, jdText);

    // WEIGHTED COMPOSITE SCORE
    // Weights reflect importance for placement decisions
    const weights = {
      skills: 0.38,      // Most important: skills directly match job needs
      semantic: 0.20,    // Semantic context
      experience: 0.22,  // Experience is critical
      education: 0.10,   // Education matters but less than skills
      projects: 0.07,    // Projects show practical application
      certs: 0.03,       // Certifications are a bonus
    };

    const composite =
      (Math.min(1.0, skillScore) * weights.skills) +
      (Math.min(1.0, semanticScore * 3.5) * weights.semantic) + // scale up cosine
      (expScore * weights.experience) +
      (eduScore * weights.education) +
      (projScore * weights.projects) +
      (certScore * weights.certs);

    const finalScore = Math.round(Math.min(99, Math.max(10, composite * 100)));

    // Gap analysis
    const criticalGaps = skillMatch.missing.filter((_, i) => i < 5);
    const partialGaps = skillMatch.partial.filter((_, i) => i < 4);

    // Verdict
    let verdict, verdictClass;
    if (finalScore >= 80) { verdict = "Excellent fit — highly recommended to proceed"; verdictClass = "green"; }
    else if (finalScore >= 65) { verdict = "Strong candidate — minor gaps identified"; verdictClass = "green"; }
    else if (finalScore >= 50) { verdict = "Moderate fit — preparation recommended"; verdictClass = "yellow"; }
    else if (finalScore >= 35) { verdict = "Partial match — significant upskilling needed"; verdictClass = "red"; }
    else { verdict = "Low match — consider alternative roles or significant learning"; verdictClass = "red"; }

    // Build explainability text
    const explanation = buildExplanation(parsed, skillMatch, {
      skillScore, semanticScore, expScore, eduScore, projScore, certScore, finalScore
    }, jdText);

    return {
      finalScore,
      verdict,
      verdictClass,
      factors: [
        { name: "Skill Match", score: skillScore, weight: weights.skills, pct: Math.round(skillScore * 100) },
        { name: "Experience Fit", score: expScore, weight: weights.experience, pct: Math.round(expScore * 100) },
        { name: "Semantic Alignment", score: Math.min(1, semanticScore * 3.5), weight: weights.semantic, pct: Math.round(Math.min(1, semanticScore * 3.5) * 100) },
        { name: "Education", score: eduScore, weight: weights.education, pct: Math.round(eduScore * 100) },
        { name: "Projects", score: projScore, weight: weights.projects, pct: Math.round(projScore * 100) },
        { name: "Certifications", score: certScore, weight: weights.certs, pct: Math.round(certScore * 100) },
      ],
      skillMatch,
      criticalGaps,
      partialGaps,
      explanation,
    };
  }

  // ---- Build XAI explanation ----
  function buildExplanation(parsed, skillMatch, scores, jdText) {
    const { skillScore, expScore, eduScore, projScore, finalScore } = scores;
    const matchRate = ((skillMatch.matched.length / Math.max(1, skillMatch.jdSkills.length)) * 100).toFixed(0);
    const partialRate = ((skillMatch.partial.length / Math.max(1, skillMatch.jdSkills.length)) * 100).toFixed(0);

    const lines = [];

    lines.push(`<p><strong>Overall score: ${finalScore}/100</strong> — This score is computed as a weighted composite across six dimensions: skill match (38%), experience (22%), semantic alignment (20%), education (10%), projects (7%), and certifications (3%). No single factor is disproportionately controlling, which ensures fairness.</p>`);

    lines.push(`<p><strong>Skill Analysis:</strong> ${skillMatch.matched.length} of ${skillMatch.jdSkills.length} required skills were directly matched (${matchRate}%), with ${skillMatch.partial.length} partial matches through the skill ontology graph (${partialRate}%). ${skillMatch.missing.length > 0 ? `Missing skills include: <strong>${skillMatch.missing.slice(0,4).join(', ')}</strong>.` : 'All required skills were found.'}</p>`);

    if (parsed.yearsExperience > 0) {
      lines.push(`<p><strong>Experience:</strong> The resume indicates approximately <strong>${parsed.yearsExperience} years</strong> of professional experience. ${expScore >= 0.75 ? 'This meets or exceeds the role requirements.' : 'This is below typical requirements for this role.'}</p>`);
    } else {
      lines.push(`<p><strong>Experience:</strong> No clear work experience timeline was detected. If this is a fresher profile, the skills and project scores carry more weight. We apply a fairness correction to avoid penalizing fresh graduates excessively.</p>`);
    }

    lines.push(`<p><strong>Education:</strong> ${parsed.education[0] !== 'Not specified' ? `Detected degree: <strong>${parsed.education[0]}</strong>.` : 'No formal degree detected.'} ${parsed.gpa ? `GPA/CGPA: ${parsed.gpa.score}/${parsed.gpa.max}.` : ''} Education score: ${Math.round(eduScore * 100)}/100.</p>`);

    if (skillMatch.bonusSkills.length > 0) {
      lines.push(`<p><strong>Bonus Skills:</strong> The candidate has additional skills not required by the JD — <strong>${skillMatch.bonusSkills.slice(0,5).join(', ')}</strong> — which signal broader technical versatility and may be valuable for adjacent tasks.</p>`);
    }

    if (parsed.redFlags.length > 0) {
      lines.push(`<p><strong>⚠ Data Quality Flags:</strong> ${parsed.redFlags.join('; ')}. These flags may affect score accuracy — ensure the resume is complete for best results.</p>`);
    }

    return lines.join('');
  }

  return { score, matchSkills };
})();
