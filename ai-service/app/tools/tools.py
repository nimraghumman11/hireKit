"""LangChain tool definitions for interview kit generation."""
from __future__ import annotations
import json
import uuid
import logging
from langchain.prompts import ChatPromptTemplate
from app.tools.llm import get_llm
from app.retrieval.retriever import get_retriever

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────
# Prompt templates
# ──────────────────────────────────────────────────────────────

PARSE_ROLE_PROMPT = ChatPromptTemplate.from_messages([
    ("system", (
        "You are a senior HR strategist and talent acquisition expert. "
        "Your job is to extract richly structured role information from plain language descriptions. "
        "Infer unstated details using deep knowledge of industry norms, role archetypes, and hiring best practices. "
        "Return ONLY valid JSON — no prose, no markdown fences."
    )),
    ("human", """A hiring manager wrote this description of a role they want to fill:

\"\"\"{description}\"\"\"

Extract and infer the following information. Be generous — use industry knowledge to fill gaps intelligently.

Return a JSON object:
{{
  "roleTitle": "precise, industry-standard job title (e.g. 'Senior Backend Engineer', not just 'Engineer')",
  "department": "one of: Engineering, Product, Design, Marketing, Sales, Operations, Finance, HR, Legal, Customer Success, Data, Security, DevOps",
  "experienceLevel": "one of: junior, mid, senior, lead, principal, director",
  "workMode": "one of: remote, hybrid, onsite — infer from context or default to remote",
  "teamSize": "estimated team size if inferable (e.g. '5-10 engineers'), else null",
  "responsibilities": [
    "6-8 specific, action-verb-led responsibilities that are concrete and measurable",
    "Each should describe what the person WILL DO, not generic job duties",
    "Include collaboration, ownership, and delivery expectations"
  ],
  "requiredSkills": [
    "Technical and domain skills that are truly required",
    "Be specific — not 'programming' but 'Python', not 'databases' but 'PostgreSQL'"
  ],
  "niceToHaveSkills": [
    "Genuinely optional skills that would add value",
    "Empty array if none can be inferred"
  ],
  "focusAreas": [
    "2-5 interview focus areas from: technical_depth, system_design, communication, leadership, problem_solving, culture_fit, domain_knowledge, execution, collaboration, product_thinking, data_fluency, security_mindset"
  ],
  "additionalNotes": "Any relevant context: team stage, product domain, growth trajectory, or null"
}}"""),
])


JD_PROMPT = ChatPromptTemplate.from_messages([
    ("system", (
        "You are a world-class HR copywriter who crafts compelling, inclusive, bias-free job descriptions "
        "that attract diverse, high-quality candidates. "
        "Your JDs are specific, honest, and human — they read like a conversation, not a legal document. "
        "Avoid jargon like 'rockstar', 'ninja', 'guru', 'unicorn'. "
        "Use gender-neutral language. Lead responsibilities with strong action verbs. "
        "Return ONLY valid JSON — no prose, no markdown fences."
    )),
    ("human", """Write a complete, professional job description for the following role.

Role: {experience_level} {role_title}
Department: {department}
Work arrangement: {work_mode}
Core responsibilities: {responsibilities}
Required skills: {required_skills}
Nice-to-have skills: {nice_to_have_skills}
Additional context: {additional_notes}

Industry / role context (use this to add depth and realism):
{rag_context}

Produce a richly detailed job description with these exact sections. Return JSON:
{{
  "aboutTheRole": "3-4 sentences. Describe the purpose of the role, its place in the organization, and the problems this person will solve. Make it compelling and specific — mention the domain, stage of the product/team, and what success looks like in the first year.",
  "whyJoinUs": "2-3 sentences on what makes this role / team exciting. Mention growth opportunity, impact, tech stack, or mission — infer from context.",
  "responsibilities": [
    "8-10 specific, action-verb-led bullets (Design, Build, Own, Drive, Partner, Mentor, etc.)",
    "Each bullet should describe an outcome or area of ownership, not a vague duty",
    "Include cross-functional collaboration and any leadership expectations for the seniority level",
    "For senior/lead roles include mentoring, architectural decisions, and roadmap influence"
  ],
  "requiredQualifications": [
    "6-10 must-have qualifications written as full sentences",
    "Be specific about years of experience, technologies, and depth expected",
    "Include both technical AND soft skills / behavioral expectations",
    "Phrase as inclusive requirements — avoid exclusionary language"
  ],
  "preferredQualifications": [
    "4-6 nice-to-have qualifications that would strengthen the candidacy",
    "Frame these as 'experience with' or 'familiarity with', not hard requirements"
  ],
  "whatYoullBring": "2-3 sentences describing the mindset, values, and working style that thrives in this role. Focus on how the person thinks and collaborates, not just what they know.",
  "compensationAndBenefits": "1-2 sentences on salary range (infer a realistic market range for the role, level, and location), equity if applicable, and 3-5 representative benefits (e.g. health insurance, flexible PTO, learning budget, home office stipend, 401k). Keep it honest and attractive.",
  "workMode": "{work_mode}",
  "summary": "A single punchy paragraph (3-4 sentences) suitable for a job board listing card. Captures the role essence, level, domain, and one compelling reason to apply.",
  "requiredSkills": {required_skills_list},
  "niceToHaveSkills": {nice_to_have_skills_list}
}}

IMPORTANT: Every string field must be real, detailed content — not template placeholders. The aboutTheRole, responsibilities, and requiredQualifications are the most important sections. Make them specific to a {experience_level} {role_title}.
"""),
])


BEHAVIORAL_PROMPT = ChatPromptTemplate.from_messages([
    ("system", (
        "You are a senior talent acquisition specialist and organizational psychologist. "
        "You design behavioral interview questions using the STAR framework (Situation, Task, Action, Result). "
        "Your questions reveal real competencies, not rehearsed answers. "
        "Each scoring guide must describe SPECIFIC observable behaviors, not vague adjectives. "
        "Return ONLY valid JSON array — no prose, no markdown fences."
    )),
    ("human", """Design a complete behavioral interview question bank for a {experience_level} {role_title}.

Focus areas to cover: {focus_areas}
Key responsibilities context: {responsibilities}
Industry context: {rag_context}

QUANTITY GUIDE:
{count_guide}

QUALITY REQUIREMENTS:
- Cover all listed focus areas with at least one question each
- Include a mix of past-behavior questions ("Tell me about a time...") and hypothetical/situational ones ("How would you approach...")
- For lead/senior roles, include questions about mentoring, conflict resolution, technical decision-making under ambiguity, and stakeholder management
- Each question must be specific to the role and level — not generic HR filler
- Scoring guide MUST have concrete behavioral indicators, not just "poor/adequate/excellent"

Return a JSON array:
[{{
  "id": "bq-1",
  "question": "Full question text — specific, open-ended, non-leading",
  "competency": "The competency this question probes (e.g. 'Technical Leadership', 'Cross-functional Collaboration', 'Handling Ambiguity', 'Conflict Resolution', 'Execution Under Pressure')",
  "evalCriteria": "2-3 sentences describing what a strong response covers: what specifics to listen for, what the answer structure should look like, what depth of reflection is expected",
  "followUps": [
    "A probing follow-up that digs deeper into the story",
    "A follow-up that challenges or stress-tests the answer (e.g. 'What would you do differently?')",
    "An optional third follow-up about lessons learned or scaling the approach"
  ],
  "scoringGuide": {{
    "1": "POOR: Specific description of a weak response. E.g.: Gives a vague or hypothetical answer with no concrete example. Cannot describe their own contribution vs. the team's. Shows no reflection or learning. Answer is generic and could apply to anyone.",
    "3": "MEETS EXPECTATIONS: Specific description of an adequate response. E.g.: Shares a relevant example with a clear situation and outcome. Articulates their specific actions but lacks depth on challenges faced or alternatives considered. Shows some self-awareness.",
    "5": "EXCEEDS EXPECTATIONS: Specific description of an excellent response. E.g.: Provides a crisp, structured STAR narrative with quantifiable impact. Clearly owns their decisions, acknowledges trade-offs, explains what they learned, and connects the experience to broader principles they now apply."
  }}
}}]

Each scoring guide description must be UNIQUE to that question's competency — do not reuse the same language across questions.
"""),
])


TECHNICAL_PROMPT = ChatPromptTemplate.from_messages([
    ("system", (
        "You are a staff-level engineer and technical interviewer with 10+ years of experience "
        "conducting and designing technical interviews across a range of disciplines. "
        "Your questions are precise, fair, and reveal genuine depth of knowledge — not trivia. "
        "Questions test thinking process, not memorization. "
        "Sample answers must be thorough and correct. "
        "Red flags must be specific and actionable. "
        "Return ONLY valid JSON array — no prose, no markdown fences."
    )),
    ("human", """Design a complete technical interview question bank for a {experience_level} {role_title}.

Required skills to assess: {required_skills}
Role responsibilities: {responsibilities}
Industry context: {rag_context}

QUANTITY & COVERAGE GUIDE:
{count_guide}

COVERAGE REQUIREMENTS:
- Assess EVERY required skill with at least one question
- Mix question types: conceptual (what/why), applied (how would you), scenario-based (given X, what do you do), debugging/troubleshooting
- For senior/lead roles, include at least 2 system design or architecture questions
- Include at least one question that probes for depth vs. breadth (can distinguish a 3-year from a 7-year practitioner)
- Difficulty distribution: junior = mostly easy/medium; mid = balanced; senior/lead = mostly medium/hard

QUALITY REQUIREMENTS:
- Questions must be specific to the role, not generic
- Sample answers must be substantive (4-8 sentences), technically correct, and describe what an ideal answer covers
- Red flags must be concrete behaviors or misconceptions to watch for (not vague like "doesn't understand basics")

Return a JSON array:
[{{
  "id": "tq-1",
  "question": "Full question text — clear, unambiguous, appropriately scoped for the level",
  "difficulty": "easy | medium | hard",
  "topic": "The specific skill or knowledge area being assessed (e.g. 'React state management', 'PostgreSQL query optimization', 'API rate limiting design')",
  "evalCriteria": "2-3 sentences: what concepts must the candidate demonstrate? what depth is expected? what does a passing answer look like vs. an exceptional one?",
  "sampleAnswer": "A thorough model answer (4-8 sentences) covering the key points a strong candidate should hit. Include the core concept, a practical approach or example, mention of trade-offs if applicable, and any nuances that distinguish a senior vs. junior answer.",
  "redFlags": [
    "Specific misconception or gap that would concern you (e.g. 'Cannot distinguish between X and Y', 'Proposes a solution that introduces race conditions')",
    "Another concrete warning sign",
    "Optional: a behavioral red flag (e.g. 'Refuses to engage with the question without perfect information')"
  ]
}}]
"""),
])


# ── Lightweight prompts for fast per-section regeneration ─────────────────
# These produce ~60% fewer output tokens than the full prompts by using
# shorter field lengths. Used only in regenerate endpoints, not full kit gen.

BEHAVIORAL_REGEN_PROMPT = ChatPromptTemplate.from_messages([
    ("system", (
        "You are a behavioral interview question designer. "
        "Return ONLY a valid JSON array — no prose, no markdown fences."
    )),
    ("human", """Generate {count} behavioral interview questions for a {experience_level} {role_title}.

Focus areas: {focus_areas}
Context: {responsibilities}

Return a JSON array — keep each field concise:
[{{
  "id": "bq-1",
  "question": "Specific behavioral question using STAR framework",
  "competency": "Competency name (e.g. 'Cross-functional Collaboration')",
  "evalCriteria": "One sentence: what a strong answer demonstrates.",
  "followUps": ["One probing follow-up question"],
  "scoringGuide": {{
    "1": "Weak: vague answer, no concrete example, no self-reflection.",
    "3": "Adequate: relevant example with clear outcome, limited depth.",
    "5": "Strong: crisp STAR narrative, quantifiable impact, clear ownership and learning."
  }}
}}]"""),
])

TECHNICAL_REGEN_PROMPT = ChatPromptTemplate.from_messages([
    ("system", (
        "You are a technical interviewer. "
        "Return ONLY a valid JSON array — no prose, no markdown fences."
    )),
    ("human", """Generate {count} technical interview questions for a {experience_level} {role_title}.

Skills to assess: {required_skills}

Return a JSON array — be concise:
[{{
  "id": "tq-1",
  "question": "Specific technical question for the level",
  "difficulty": "easy | medium | hard",
  "topic": "Skill being assessed",
  "evalCriteria": "What a strong answer must cover.",
  "sampleAnswer": "1-2 sentence model answer with the core concept.",
  "redFlags": ["Key misconception to watch for"]
}}]"""),
])


def generate_behavioral_questions_fast(role_input: dict, count: int = 5) -> list:
    """Lightweight version for regeneration — shorter output, same quality questions."""
    return _call_llm_json(BEHAVIORAL_REGEN_PROMPT, {
        "role_title": role_input["roleTitle"],
        "experience_level": role_input["experienceLevel"],
        "focus_areas": ", ".join(role_input.get("focusAreas", ["technical_depth", "problem_solving", "collaboration"])),
        "responsibilities": "; ".join(role_input.get("responsibilities", [])[:4]),
        "count": count,
    }, temperature=0.6)


def generate_technical_questions_fast(role_input: dict, count: int = 5) -> list:
    """Lightweight version for regeneration — shorter output, same quality questions."""
    return _call_llm_json(TECHNICAL_REGEN_PROMPT, {
        "role_title": role_input["roleTitle"],
        "experience_level": role_input["experienceLevel"],
        "required_skills": ", ".join(role_input.get("requiredSkills", [])),
        "count": count,
    }, temperature=0.4)


SCORECARD_PROMPT = ChatPromptTemplate.from_messages([
    ("system", (
        "You are a talent evaluation expert who designs structured interview scorecards. "
        "Competencies must be specific to the role and seniority level — not generic HR boilerplate. "
        "Weights must reflect actual importance to role success. "
        "Return ONLY valid JSON array — no prose, no markdown fences."
    )),
    ("human", """Design a structured interview scorecard for a {experience_level} {role_title} in {department}.

Focus areas: {focus_areas}
Key skills: {required_skills}

INSTRUCTIONS:
- Derive 5-7 competencies that are SPECIFIC to this role and level
- Do not use overly generic names like 'Communication' alone — be specific: 'Technical Communication & Documentation', 'Cross-functional Collaboration'
- For senior/lead roles, include a 'Technical Leadership & Mentoring' or 'Strategic Thinking' competency
- Weights must sum to exactly 1.0 (use two decimal places)
- Weight technical competencies more heavily for IC roles; leadership/strategy more heavily for lead/director roles
- Notes field should be a 1-2 sentence guide for the interviewer on what to look for during scoring

Return a JSON array (weights must sum to 1.0):
[{{
  "competency": "Specific competency name relevant to this role",
  "weight": 0.20,
  "score": null,
  "notes": "Interviewer guide: what observable behaviors or answers indicate a high score on this competency. E.g.: 'Look for candidates who can explain the trade-offs of architectural decisions and cite specific past systems they have built at scale.'"
}}]
"""),
])


RUBRIC_PROMPT = ChatPromptTemplate.from_messages([
    ("system", (
        "You are a skills assessment expert who creates calibrated competency rubrics for technical hiring. "
        "Each proficiency level must describe CONCRETE, OBSERVABLE behaviors and outcomes — "
        "not vague adjectives. An interviewer should be able to map a candidate's response directly to a level. "
        "Return ONLY valid JSON array — no prose, no markdown fences."
    )),
    ("human", """Create a detailed skills assessment rubric for these skills: {skills}

Hiring for seniority level: {experience_level}

QUALITY REQUIREMENTS:
- Each proficiency level must describe specific, observable work behaviors and output quality
- Descriptions should reference real work artifacts, decisions, or interactions
- Calibrate to industry standards: a 'novice' React developer vs. an 'expert' React developer should be clearly distinguishable
- For the hiring level ({experience_level}), indicate in the notes which proficiency levels are the hiring bar

Return a JSON array:
[{{
  "skill": "Exact skill name",
  "proficiencyLevels": {{
    "novice": "1-2 sentences of concrete behaviors. E.g.: Can follow existing patterns and tutorials to build simple features. Requires guidance on debugging, architectural choices, and edge cases. Work output typically needs significant review.",
    "intermediate": "1-2 sentences of concrete behaviors. E.g.: Independently builds and ships features end-to-end within a known stack. Identifies and fixes bugs with minimal guidance. Understands common patterns and can evaluate basic trade-offs.",
    "advanced": "1-2 sentences of concrete behaviors. E.g.: Designs and implements complex features across the stack, including performance optimization and security considerations. Contributes to architectural decisions. Can mentor others and lead technical discussions.",
    "expert": "1-2 sentences of concrete behaviors. E.g.: Sets technical direction for the skill area. Identifies systemic issues and drives improvements across teams. Produces reusable patterns, frameworks, or tooling adopted by others. Recognized internally or externally as a domain authority."
  }}
}}]

Make each description SPECIFIC to the skill — a Python rubric should look different from a PostgreSQL rubric.
"""),
])


LANGUAGE_CHECK_PROMPT = ChatPromptTemplate.from_messages([
    ("system", (
        "You are a diversity, equity, and inclusion (DEI) language specialist. "
        "You review HR content for exclusionary, biased, or non-inclusive language. "
        "Flag gendered terms, ableist language, age-biased terms, culture-exclusive idioms, "
        "and unnecessarily intimidating or grandiose job title language. "
        "Return ONLY valid JSON array — no prose, no markdown fences."
    )),
    ("human", """Review the following HR/job description content for non-inclusive or biased language.

{text}

For each issue found, return a JSON object. Return an empty array [] if the text is fully inclusive.

Flag these categories:
- Gendered terms: 'he/she', 'manpower', 'chairman', 'salesman', 'mankind'
- Exclusionary role language: 'rockstar', 'ninja', 'guru', 'wizard', 'unicorn', 'killer instinct'
- Ableist terms: 'crazy', 'insane', 'lame', 'blind spot' (in certain contexts), 'stand-up' (instead of 'sync')
- Age-biased terms: 'digital native', 'recent graduate preferred', implied youth preferences
- Culture-exclusive idioms or sports metaphors that may not translate globally
- Requirements that screen out rather than attract (e.g., '10+ years experience with X' where X is only 5 years old)

Return a JSON array:
[{{
  "term": "the exact problematic term or phrase",
  "suggestion": "a specific inclusive replacement or how to rephrase",
  "severity": "error (must fix) | warning (should review)"
}}]"""),
])


# ──────────────────────────────────────────────────────────────
# LLM call helper
# ──────────────────────────────────────────────────────────────

def _call_llm_json(prompt: ChatPromptTemplate, variables: dict, temperature: float = 0.3, max_retries: int = 3) -> dict | list:
    """Invoke the LLM and parse JSON output.  Retries up to max_retries times on JSON decode errors."""
    llm = get_llm(temperature)
    chain = prompt | llm
    last_error: Exception | None = None

    for attempt in range(1, max_retries + 1):
        try:
            result = chain.invoke(variables)
            content = result.content if hasattr(result, "content") else str(result)
            content = content.strip()
            # Strip markdown code fences (```json … ``` or ``` … ```)
            if content.startswith("```"):
                content = content.split("\n", 1)[1].rsplit("```", 1)[0].strip()
            return json.loads(content)
        except json.JSONDecodeError as exc:
            last_error = exc
            logger.warning("LLM returned invalid JSON (attempt %d/%d): %s", attempt, max_retries, exc)
        except Exception as exc:
            last_error = exc
            logger.warning("LLM call failed (attempt %d/%d): %s", attempt, max_retries, exc)
            if attempt == max_retries:
                break

    raise RuntimeError(f"LLM call failed after {max_retries} attempts: {last_error}") from last_error


# ──────────────────────────────────────────────────────────────
# Public generation functions
# ──────────────────────────────────────────────────────────────

def parse_plain_description(description: str) -> dict:
    return _call_llm_json(PARSE_ROLE_PROMPT, {"description": description}, temperature=0.2)


def generate_job_description(role_input: dict, rag_context: str) -> dict:
    required_skills = role_input.get("requiredSkills", [])
    nice_to_have = role_input.get("niceToHaveSkills", [])
    return _call_llm_json(JD_PROMPT, {
        "role_title": role_input["roleTitle"],
        "department": role_input["department"],
        "experience_level": role_input["experienceLevel"],
        "work_mode": role_input.get("workMode", "remote"),
        "responsibilities": "\n".join(f"- {r}" for r in role_input.get("responsibilities", [])),
        "required_skills": ", ".join(required_skills),
        "nice_to_have_skills": ", ".join(nice_to_have),
        "additional_notes": role_input.get("additionalNotes") or "Not provided",
        # Pass as JSON so the prompt can embed them as arrays in the output schema
        "required_skills_list": json.dumps(required_skills),
        "nice_to_have_skills_list": json.dumps(nice_to_have),
        "rag_context": rag_context or "No additional context available.",
    }, temperature=0.4)


def generate_behavioral_questions(role_input: dict, rag_context: str, count: int | None = None) -> list:
    level = role_input["experienceLevel"]
    if count is None:
        count_guide = (
            "- junior: 5-6 questions\n"
            "- mid: 6-8 questions\n"
            "- senior: 8-10 questions\n"
            "- lead / principal / director: 10-12 questions"
        )
    else:
        count_guide = f"Generate exactly {count} questions."
    return _call_llm_json(BEHAVIORAL_PROMPT, {
        "role_title": role_input["roleTitle"],
        "experience_level": level,
        "focus_areas": ", ".join(role_input.get("focusAreas", ["technical_depth", "problem_solving", "collaboration"])),
        "responsibilities": "\n".join(f"- {r}" for r in role_input.get("responsibilities", [])),
        "rag_context": rag_context or "No additional context available.",
        "count_guide": count_guide,
    }, temperature=0.6)


def generate_technical_questions(role_input: dict, rag_context: str, count: int | None = None) -> list:
    if count is None:
        count_guide = (
            "- junior: 5-6 questions, focus on fundamentals and problem-solving basics\n"
            "- mid: 7-9 questions, balance fundamentals with applied scenarios\n"
            "- senior: 10-12 questions, include system design, trade-offs, and depth\n"
            "- lead / principal: 12-14 questions, include architectural decisions, scalability, and org/process questions"
        )
    else:
        count_guide = f"Generate exactly {count} questions."
    return _call_llm_json(TECHNICAL_PROMPT, {
        "role_title": role_input["roleTitle"],
        "experience_level": role_input["experienceLevel"],
        "required_skills": ", ".join(role_input.get("requiredSkills", [])),
        "responsibilities": "\n".join(f"- {r}" for r in role_input.get("responsibilities", [])),
        "rag_context": rag_context or "No additional context available.",
        "count_guide": count_guide,
    }, temperature=0.4)


def generate_scorecard(role_input: dict) -> list:
    return _call_llm_json(SCORECARD_PROMPT, {
        "role_title": role_input["roleTitle"],
        "department": role_input.get("department", "Engineering"),
        "experience_level": role_input["experienceLevel"],
        "focus_areas": ", ".join(role_input.get("focusAreas", ["technical_depth", "problem_solving", "collaboration"])),
        "required_skills": ", ".join(role_input.get("requiredSkills", [])),
    }, temperature=0.2)


def generate_rubric(role_input: dict) -> list:
    return _call_llm_json(RUBRIC_PROMPT, {
        "skills": ", ".join(role_input.get("requiredSkills", [])),
        "experience_level": role_input["experienceLevel"],
    }, temperature=0.2)


def run_inclusive_language_check(text: str, source: str = "jobDescription") -> list:
    issues = _call_llm_json(LANGUAGE_CHECK_PROMPT, {"text": text}, temperature=0.1)
    if not isinstance(issues, list):
        return []
    for issue in issues:
        issue["source"] = source
    return issues


# ──────────────────────────────────────────────────────────────
# Token-streaming variants  (used by /generate-kit/stream)
# Each function is a *synchronous generator* that yields raw
# token strings from the LLM as they arrive, exactly like GPT.
# The caller accumulates the tokens, then json.loads() the result.
# ──────────────────────────────────────────────────────────────

def _strip_fences(text: str) -> str:
    """Remove markdown code fences that some models add around JSON."""
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
    return text


def stream_section_tokens(prompt: ChatPromptTemplate, variables: dict, temperature: float = 0.3):
    """Core streaming primitive — yields raw token strings from the LLM."""
    llm = get_llm(temperature)
    chain = prompt | llm
    for chunk in chain.stream(variables):
        content = chunk.content if hasattr(chunk, "content") else ""
        if content:
            yield content


def stream_job_description(role_input: dict, rag_context: str):
    required_skills = role_input.get("requiredSkills", [])
    nice_to_have = role_input.get("niceToHaveSkills", [])
    return stream_section_tokens(JD_PROMPT, {
        "role_title": role_input["roleTitle"],
        "department": role_input["department"],
        "experience_level": role_input["experienceLevel"],
        "work_mode": role_input.get("workMode", "remote"),
        "responsibilities": "\n".join(f"- {r}" for r in role_input.get("responsibilities", [])),
        "required_skills": ", ".join(required_skills),
        "nice_to_have_skills": ", ".join(nice_to_have),
        "additional_notes": role_input.get("additionalNotes") or "Not provided",
        "required_skills_list": json.dumps(required_skills),
        "nice_to_have_skills_list": json.dumps(nice_to_have),
        "rag_context": rag_context or "No additional context available.",
    }, temperature=0.4)


def stream_behavioral_questions(role_input: dict, rag_context: str):
    count_guide = (
        "- junior: 5-6 questions\n- mid: 6-8 questions\n"
        "- senior: 8-10 questions\n- lead / principal / director: 10-12 questions"
    )
    return stream_section_tokens(BEHAVIORAL_PROMPT, {
        "role_title": role_input["roleTitle"],
        "experience_level": role_input["experienceLevel"],
        "focus_areas": ", ".join(role_input.get("focusAreas", ["technical_depth", "problem_solving", "collaboration"])),
        "responsibilities": "\n".join(f"- {r}" for r in role_input.get("responsibilities", [])),
        "rag_context": rag_context or "No additional context available.",
        "count_guide": count_guide,
    }, temperature=0.6)


def stream_technical_questions(role_input: dict, rag_context: str):
    count_guide = (
        "- junior: 5-6 questions, focus on fundamentals\n"
        "- mid: 7-9 questions, balance fundamentals with applied scenarios\n"
        "- senior: 10-12 questions, include system design and trade-offs\n"
        "- lead / principal: 12-14 questions, include architectural decisions"
    )
    return stream_section_tokens(TECHNICAL_PROMPT, {
        "role_title": role_input["roleTitle"],
        "experience_level": role_input["experienceLevel"],
        "required_skills": ", ".join(role_input.get("requiredSkills", [])),
        "responsibilities": "\n".join(f"- {r}" for r in role_input.get("responsibilities", [])),
        "rag_context": rag_context or "No additional context available.",
        "count_guide": count_guide,
    }, temperature=0.4)


def stream_scorecard(role_input: dict):
    return stream_section_tokens(SCORECARD_PROMPT, {
        "role_title": role_input["roleTitle"],
        "department": role_input.get("department", "Engineering"),
        "experience_level": role_input["experienceLevel"],
        "focus_areas": ", ".join(role_input.get("focusAreas", ["technical_depth", "problem_solving", "collaboration"])),
        "required_skills": ", ".join(role_input.get("requiredSkills", [])),
    }, temperature=0.2)


def stream_rubric(role_input: dict):
    return stream_section_tokens(RUBRIC_PROMPT, {
        "skills": ", ".join(role_input.get("requiredSkills", [])),
        "experience_level": role_input["experienceLevel"],
    }, temperature=0.2)
