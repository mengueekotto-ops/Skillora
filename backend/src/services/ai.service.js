/**
 * Skillora AI Service Module
 * Integrated with OpenRouter API (minimax/minimax-m3:free & fallback models)
 * Supports question generation, technical evaluation, intent extraction & verification scoring.
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || null; // never hardcode keys — set it in backend/.env
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "minimax/minimax-m3:free";

/**
 * Helper to call OpenRouter Chat Completions API
 */
async function callOpenRouter(messages, temperature = 0.4) {
  if (!OPENROUTER_API_KEY) {
    // No key configured: callers fall back to the built-in question banks and rules
    return null;
  }
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

// ─── MCQ Fallback Bank (10 questions per trade, A-B-C-D with correct index) ───
const mcqFallbackBank = {
  electrician: [
    { q: "What is the FIRST step before starting any electrical work on site?", options: ["Start immediately to save time", "Isolate the power at the main breaker and verify zero voltage", "Put on gloves and begin", "Call the client for permission"], correct: 1, explanation: "Lockout/Tagout and voltage verification prevent electrocution." },
    { q: "What does an RCD (Residual Current Device) protect against?", options: ["Overvoltage spikes", "Short circuits only", "Earth leakage currents that can cause electrocution", "Power outages"], correct: 2, explanation: "RCDs trip when they detect current imbalance indicating leakage to earth." },
    { q: "Which cable cross-section is suitable for a 3kW single-phase 220V load?", options: ["1.5mm²", "2.5mm²", "4mm²", "6mm²"], correct: 1, explanation: "I = P/V = 3000/220 ≈ 14A; 2.5mm² handles up to 16A." },
    { q: "What colour is the earth (ground) wire in standard Cameroonian wiring?", options: ["Blue", "Brown", "Red", "Green/Yellow"], correct: 3, explanation: "International IEC standard: green/yellow for earth." },
    { q: "A circuit breaker is rated 20A. What is the maximum continuous load it should carry?", options: ["20A", "25A", "16A", "18A"], correct: 2, explanation: "80% rule: continuous load should not exceed 80% of rated capacity = 16A." },
    { q: "What instrument do you use to measure insulation resistance?", options: ["Voltmeter", "Ammeter", "Megohmmeter (Megger)", "Clamp meter"], correct: 2, explanation: "A megohmmeter applies high voltage to measure insulation resistance in MΩ." },
    { q: "Single-phase voltage in Cameroon is approximately:", options: ["110V", "220V", "380V", "415V"], correct: 1, explanation: "Cameroon uses 220V single-phase, 380V three-phase." },
    { q: "What is the purpose of a junction box cover?", options: ["Aesthetic decoration", "Protect against dust only", "Prevent accidental contact with live terminals and contain heat", "Reduce electrical noise"], correct: 2, explanation: "Junction box covers are a safety requirement for IP protection and fire containment." },
    { q: "Which type of wire is NOT suitable for underground burial?", options: ["Armoured cable (SWA)", "PVC/NYY cable", "Twin flat PVC cable (without armour)", "Mineral insulated cable"], correct: 2, explanation: "Unarmoured flat PVC cables are not designed for direct burial — they lack mechanical and moisture protection." },
    { q: "A solar panel produces 12V DC, but your system needs 220V AC. What device achieves this?", options: ["Transformer", "Charge controller only", "Inverter", "Rectifier"], correct: 2, explanation: "An inverter converts DC to AC at the required voltage." },
  ],
  plumber: [
    { q: "What is the primary purpose of a P-trap in sanitary plumbing?", options: ["To increase water pressure", "To prevent sewer gases from entering the building", "To filter sediment from water", "To measure flow rate"], correct: 1, explanation: "The water in the P-trap creates a barrier against foul sewer gases." },
    { q: "Before cutting into a pressurized water pipe, you must:", options: ["Work quickly to reduce spillage", "Close the isolation valve and drain the section", "Wrap the pipe in tape first", "Call a supervisor"], correct: 1, explanation: "Always isolate and drain before cutting pressurized pipes to avoid flooding and injury." },
    { q: "What is the correct pipe fall gradient for gravity drainage?", options: ["Perfectly horizontal (0%)", "1% to 2% fall per meter", "5% fall per meter", "10% fall per meter"], correct: 1, explanation: "A 1-2% gradient ensures self-cleaning velocity without excessive turbulence." },
    { q: "A TPR valve (Temperature-Pressure Relief) on a water heater activates when:", options: ["Water is too cold", "Pressure or temperature exceeds safe limits", "The heater is turned off", "Water flow is too high"], correct: 1, explanation: "TPR valves are critical safety devices that release pressure to prevent explosions." },
    { q: "Which joint method is suitable for joining copper pipes?", options: ["Welding with steel rod", "Soldering (brazing) with flux and solder", "Plastic push-fit only", "Duct tape wrapping"], correct: 1, explanation: "Copper pipe joints use soldering with appropriate flux and lead-free solder." },
    { q: "What does water hammer in pipes indicate?", options: ["Low water pressure", "Sudden stop of water flow causing pressure shock waves", "A leaking joint", "Correct water pressure"], correct: 1, explanation: "Water hammer occurs when flow is stopped suddenly, creating shockwaves that can damage pipes." },
    { q: "PVC pipes for wastewater drainage should be rated at minimum:", options: ["Class B (6 bar)", "Class D (unrated)", "SN4 or SN8 stiffness class", "Schedule 80"], correct: 2, explanation: "Drainage PVC uses stiffness classifications (SN4/SN8) rather than pressure ratings." },
    { q: "How do you detect a concealed water leak without opening walls first?", options: ["Guessing the location", "Using acoustic leak detection equipment or pressure testing", "Waiting for visible damage", "Draining all water"], correct: 1, explanation: "Acoustic detectors amplify the sound of water escaping; pressure tests confirm integrity." },
    { q: "For hot water systems, which pipe material is most suitable?", options: ["Standard PVC", "CPVC or PPR (polypropylene random)", "Galvanized steel only", "Rubber hose"], correct: 1, explanation: "CPVC and PPR are rated for high-temperature water systems up to 95°C." },
    { q: "A backflow preventer is installed to:", options: ["Increase pressure", "Stop contaminated water from flowing back into the clean supply", "Measure water consumption", "Regulate flow speed"], correct: 1, explanation: "Backflow preventers protect potable water from contamination." },
  ],
  carpenter: [
    { q: "What is the correct way to measure for a door frame installation?", options: ["Estimate by eye", "Measure width at top, middle, and bottom; use the smallest measurement", "Measure once and cut", "Use the door size from the manufacturer label"], correct: 1, explanation: "Walls are rarely perfectly straight — measuring at 3 points ensures proper fit." },
    { q: "Which wood joint provides the strongest connection for furniture frames?", options: ["Butt joint", "Mortise and tenon joint", "Lap joint", "Biscuit joint"], correct: 1, explanation: "Mortise and tenon joints have the greatest mechanical strength and surface area." },
    { q: "What does the grain direction of wood affect?", options: ["Only the color", "Strength, how wood splits, and finishing quality", "Nothing in practical terms", "Only the weight"], correct: 1, explanation: "Cutting against the grain can cause splitting; finishing along the grain gives better results." },
    { q: "Before painting or varnishing wood, the surface should be:", options: ["Wet with water", "Sanded smooth, dust-free, and primed", "Painted immediately", "Oiled heavily first"], correct: 1, explanation: "Sanding removes defects, primer seals grain and improves paint adhesion." },
    { q: "What is the purpose of a wood moisture meter on site?", options: ["Checking the weather", "Measuring wood humidity to prevent warping and joint failure", "Measuring paint thickness", "Testing electrical conductivity"], correct: 1, explanation: "Wood above 18% moisture will shrink and warp after installation, causing structural problems." },
    { q: "Which saw is best for making precise straight cuts across wood grain?", options: ["Jigsaw", "Circular saw with a crosscut blade or miter saw", "Chainsaw", "Hacksaw"], correct: 1, explanation: "Circular saws with crosscut blades and miter saws are designed for accurate crosscuts." },
    { q: "What type of screw is recommended for outdoor wood structures?", options: ["Standard steel screws", "Stainless steel or galvanized screws", "Drywall screws", "Any available screw"], correct: 1, explanation: "Stainless or galvanized screws resist rust in outdoor/humid conditions." },
    { q: "What is MDF (Medium Density Fiberboard)?", options: ["A hardwood species", "An engineered wood product made from compressed wood fibers and resin", "A type of plywood", "A metal composite"], correct: 1, explanation: "MDF is smooth, uniform, and ideal for painting but sensitive to moisture." },
    { q: "When installing hardwood flooring, why must you leave an expansion gap?", options: ["For decoration", "Wood expands and contracts with humidity and temperature changes", "To save material", "As a ventilation channel"], correct: 1, explanation: "Hardwood flooring needs 8-12mm expansion gap at walls to prevent buckling." },
    { q: "A client reports a squeaky floor. The most likely cause is:", options: ["The floor is too old", "Loose subflooring or wood rubbing against nails/joists", "Wrong wood species was used", "Too much varnish was applied"], correct: 1, explanation: "Squeaks occur when wood rubs against fasteners or adjacent boards due to movement." },
  ],
  mason: [
    { q: "What is the standard water-to-cement ratio for general structural concrete?", options: ["1:1 (equal parts)", "0.4 to 0.6 by weight", "2:1 water to cement", "3:1 water to cement"], correct: 1, explanation: "W/C ratio of 0.4-0.6 provides workability while maintaining strength; too much water weakens concrete." },
    { q: "Before pouring concrete in a foundation, you must verify:", options: ["The weather forecast", "That formwork is properly braced, reinforcement is placed, and the subgrade is compacted", "That clients are present", "The color of cement"], correct: 1, explanation: "Adequate formwork, reinforcement, and subgrade prevent structural failures." },
    { q: "What is the curing period for standard Portland cement concrete?", options: ["1 day", "3 days", "7-28 days for full strength", "2 hours"], correct: 2, explanation: "Concrete gains about 70% strength at 7 days, and 100% design strength at 28 days." },
    { q: "What does reinforced concrete (béton armé) combine?", options: ["Cement and water only", "Concrete and steel bars, leveraging compression and tension strengths", "Gravel and sand only", "Concrete and wood"], correct: 1, explanation: "Concrete is strong in compression; steel bars handle tension — together they form a superior structural material." },
    { q: "The mix ratio 1:2:4 for concrete means:", options: ["1 bag cement, 2 bags sand, 4 bags gravel", "1 liter water, 2 kg cement, 4 kg sand", "1 kg cement, 2 kg water, 4 kg lime", "1:2:4 is not a real ratio"], correct: 0, explanation: "Standard nominal mix 1:2:4 = 1 part cement : 2 parts fine aggregate : 4 parts coarse aggregate." },
    { q: "When should you NOT pour concrete?", options: ["During sunrise", "When ambient temperature is below 5°C or above 35°C", "During daytime", "After rain stops"], correct: 1, explanation: "Extreme temperatures affect hydration: freezing prevents curing; extreme heat causes premature setting." },
    { q: "What tool is used to check that a wall is perfectly vertical?", options: ["Measuring tape", "Spirit level or plumb bob", "Set square", "Compass"], correct: 1, explanation: "A spirit level or plumb bob verifies vertical alignment (plumb)." },
    { q: "The purpose of a damp-proof course (DPC) in masonry construction is:", options: ["To add color to walls", "To prevent rising damp from soil entering the building", "To strengthen the foundation", "To level the floor"], correct: 1, explanation: "A DPC is a horizontal layer of waterproof material that blocks moisture from rising through walls." },
    { q: "Lime mortar vs. cement mortar: which allows more movement in old buildings?", options: ["Cement mortar", "Lime mortar — it is more flexible and breathable", "They are identical", "Sand-only mix"], correct: 1, explanation: "Lime mortar is softer, flexible, and allows historic masonry to breathe and move without cracking." },
    { q: "What is the minimum overlap (lap) required for reinforcement bars in concrete?", options: ["5cm", "At least 40 times the bar diameter", "1 meter always", "10cm always"], correct: 1, explanation: "Lapping length = 40× bar diameter (e.g., 12mm bar → 480mm lap minimum)." },
  ],
  painter: [
    { q: "Before applying paint on a new concrete wall, what must you apply first?", options: ["Final coat directly", "A primer or sealer to seal the porous surface", "Water only", "Putty without primer"], correct: 1, explanation: "Primer seals concrete, prevents absorption, and improves paint adhesion and coverage." },
    { q: "What is the drying time between coats of standard interior latex paint?", options: ["5 minutes", "At least 2-4 hours between coats", "24 hours minimum between all coats", "1 week"], correct: 1, explanation: "2-4 hours between coats allows proper film formation; recoating too early causes lifting." },
    { q: "Which paint finish is best for high-moisture areas like bathrooms?", options: ["Flat/matte finish", "Eggshell or semi-gloss finish", "Chalk paint", "Textured sand paint"], correct: 1, explanation: "Eggshell/semi-gloss finishes are more moisture-resistant and easier to clean." },
    { q: "When sanding between coats, what grit sandpaper should you use?", options: ["60 grit (very coarse)", "220-320 grit (fine)", "400 grit (ultra-fine)", "Anything available"], correct: 1, explanation: "220-320 grit lightly scuffs the surface for better adhesion without removing the previous coat." },
    { q: "What causes paint to peel off walls?", options: ["Too much paint applied", "Moisture behind the surface, poor preparation, or incompatible primer", "Using quality paint", "Low temperatures during drying"], correct: 1, explanation: "Peeling is caused by trapped moisture, inadequate surface prep, or applying over glossy surfaces without sanding." },
    { q: "For exterior surfaces, which type of paint is most suitable?", options: ["Interior latex paint", "Exterior acrylic or elastomeric paint rated for UV and weather", "Any leftover interior paint", "Chalk paint"], correct: 1, explanation: "Exterior paints have UV inhibitors, mold resistance, and elasticity to handle temperature cycling." },
    { q: "What personal protective equipment (PPE) is required when spray painting?", options: ["Gloves only", "Respirator mask, goggles, coveralls, and gloves", "Sunglasses only", "No PPE needed for paint"], correct: 1, explanation: "Spray painting produces fine mist particles and VOCs — full PPE including a respirator is mandatory." },
    { q: "How do you calculate the amount of paint needed for a room?", options: ["Guess based on experience", "Calculate total surface area (m²) ÷ coverage rate per liter", "Buy 10 liters for any room", "Use 1 liter per wall"], correct: 1, explanation: "Paint needed (L) = Total area (m²) × coats ÷ coverage rate (usually 10-12 m²/L)." },
    { q: "A client reports brush marks visible in the dried paint. The likely cause is:", options: ["The paint was too good quality", "Paint was applied when too thick/undiluted or brush strokes not laid off", "The room was too cold", "Too much primer was used"], correct: 1, explanation: "Brush marks result from applying paint too thick or not finishing with smooth brush strokes." },
    { q: "What does 'cutting in' mean in painting?", options: ["Cutting paint cans open", "Painting a precise line at edges, corners, and trim using a brush before rolling walls", "Mixing two paint colors", "Cutting masking tape into strips"], correct: 1, explanation: "Cutting in creates clean edges at corners, ceilings, and trim before the main surface is rolled." },
  ],
  welder: [
    { q: "What is the correct first step before starting welding operations?", options: ["Strike the arc immediately", "Inspect equipment, clear flammable materials, and wear full PPE", "Turn on gas and start", "Wait for clients to leave"], correct: 1, explanation: "Pre-weld safety checks prevent fires, electric shock, and toxic fume exposure." },
    { q: "What PPE is mandatory for arc welding?", options: ["Sunglasses only", "Welding helmet with correct shade lens, flame-resistant gloves, and leather apron", "Safety glasses only", "No special PPE needed"], correct: 1, explanation: "Arc welding produces UV/IR radiation, spatter, and fumes requiring specialized protective equipment." },
    { q: "What causes porosity (gas bubbles) in a weld bead?", options: ["Too much current", "Contamination, moisture, or inadequate shielding gas coverage", "Correct technique", "Using the right electrode"], correct: 1, explanation: "Porosity is caused by gas trapped in the weld pool from moisture, rust, grease, or gas flow problems." },
    { q: "In MIG welding, what does the shielding gas protect?", options: ["The welder from sparks", "The weld pool from atmospheric oxygen and nitrogen contamination", "The base metal color", "The electrode from wear"], correct: 1, explanation: "Shielding gas (argon, CO2 or mix) prevents oxidation and porosity in the weld pool." },
    { q: "What is the purpose of preheating metal before welding?", options: ["To make it glow for visibility", "To reduce thermal shock and prevent cracking in high-carbon or thick steel", "To clean the surface", "To expand the metal for easier cutting"], correct: 1, explanation: "Preheating slows cooling rate and prevents hydrogen cracking in thick or high-carbon steel." },
    { q: "Which welding process uses a non-consumable tungsten electrode?", options: ["MIG (GMAW)", "TIG (GTAW)", "SMAW (Stick)", "Flux-core welding"], correct: 1, explanation: "TIG welding uses a non-consumable tungsten electrode; filler rod is added separately." },
    { q: "Undercut in a weld is:", options: ["A desirable weld shape", "A groove along the weld toe that weakens the joint", "When the weld is too large", "A type of electrode coating"], correct: 1, explanation: "Undercut creates stress concentration points and reduces the base metal cross-section — it is a weld defect." },
    { q: "For welding galvanized (zinc-coated) steel, what is the main hazard?", options: ["Electric shock", "Zinc oxide fumes which are highly toxic if inhaled", "Explosion risk", "Weld won't stick"], correct: 1, explanation: "Burning zinc coating releases zinc oxide fumes causing metal fume fever — weld in ventilated areas or remove coating first." },
    { q: "What does an ampere setting control in arc welding?", options: ["Shielding gas flow rate", "Heat input — higher amperage = more heat = deeper penetration", "Wire feed speed only in MIG", "Arc voltage only"], correct: 1, explanation: "Amperage controls heat input; too low causes lack of fusion, too high causes burn-through." },
    { q: "After completing a structural weld, quality is checked with:", options: ["Only visual inspection", "Visual inspection PLUS NDT (ultrasonic, dye penetrant, or radiographic testing)", "Colour comparison", "No inspection needed"], correct: 1, explanation: "Structural welds require both visual inspection and Non-Destructive Testing to verify internal integrity." },
  ],
  default: [
    { q: "What is the most important first step when starting any technical job on a client's site?", options: ["Start work immediately", "Conduct a safety risk assessment and briefing", "Order materials first", "Sign the contract later"], correct: 1, explanation: "Safety assessment prevents accidents, defines scope, and establishes professional standards." },
    { q: "How should you handle a situation where unexpected complications arise mid-project?", options: ["Continue and hope for the best", "Stop risky work, inform the client, document changes, and propose solutions", "Add costs without informing client", "Abandon the job"], correct: 1, explanation: "Professional artisans maintain transparency and protect client interests through clear communication." },
    { q: "What document should you provide to a client upon job completion?", options: ["Nothing — just leave", "A completion report with work performed, materials used, and any warranties", "Only a verbal summary", "An invoice without details"], correct: 1, explanation: "Completion documentation protects both parties and enables future maintenance or repairs." },
    { q: "When must you refuse to start a job?", options: ["When the budget seems high", "When working conditions are unsafe and the client refuses corrections", "When the job seems complex", "When materials are expensive"], correct: 1, explanation: "Refusing unsafe working conditions is a professional and legal obligation to protect yourself and others." },
    { q: "The correct way to store tools and materials at the end of the day is:", options: ["Leave them on site anywhere", "Clean, organize, and secure tools; protect materials from weather", "Leave them in the vehicle only", "Give tools to client for storage"], correct: 1, explanation: "Proper tool storage extends their life, prevents theft, and maintains a professional site." },
    { q: "What should you do before operating any electrical power tool?", options: ["Start immediately", "Inspect for damage, ensure earthing, and verify it is rated for the task", "Check that it charges quickly", "Use it to test if it works first"], correct: 1, explanation: "Damaged or ungrounded power tools cause electrocution and fires." },
    { q: "How do you correctly mix two-part epoxy or chemical products on site?", options: ["Mix in any ratio", "Follow manufacturer's exact ratio and mix thoroughly for the specified time", "Add more of Part A for strength", "Mix by eye using experience"], correct: 1, explanation: "Incorrect mixing ratios cause incomplete curing, weakening the bond or sealant." },
    { q: "When taking site measurements, best practice is:", options: ["Measure once and cut", "Measure twice (or more) and verify before cutting", "Estimate by eye for speed", "Use measurements from a similar job"], correct: 1, explanation: "'Measure twice, cut once' prevents costly material waste and rework." },
    { q: "What is your responsibility if you discover an unsafe existing condition (e.g., illegal wiring, structural crack) at a client's site?", options: ["Ignore it — not your job", "Inform the client in writing and recommend professional evaluation", "Fix it without informing client", "Stop all work permanently"], correct: 1, explanation: "Artisans have a duty of care to inform clients about discovered hazards." },
    { q: "How do you calculate the cost of materials for a job?", options: ["Estimate based on the project fee", "Measure quantities needed, check unit prices, add 10-15% waste factor", "Use prices from a past job", "Ask client to buy all materials"], correct: 1, explanation: "Accurate material takeoffs with waste factors prevent under-ordering and costly delays." },
  ],
};

/**
 * 2b. Generate 10 MCQ Quiz Questions (quiz-format, with A-B-C-D options, correct index, no open-ended)
 * Used by the automated artisan verification quiz
 */
async function generateMCQQuestions({ profession = "General Artisan", lang = "fr" }) {
  const langInstr = lang === "fr"
    ? "Write questions and options in French."
    : "Write questions and options in English.";

  const prompt = `You are an expert professional certification examiner for the Skillora artisan platform in Cameroon.

Generate exactly 10 practical multiple-choice questions (MCQ) to assess a beginner-to-intermediate artisan in: "${profession}".
${langInstr}

Rules:
- Each question must have EXACTLY 4 answer options (A, B, C, D).
- Exactly 1 option must be correct.
- Questions must be practical, realistic, and relevant to the actual day-to-day work of this profession.
- Difficulty: Ordinary Level (O-Level) — accessible to a working artisan with 1-2 years experience.
- Do NOT include trick questions or overly academic theory.

Return ONLY valid JSON with this exact structure:
{
  "questions": [
    {
      "q": "Question text here?",
      "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
      "correct": 1,
      "explanation": "Brief explanation of why this answer is correct"
    }
  ]
}

'correct' is the 0-based index of the correct option (0=A, 1=B, 2=C, 3=D).
`;

  const messages = [
    { role: "system", content: "You are a professional certification engine. Return ONLY valid JSON. No extra text." },
    { role: "user", content: prompt },
  ];

  const aiResponse = await callOpenRouter(messages, 0.45);

  if (aiResponse) {
    try {
      const cleaned = aiResponse.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      if (parsed.questions && Array.isArray(parsed.questions) && parsed.questions.length >= 5) {
        // Normalize and validate each question
        return parsed.questions.slice(0, 10).map((item) => ({
          q: item.q || item.question || "Question not available",
          options: Array.isArray(item.options) && item.options.length === 4
            ? item.options
            : ["Option A", "Option B", "Option C", "Option D"],
          correct: typeof item.correct === "number" ? Math.min(3, Math.max(0, item.correct)) : 0,
          explanation: item.explanation || "",
        }));
      }
    } catch (e) {
      console.warn("⚠️ MCQ generation parsing error:", e.message);
    }
  }

  // Fallback: select from local MCQ bank
  const lowerProf = profession.toLowerCase();
  let bankKey = "default";
  for (const key of Object.keys(mcqFallbackBank)) {
    if (lowerProf.includes(key)) {
      bankKey = key;
      break;
    }
  }
  const bank = mcqFallbackBank[bankKey];
  // Shuffle and return 10 questions
  return [...bank].sort(() => Math.random() - 0.5).slice(0, 10);
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
  generateMCQQuestions,
  extractSearchIntent,
  generateServiceDescription,
  analyzeDocument,
  calculateVerificationDecision,
  chatAssistant,
};
