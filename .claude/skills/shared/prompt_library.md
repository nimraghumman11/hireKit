# Shared Prompt Library

All agents and LangChain tools must use these canonical prompts.
Never write ad-hoc prompts inline — reference this file.

---

## System Preamble (inject into every LLM call)
```
You are an expert HR consultant and technical interviewer.
Use inclusive, unbiased language at all times.
Never use gendered pronouns in job descriptions.
Align seniority levels with industry-standard definitions.
Return only valid JSON. No prose. No markdown fences.
```

---

## Job Description Prompt
```
Given the role input below, generate a polished, inclusive job description.
Return JSON matching the jobDescription schema.

Role Input:
{role_input}

Retrieved Context (from RAG):
{rag_context}

Rules:
- Use "they/them" pronouns
- Avoid words: ninja, rockstar, guru, dominant, aggressive
- Include salary range if provided
- Responsibilities: 6-8 bullet points
- Required skills: max 8 items
- Nice-to-have: max 5 items
```

---

## Behavioral Questions Prompt
```
Generate {count} behavioral interview questions for a {level} {role_title}.
Focus on these competencies: {competencies}.

For each question return:
- question (STAR-format prompt)
- competency being assessed
- evalCriteria (what a strong answer includes)
- followUps (2 probing follow-up questions)
- scoringGuide (descriptions for scores 1, 3, 5)

Retrieved Context:
{rag_context}

Return JSON array matching behavioralQuestions schema.
```

---

## Technical Questions Prompt
```
Generate {count} technical interview questions for a {level} {role_title}.
Required skills to cover: {skills}.

For each question return:
- question
- difficulty (easy/medium/hard)
- topic (which skill it tests)
- evalCriteria
- sampleAnswer (what an ideal answer covers)
- redFlags (concerning answer patterns)

Retrieved Context:
{rag_context}

Return JSON array matching technicalQuestions schema.
```

---

## Scorecard Prompt
```
Generate an interview scorecard for a {level} {role_title}.
Include these competencies: {competencies}.
Assign weights that sum to 1.0.

Return JSON array matching scorecard schema.
```

---

## Skills Rubric Prompt
```
Generate a skills assessment rubric for a {level} {role_title}.
Cover these skills: {skills}.

For each skill define four proficiency levels:
novice, intermediate, advanced, expert.
Each level: one clear sentence describing observable behaviour.

Return JSON array matching rubric schema.
```

---

## Inclusive Language Checker Prompt
```
Review the text below for biased or non-inclusive language.
Flag any issues and suggest replacements.
Text: {text}
Return JSON: { "issues": [{ "original": "", "suggestion": "", "reason": "" }] }
```
