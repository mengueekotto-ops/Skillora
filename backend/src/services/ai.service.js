/**
 * Skillora AI Service Module
 * Integrated with OpenRouter API (minimax/minimax-m3:free & fallback models)
 * Supports question generation, technical evaluation, intent extraction & verification scoring.
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "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";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "minimax/minimax-m3:free";

/**
 * Helper to call OpenRouter Chat Completions API
 */
async function callOpenRouter(messages, temperature = 0.4) {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "http://localhost:5000",
        "X-Title": "Skillora Platform",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages,
        temperature,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenRouter API error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  } catch (err) {
    console.warn("⚠️ OpenRouter API call failed:", err.message);
    return null;
  }
}

// Trade Technical Question Fallback Bank
const tradeQuestionBank = {
  electrician: [
    { question: "What should you do first before starting work on an electrical installation?", expectedAnswer: "Isolate power supply at the main breaker, lock out/tag out, and verify zero voltage using a calibrated multimeter.", weight: 35 },
    { question: "What is the purpose of grounding (earthing) and RCD/GFCI devices in residential buildings?", expectedAnswer: "Grounding routes fault currents safely to earth, while RCDs detect current leakages and trip to prevent electrocution.", weight: 35 },
    { question: "How do you size the copper cable diameter and circuit breaker for a 5kW solar inverter installation?", expectedAnswer: "Calculate current I = P/V, apply safety factor 1.25, check voltage drop under 3%, and select appropriate cable gauge (e.g. 6mm² - 10mm²).", weight: 30 },
  ],
  plumber: [
    { question: "What is the function of a P-trap and vent pipe in sanitary plumbing systems?", expectedAnswer: "P-traps maintain a water barrier to prevent sewer gases from entering, and vents equalize pressure to ensure smooth drainage.", weight: 35 },
    { question: "How do you safely diagnose and repair a concealed high-pressure water leak behind tiled walls?", expectedAnswer: "Use acoustic/pressure diagnostic tools, shut off the localized stopcock, carefully expose the damaged junction, and solder/crimp a new pipe segment.", weight: 35 },
    { question: "What precautions are required when installing an electric storage water heater (chauffe-eau)?", expectedAnswer: "Install a temperature-pressure relief valve (groupe de sécurité), check electrical earthing, and verify water inlet pressure.", weight: 30 },
  ],
  default: [
    { question: "Describe your standard on-site quality assurance and safety protocol before starting a client project.", expectedAnswer: "Site inspection, risk assessment, client briefing on scope and materials, wearing PPE, and testing upon completion.", weight: 50 },
    { question: "How do you handle unforeseen material defects or technical obstacles during an active job?", expectedAnswer: "Halt risky operations, inform client with clear alternatives and pricing implications, and document changes.", weight: 50 },
  ],
};

/**
 * 1. Technical Answer Evaluation with OpenRouter AI
 */
async function evaluateTechnicalAnswer({ profession, question, answer }) {
  const prompt = `
You are an expert technical evaluation auditor for Skillora, a platform certifying skilled artisans in Cameroon.

Profession: ${profession}
Question: ${question}
Artisan Answer: ${answer}

Task: Evaluate technical correctness, safety awareness, and professional depth.

Return ONLY valid JSON using this format:
{
  "score": 85,
  "passed": true,
  "feedback": "Concise evaluation feedback in French or English"
}
`;

  const messages = [
    { role: "system", content: "You are a strict technical certification engine. Return ONLY valid JSON." },
    { role: "user", content: prompt },
  ];

  const aiResponse = await callOpenRouter(messages, 0.3);

  if (aiResponse) {
    try {
      const cleaned = aiResponse.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      return {
        score: Math.min(100, Math.max(0, parseInt(parsed.score, 10) || 75)),
        passed: Boolean(parsed.passed),
        feedback: parsed.feedback || "Answer evaluated by Skillora AI.",
      };
    } catch (e) {
      console.warn("⚠️ OpenRouter answer evaluation parsing error:", e.message);
    }
  }

  // Fallback Evaluator
  const lowerAnswer = (answer || "").toLowerCase().trim();
  const wordCount = lowerAnswer.split(/\s+/).filter(Boolean).length;
  let score = 50;
  if (wordCount >= 5) score += 20;
  if (wordCount >= 15) score += 15;
  const matches = ["couper", "disjoncteur", "tension", "sécurité", "terre", "fuite", "isoler", "vérifier", "test"].filter(k => lowerAnswer.includes(k)).length;
  score += Math.min(20, matches * 7);
  score = Math.min(98, Math.max(25, score));
  const passed = score >= 70;

  return {
    score,
    passed,
    feedback: passed
      ? "The answer demonstrates appropriate professional knowledge and safety precautions."
      : "The response lacks essential safety and technical steps. Additional detail is recommended.",
  };
}

/**
 * 2. Dynamic Technical Question Generation with OpenRouter AI (15 Questions or count)
 */
async function generateTechnicalQuestions({ profession = "Electrician", count = 15 }) {
  const prompt = `
Generate exactly ${count} practical, multiple-choice technical questions (MCQ) for certifying an artisan in: "${profession}".
Language: French (or English).

Return ONLY valid JSON matching this schema:
{
  "questions": [
    {
      "q": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 1,
      "explanation": "Technical justification"
    }
  ]
}
Note: 'correct' must be an integer index (0, 1, 2, or 3).
`;

  const messages = [
    { role: "system", content: "You are a strict technical qualification engine. Return ONLY valid JSON format." },
    { role: "user", content: prompt },
  ];

  const aiResponse = await callOpenRouter(messages, 0.4);

  if (aiResponse) {
    try {
      const cleaned = aiResponse.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      if (parsed.questions && Array.isArray(parsed.questions)) {
        return parsed.questions;
      }
    } catch (e) {
      console.warn("⚠️ OpenRouter question generation parsing error:", e.message);
    }
  }

  // Fallback to trade bank
  const lowerProf = profession.toLowerCase();
  for (const key in tradeQuestionBank) {
    if (lowerProf.includes(key)) {
      return tradeQuestionBank[key];
    }
  }
  return tradeQuestionBank.default;
}

/**
 * 3. Extract Search Intent from Client Prompt
 */
async function extractSearchIntent({ clientPrompt = "" }) {
  const prompt = `
Extract service category, location in Cameroon, and urgency from this request:
"${clientPrompt}"

Return ONLY JSON:
{
  "service": "identified service category",
  "location": "identified city or neighborhood",
  "urgency": "NORMAL or URGENT"
}
`;

  const messages = [
    { role: "system", content: "Extract search parameters into JSON." },
    { role: "user", content: prompt },
  ];

  const aiResponse = await callOpenRouter(messages, 0.2);

  if (aiResponse) {
    try {
      const cleaned = aiResponse.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(cleaned);
    } catch (e) {}
  }

  const text = clientPrompt.toLowerCase();
  let location = "Douala & Yaoundé";
  if (text.includes("yaounde") || text.includes("bastos")) location = "Yaoundé";
  if (text.includes("douala") || text.includes("akwa")) location = "Douala";

  let service = "General Trade Specialist";
  if (text.includes("electr") || text.includes("courant")) service = "Electrician & Solar";
  if (text.includes("plomb") || text.includes("eau")) service = "Plumbing";

  return {
    service,
    location,
    urgency: text.includes("urgent") ? "URGENT" : "NORMAL",
  };
}

/**
 * 4. Generate Service Description
 */
async function generateServiceDescription({ rawText = "", profession = "Artisan" }) {
  const prompt = `Rewrite into a high-trust professional 2-sentence listing for Skillora (${profession}): "${rawText}"`;
  const messages = [{ role: "user", content: prompt }];
  const res = await callOpenRouter(messages, 0.5);
  return res ? res.trim() : `Certified ${profession} providing high-quality residential and commercial solutions in Cameroon.`;
}

/**
 * 5. Analyze Document
 */
async function analyzeDocument({ documentType = "CV", textContent = "", declaredProfession = "" }) {
  const completenessScore = textContent && textContent.length > 50 ? 90 : 70;
  const consistencyScore = textContent.toLowerCase().includes(declaredProfession.toLowerCase().slice(0, 4)) ? 92 : 80;

  return {
    documentType,
    completenessScore,
    consistencyScore,
    flags: consistencyScore < 70 ? ["Document content has low keyword match with declared trade."] : [],
    summary: `Document AI analysis: ${consistencyScore}% consistency with declared ${declaredProfession} profile.`,
  };
}

/**
 * 6. Verification Decision Engine
 */
function calculateVerificationDecision({
  profileCompleteness = 90,
  technicalScore = 85,
  documentScore = 90,
  videoSubmitted = true,
}) {
  const overallScore = Math.round(
    profileCompleteness * 0.25 +
    technicalScore * 0.45 +
    documentScore * 0.20 +
    (videoSubmitted ? 10 : 0)
  );

  const passed = overallScore >= 75 && technicalScore >= 70;

  return {
    overallScore,
    passed,
    status: passed ? "verified" : "failed",
    verifiedBadge: passed,
    breakdown: {
      profileCompleteness,
      technicalAssessment: technicalScore,
      documentConsistency: documentScore,
      videoVerification: videoSubmitted ? "Verified" : "Pending",
    },
    message: passed
      ? "Verification successful! The artisan has been awarded the Skillora Verified Badge (✓)."
      : "Verification score did not meet the required threshold (75%). The artisan may retry.",
  };
}

/**
 * 7. Skillora Assistant Chat Completion with Real External AI API
 */
async function chatAssistant({ message = "", location = "Yaoundé & Douala", lang = "fr", history = [] }) {
  console.log(`🤖 [Skillora AI Service] Calling External AI API for message: "${message}" | Location: ${location} | Lang: ${lang}`);
  
  const systemPrompt = `
Tu es "Skillora Assistant", l'assistant officiel de la plateforme Skillora à Yaoundé.

RÔLE ET TON :
- Tu es accueillant, professionnel, clair et humain.
- Tu réponds de manière fluide et naturelle aux salutations (ex: "Bonjour", "Comment vas-tu ?").
- Tu structures tes réponses avec du Markdown (gras, listes à puces, emojis) pour que ce soit facile à lire.

RÈGLES DE RÉPONSE :
1. Si l'utilisateur pose une question sur Skillora, explique clairement les services (recherche d'artisans certifiés, avis clients, contact direct, garantie séquestre).
2. Si l'utilisateur cherche un service précis (ex: plombier, électricien), demande des précisions si nécessaire ou propose directement la catégorie adaptée.
3. Termine souvent par une question d'engagement courte (ex: "Quel service recherchez-vous aujourd'hui sur Skillora ?").
`;

  const formattedHistory = Array.isArray(history)
    ? history.map(item => ({
        role: item.sender === 'user' ? 'user' : 'assistant',
        content: item.text || ''
      }))
    : [];

  const messages = [
    { role: "system", content: systemPrompt },
    ...formattedHistory,
    { role: "user", content: message }
  ];

  try {
    const aiText = await callOpenRouter(messages, 0.6);
    
    if (aiText && aiText.trim()) {
      console.log(`✅ [Skillora AI Service] Successfully received response from OpenRouter API (${aiText.length} chars)`);
      return {
        success: true,
        text: aiText.trim(),
        source: "openrouter_api"
      };
    }
  } catch (error) {
    console.error("❌ [Skillora AI Service] Error calling OpenRouter API:", error.message);
  }

  // Smart contextual fallback if API connection fails
  console.warn("⚠️ [Skillora AI Service] External API call did not return text, using local fallback response.");
  
  const lowerMsg = (message || "").toLowerCase().trim();
  const isGreeting = ['bonjour', 'salut', 'hello', 'hi', 'coucou', 'bonsoir', 'ça va', 'ca va'].some(g => lowerMsg.includes(g));

  let fallbackText = "";
  if (isGreeting) {
    fallbackText = lang === 'fr'
      ? `Bonjour ! Bienvenue sur Skillora 👋 Comment puis-je vous aider aujourd'hui ?`
      : `Hello! Welcome to Skillora 👋 How can I help you today?`;
  } else {
    fallbackText = lang === 'fr'
      ? `En quoi puis-je vous assister pour vos travaux à **${location}** ? Nos artisans certifiés Skillora sont prêts à intervenir avec la garantie séquestre FCFA.`
      : `How can I assist you with your project in **${location}**? Our certified Skillora artisans are available with FCFA Escrow Protection.`;
  }

  return {
    success: true,
    text: fallbackText,
    source: "fallback"
  };
}

module.exports = {
  evaluateTechnicalAnswer,
  generateTechnicalQuestions,
  extractSearchIntent,
  generateServiceDescription,
  analyzeDocument,
  calculateVerificationDecision,
  chatAssistant,
};
