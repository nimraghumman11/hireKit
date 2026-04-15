"""Generate PDF from interview kit data using fpdf2 (pure Python, no system deps)."""
from __future__ import annotations
import logging
from pathlib import Path
from fpdf import FPDF
from config import get_settings

logger = logging.getLogger(__name__)

BRAND = (67, 97, 238)   # indigo-600
DARK  = (15, 23, 42)    # slate-900
MUTED = (100, 116, 139) # slate-500
LINE  = (226, 232, 240) # slate-200
WHITE = (255, 255, 255)


class KitPDF(FPDF):
    def __init__(self, role_title: str, department: str):
        super().__init__()
        self.role_title = role_title
        self.department = department
        self.set_auto_page_break(auto=True, margin=20)
        self.add_page()

    def header(self):
        # Brand bar
        self.set_fill_color(*BRAND)
        self.rect(0, 0, 210, 14, "F")
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(*WHITE)
        self.set_xy(10, 3)
        self.cell(0, 8, "Interview Kit", ln=False)
        self.set_xy(0, 3)
        self.cell(200, 8, "AI-Generated", align="R")
        self.ln(18)

    def footer(self):
        self.set_y(-12)
        self.set_font("Helvetica", "", 8)
        self.set_text_color(*MUTED)
        self.cell(0, 8, f"Page {self.page_no()} - Confidential", align="C")

    # ── helpers ──────────────────────────────────────────────────

    def _divider(self):
        self.set_draw_color(*LINE)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(4)

    def _section_heading(self, text: str):
        self.ln(4)
        self.set_font("Helvetica", "B", 12)
        self.set_text_color(*BRAND)
        self.cell(0, 8, text, ln=True)
        self._divider()
        self.set_text_color(*DARK)

    def _label(self, text: str):
        self.set_font("Helvetica", "B", 9)
        self.set_text_color(*MUTED)
        self.cell(0, 5, text.upper(), ln=True)
        self.set_text_color(*DARK)

    def _body(self, text: str):
        self.set_font("Helvetica", "", 9)
        self.set_text_color(*DARK)
        self.multi_cell(0, 5, _safe(text))
        self.ln(1)

    def _bullet(self, items: list, indent: int = 4):
        self.set_font("Helvetica", "", 9)
        self.set_text_color(*DARK)
        for item in items:
            self.set_x(10 + indent)
            self.multi_cell(0, 5, f"*  {_safe(item)}")
        self.ln(1)

    def _badge(self, text: str, color: tuple):
        self.set_fill_color(*color)
        self.set_text_color(*WHITE)
        self.set_font("Helvetica", "B", 8)
        self.cell(len(text) * 2.5 + 4, 5, text.upper(), fill=True, ln=False)
        self.set_text_color(*DARK)
        self.ln(6)


def _safe(value, fallback: str = "") -> str:
    """Helvetica core fonts only support Latin-1; strip/replace anything else."""
    if value is None:
        return fallback
    s = str(value)
    return s.encode("iso-8859-1", "replace").decode("iso-8859-1")


def generate_pdf(kit_data: dict, kit_id: str) -> str:
    settings = get_settings()
    output_dir = Path(settings.pdf_storage_path) / "kits" / kit_id
    output_dir.mkdir(parents=True, exist_ok=True)
    pdf_path = output_dir / "interview-kit.pdf"

    role_title  = _safe(kit_data.get("roleTitle", "Role"))
    department  = _safe(kit_data.get("department", ""))
    exp_level   = _safe(kit_data.get("experienceLevel", ""))
    jd          = kit_data.get("jobDescription") or {}
    behavioral  = kit_data.get("behavioralQuestions") or []
    technical   = kit_data.get("technicalQuestions") or []
    scorecard   = kit_data.get("scorecard") or []
    rubric      = kit_data.get("rubric") or []

    pdf = KitPDF(role_title, department)
    pdf.set_margins(10, 10, 10)

    # ── Cover ────────────────────────────────────────────────────
    pdf.set_font("Helvetica", "B", 22)
    pdf.set_text_color(*DARK)
    pdf.multi_cell(0, 10, role_title, align="C")
    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(*MUTED)
    pdf.cell(0, 6, _safe(f"{department}  |  {exp_level}"), ln=True, align="C")
    pdf.ln(6)
    pdf._divider()

    # ── Job Description ──────────────────────────────────────────
    if jd:
        pdf._section_heading("Job Description")

        if jd.get("summary"):
            pdf._label("Summary")
            pdf._body(jd["summary"])

        if jd.get("aboutTheRole"):
            pdf._label("About the Role")
            pdf._body(jd["aboutTheRole"])

        if jd.get("whyJoinUs"):
            pdf._label("Why Join Us")
            pdf._body(jd["whyJoinUs"])

        if jd.get("responsibilities"):
            pdf._label("What You'll Do")
            pdf._bullet(jd["responsibilities"])

        if jd.get("requiredQualifications"):
            pdf._label("Required Qualifications")
            pdf._bullet(jd["requiredQualifications"])
        elif jd.get("requiredSkills"):
            pdf._label("Required Skills")
            pdf._bullet(jd["requiredSkills"])

        if jd.get("preferredQualifications"):
            pdf._label("Preferred Qualifications")
            pdf._bullet(jd["preferredQualifications"])
        elif jd.get("niceToHaveSkills"):
            pdf._label("Nice-to-Have Skills")
            pdf._bullet(jd["niceToHaveSkills"])

        if jd.get("whatYoullBring"):
            pdf._label("What You'll Bring")
            pdf._body(jd["whatYoullBring"])

        if jd.get("compensationAndBenefits"):
            pdf._label("Compensation & Benefits")
            pdf._body(jd["compensationAndBenefits"])
        elif jd.get("salaryRange"):
            pdf._label("Salary Range")
            pdf._body(jd["salaryRange"])

    # ── Behavioral Questions ─────────────────────────────────────
    if behavioral:
        pdf._section_heading(f"Behavioral Questions  ({len(behavioral)})")
        for i, q in enumerate(behavioral, 1):
            pdf.set_font("Helvetica", "B", 9)
            pdf.set_text_color(*DARK)
            pdf.multi_cell(0, 5, f"Q{i}.  {_safe(q.get('question'))}")
            pdf.ln(1)

            if q.get("competency"):
                pdf.set_font("Helvetica", "I", 8)
                pdf.set_text_color(*MUTED)
                pdf.cell(0, 4, _safe(f"Competency: {q['competency']}"), ln=True)

            if q.get("evalCriteria"):
                pdf._label("Evaluation Criteria")
                pdf._body(q["evalCriteria"])

            if q.get("followUps"):
                pdf._label("Follow-up Questions")
                pdf._bullet(q["followUps"])

            sg = q.get("scoringGuide") or {}
            if sg:
                pdf._label("Scoring Guide")
                for score, desc in sg.items():
                    pdf.set_font("Helvetica", "B", 8)
                    pdf.set_x(14)
                    pdf.cell(8, 4, f"{score}:", ln=False)
                    pdf.set_font("Helvetica", "", 8)
                    pdf.multi_cell(0, 4, _safe(desc))
            pdf.ln(3)

    # ── Technical Questions ──────────────────────────────────────
    if technical:
        pdf._section_heading(f"Technical Questions  ({len(technical)})")
        diff_colors = {"easy": (16, 185, 129), "medium": (245, 158, 11), "hard": (239, 68, 68)}
        for i, q in enumerate(technical, 1):
            pdf.set_font("Helvetica", "B", 9)
            pdf.set_text_color(*DARK)
            pdf.multi_cell(0, 5, f"Q{i}.  {_safe(q.get('question'))}")
            pdf.ln(1)

            diff = _safe(q.get("difficulty", "medium")).lower()
            color = diff_colors.get(diff, MUTED)
            pdf._badge(diff, color)

            if q.get("topic"):
                pdf.set_font("Helvetica", "I", 8)
                pdf.set_text_color(*MUTED)
                pdf.cell(0, 4, _safe(f"Topic: {q['topic']}"), ln=True)

            if q.get("evalCriteria"):
                pdf._label("Evaluation Criteria")
                pdf._body(q["evalCriteria"])

            if q.get("sampleAnswer"):
                pdf._label("Sample Answer")
                pdf._body(q["sampleAnswer"])

            if q.get("redFlags"):
                pdf._label("Red Flags")
                pdf._bullet(q["redFlags"])
            pdf.ln(3)

    # ── Scorecard ────────────────────────────────────────────────
    if scorecard:
        pdf._section_heading("Interview Scorecard")
        # Header row
        pdf.set_font("Helvetica", "B", 8)
        pdf.set_fill_color(*BRAND)
        pdf.set_text_color(*WHITE)
        pdf.cell(75, 6, "Competency", fill=True)
        pdf.cell(20, 6, "Weight", fill=True, align="C")
        pdf.cell(20, 6, "Score (1-5)", fill=True, align="C")
        pdf.ln()
        # Data rows — render notes below the row to handle long text
        pdf.set_font("Helvetica", "", 8)
        for idx, row in enumerate(scorecard):
            bg = (248, 250, 252) if idx % 2 == 0 else WHITE
            pdf.set_fill_color(*bg)
            pdf.set_text_color(*DARK)
            weight = row.get("weight", 0)
            score  = row.get("score")
            pdf.cell(75, 6, _safe(row.get("competency")), fill=True)
            pdf.cell(20, 6, f"{float(weight):.0%}", fill=True, align="C")
            pdf.cell(20, 6, _safe(score, "-"), fill=True, align="C")
            pdf.ln()
            notes = row.get("notes", "")
            if notes:
                pdf.set_fill_color(*bg)
                pdf.set_text_color(*MUTED)
                pdf.set_font("Helvetica", "I", 7)
                pdf.set_x(14)
                pdf.multi_cell(0, 4, _safe(notes), fill=True)
                pdf.set_font("Helvetica", "", 8)
        pdf.ln(3)

    # ── Skills Rubric ────────────────────────────────────────────
    if rubric:
        pdf._section_heading("Skills Rubric")
        for row in rubric:
            pdf.set_font("Helvetica", "B", 9)
            pdf.set_text_color(*DARK)
            pdf.cell(0, 5, _safe(row.get("skill")), ln=True)
            levels = row.get("proficiencyLevels") or {}
            pdf.set_font("Helvetica", "", 8)
            for level, desc in levels.items():
                pdf.set_x(14)
                pdf.set_font("Helvetica", "B", 8)
                pdf.set_text_color(*MUTED)
                pdf.cell(22, 4, level.capitalize() + ":", ln=False)
                pdf.set_font("Helvetica", "", 8)
                pdf.set_text_color(*DARK)
                pdf.multi_cell(0, 4, _safe(desc))
            pdf.ln(3)

    # ── Language & Inclusion Review ──────────────────────────────
    language_issues = kit_data.get("languageIssues") or []
    pdf._section_heading("Language & Inclusion Review")
    if language_issues:
        sev_colors = {"error": (239, 68, 68), "warning": (245, 158, 11)}
        source_labels = {
            "jobDescription":      "Job Description",
            "behavioralQuestions": "Behavioral Questions",
            "technicalQuestions":  "Technical Questions",
            "rubric":              "Skills Rubric",
        }
        sorted_issues = sorted(language_issues, key=lambda x: 0 if x.get("severity") == "error" else 1)
        for issue in sorted_issues:
            sev = _safe(issue.get("severity", "warning")).lower()
            color = sev_colors.get(sev, MUTED)
            source = source_labels.get(issue.get("source", ""), _safe(issue.get("source", "")))
            pdf._badge(sev, color)
            pdf.set_x(10)
            pdf.set_font("Helvetica", "B", 9)
            pdf.set_text_color(*DARK)
            pdf.cell(0, 5, _safe(f'"{issue.get("term")}"  ->  {issue.get("suggestion")}'), ln=True)
            pdf.set_font("Helvetica", "I", 8)
            pdf.set_text_color(*MUTED)
            pdf.cell(0, 4, f"Found in: {source}", ln=True)
            pdf.ln(2)
    else:
        pdf.set_font("Helvetica", "I", 9)
        pdf.set_text_color(*MUTED)
        pdf.cell(0, 6, "No inclusive language issues detected.", ln=True)

    pdf.output(str(pdf_path))
    logger.info("PDF saved to %s", pdf_path)

    base_url = settings.ai_service_base_url.rstrip("/")
    return f"{base_url}/static/pdfs/kits/{kit_id}/interview-kit.pdf"
