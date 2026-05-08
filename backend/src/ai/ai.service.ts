import { Injectable } from '@nestjs/common';
import Groq from 'groq-sdk';

interface EvaluationInput {
  title: string;
  instructions: string;
  subject: string;
  wordLimit: number;
  markingMode: string;
  totalMarks: number;
  passingMarks: number;
  studentText: string;
  wordCount: number;
}

interface EvaluationResult {
  score: number;
  remarks: string;
}

// ─── Subject category helpers ────────────────────────────────────────────────

type SubjectCategory = 'coding' | 'math' | 'urdu' | 'written';

function getSubjectCategory(subject: string): SubjectCategory {
  if (subject === 'coding') return 'coding';
  if (subject === 'math') return 'math';
  if (subject === 'urdu') return 'urdu';
  return 'written'; // english, science, other
}

// Detect code even when subject is not explicitly "coding"
function isCodeSubmission(text: string): boolean {
  const codeIndicators = [
    /def\s+\w+\s*\(/,
    /class\s+\w+/,
    /import\s+\w+/,
    /from\s+\w+\s+import/,
    /^\s*(public|private|protected)\s+/m,
    /^\s*#include\s*</m,
    /^\s*function\s+\w+\s*\(/m,
    /^\s*const\s+\w+\s*=/m,
    /^\s*int\s+main\s*\(/m,
    /print\s*\(/,
    /console\.log\s*\(/,
    /if\s+__name__\s*==\s*['"]__main__['"]/,
  ];
  return codeIndicators.filter((r) => r.test(text)).length >= 2;
}

@Injectable()
export class AiService {
  private client: Groq;

  constructor() {
    this.client = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  async evaluateSubmission(input: EvaluationInput): Promise<EvaluationResult> {
    const {
      title,
      instructions,
      subject,
      totalMarks,
      passingMarks,
      studentText,
      wordCount,
      wordLimit,
      markingMode,
    } = input;

    const isStrict = markingMode === 'strict';
    const category = getSubjectCategory(subject);

    // Auto-upgrade to coding category if text looks like code
    const effectiveCategory =
      category !== 'coding' && isCodeSubmission(studentText)
        ? 'coding'
        : category;

    const prompt = this.buildPrompt({
      category: effectiveCategory,
      title,
      instructions,
      subject,
      totalMarks,
      passingMarks,
      studentText,
      wordCount,
      wordLimit,
      isStrict,
    });

    try {
      const completion = await this.client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 500,
        temperature: 0.1,
        messages: [{ role: 'user', content: prompt }],
      });

      const responseText = completion.choices[0]?.message?.content ?? '';
      const cleanedText = responseText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      const parsed = JSON.parse(cleanedText);

      // Sum all numeric fields except "remarks"
      const rawScore = Object.entries(parsed)
        .filter(([k]) => k !== 'remarks')
        .reduce((sum, [, v]) => sum + (Number(v) || 0), 0);

      const score = Math.min(Math.max(Math.round(rawScore), 0), totalMarks);

      return {
        score,
        remarks: parsed.remarks || 'Evaluation complete.',
      };
    } catch (err) {
      console.error('AI evaluation error:', err.message);
      return {
        score: 0,
        remarks: 'Evaluation failed. Please re-evaluate manually.',
      };
    }
  }

  // ─── Prompt builder ──────────────────────────────────────────────────────

  private buildPrompt(p: {
    category: SubjectCategory;
    title: string;
    instructions: string;
    subject: string;
    totalMarks: number;
    passingMarks: number;
    studentText: string;
    wordCount: number;
    wordLimit: number;
    isStrict: boolean;
  }): string {
    switch (p.category) {
      case 'coding':
        return this.codingPrompt(p);
      case 'math':
        return this.mathPrompt(p);
      case 'urdu':
        return this.urduPrompt(p);
      default:
        return this.writtenPrompt(p);
    }
  }

  // ─── Coding prompt ───────────────────────────────────────────────────────

  private codingPrompt(p: {
    title: string;
    instructions: string;
    totalMarks: number;
    passingMarks: number;
    studentText: string;
    isStrict: boolean;
  }): string {
    const { title, instructions, totalMarks, passingMarks, studentText, isStrict } = p;
    const c = Math.round(totalMarks * 0.40); // correctness
    const comp = Math.round(totalMarks * 0.30); // completeness
    const q = Math.round(totalMarks * 0.20); // quality
    const r = Math.round(totalMarks * 0.10); // robustness

    const modeRules = isStrict
      ? `STRICT MODE PENALTIES:
- Any syntax error or code that does not run: correctness_score = 0
- Missing a required feature entirely: deduct full weight from completeness_score
- No comments or completely unreadable code: quality_score ≤ ${Math.round(q * 0.3)}
- No error handling at all: robustness_score = 0`
      : `LENIENT MODE BONUSES:
- Code that shows the right idea but has minor bugs: correctness_score ≥ ${Math.round(c * 0.6)}
- Partially implemented features still earn partial completeness_score
- Any attempt at comments earns at least ${Math.round(q * 0.4)} quality_score
- Any try/except or input check earns at least ${Math.round(r * 0.5)} robustness_score`;

    return `You are a programming instructor grading a student's code submission.

ASSIGNMENT: "${title}"
INSTRUCTIONS: ${instructions}
TOTAL MARKS: ${totalMarks}
GRADING MODE: ${isStrict ? 'STRICT' : 'LENIENT'}

STUDENT CODE:
\`\`\`
${studentText.substring(0, 3000)}
\`\`\`

RUBRIC:
- correctness_score (0–${c}): Does the code produce correct output? Are core operations right?
- completeness_score (0–${comp}): Are ALL required features implemented and working?
- quality_score (0–${q}): Readable code, good naming, comments, clean structure?
- robustness_score (0–${r}): Handles edge cases, invalid input, errors gracefully?

${modeRules}

UNRELATED SUBMISSION: If the code has nothing to do with "${title}", set all scores to 0.

Respond ONLY with valid JSON, no markdown:
{
  "correctness_score": <0–${c}>,
  "completeness_score": <0–${comp}>,
  "quality_score": <0–${q}>,
  "robustness_score": <0–${r}>,
  "remarks": "<2-3 sentences: what works, what is wrong or missing, and whether the student passed or failed (passing = ${passingMarks}/${totalMarks})>"
}`;
  }

  // ─── Math prompt ─────────────────────────────────────────────────────────

  private mathPrompt(p: {
    title: string;
    instructions: string;
    totalMarks: number;
    passingMarks: number;
    studentText: string;
    isStrict: boolean;
  }): string {
    const { title, instructions, totalMarks, passingMarks, studentText, isStrict } = p;
    const acc = Math.round(totalMarks * 0.45); // accuracy
    const meth = Math.round(totalMarks * 0.30); // method / working
    const pres = Math.round(totalMarks * 0.15); // presentation
    const comp = Math.round(totalMarks * 0.10); // completeness

    const modeRules = isStrict
      ? `STRICT MODE PENALTIES:
- Wrong final answer with no working shown: accuracy_score = 0
- Correct answer but completely wrong method: method_score ≤ ${Math.round(meth * 0.2)}
- Missing units where required: deduct up to ${Math.round(pres * 0.5)} from presentation_score
- Skipped sub-parts: deduct proportionally from completeness_score`
      : `LENIENT MODE BONUSES:
- Correct method but arithmetic error: accuracy_score ≥ ${Math.round(acc * 0.5)}
- Partial working shown earns at least ${Math.round(meth * 0.4)} method_score
- Any attempt at neat layout earns at least ${Math.round(pres * 0.4)} presentation_score
- Reward effort and correct approach even if final answer is wrong`;

    return `You are a math teacher grading a student's math assignment.

ASSIGNMENT: "${title}"
INSTRUCTIONS: ${instructions}
TOTAL MARKS: ${totalMarks}
GRADING MODE: ${isStrict ? 'STRICT' : 'LENIENT'}

STUDENT WORK:
---
${studentText.substring(0, 3000)}
---

RUBRIC:
- accuracy_score (0–${acc}): Are the final answers correct?
- method_score (0–${meth}): Is the correct method/formula used? Is working shown step by step?
- presentation_score (0–${pres}): Is the work neat, clearly laid out, with units where needed?
- completeness_score (0–${comp}): Are all parts/questions attempted?

${modeRules}

UNRELATED SUBMISSION: If the content has nothing to do with "${title}", set all scores to 0.

Respond ONLY with valid JSON, no markdown:
{
  "accuracy_score": <0–${acc}>,
  "method_score": <0–${meth}>,
  "presentation_score": <0–${pres}>,
  "completeness_score": <0–${comp}>,
  "remarks": "<2-3 sentences: which answers are correct, where marks were lost, and whether the student passed or failed (passing = ${passingMarks}/${totalMarks})>"
}`;
  }

  // ─── Urdu prompt ─────────────────────────────────────────────────────────

  private urduPrompt(p: {
    title: string;
    instructions: string;
    totalMarks: number;
    passingMarks: number;
    studentText: string;
    wordCount: number;
    wordLimit: number;
    isStrict: boolean;
  }): string {
    const {
      title,
      instructions,
      totalMarks,
      passingMarks,
      studentText,
      wordCount,
      wordLimit,
      isStrict,
    } = p;
    const rel = Math.round(totalMarks * 0.35); // relevance / mauzu
    const lang = Math.round(totalMarks * 0.30); // language quality / zaban
    const struct = Math.round(totalMarks * 0.20); // structure / tarteeb
    const wc = Math.round(totalMarks * 0.15); // word count / alfaaz

    const wordNote =
      wordLimit > 0
        ? `REQUIRED WORD COUNT: ${wordLimit} words — student wrote ${wordCount} words`
        : `Word count: ${wordCount} words (no specific limit set)`;

    const modeRules = isStrict
      ? `STRICT MODE PENALTIES:
- Off-topic content: relevance_score ≤ ${Math.round(rel * 0.3)}
- Excessive grammatical errors or mixing of languages: language_score ≤ ${Math.round(lang * 0.4)}
- No clear structure (no intro/body/conclusion): structure_score ≤ ${Math.round(struct * 0.3)}
- Word count below 70% of required: wordcount_score = 0`
      : `LENIENT MODE BONUSES:
- Any genuine attempt at the topic earns at least ${Math.round(rel * 0.5)} relevance_score
- Minor grammar errors still earn at least ${Math.round(lang * 0.5)} language_score
- Any attempt at paragraphing earns at least ${Math.round(struct * 0.4)} structure_score
- Word count within 80% of required earns full wordcount_score`;

    return `You are an Urdu language teacher grading a student's Urdu written assignment.
The student may have written in Urdu script, Roman Urdu, or a mix — evaluate accordingly.

ASSIGNMENT: "${title}"
INSTRUCTIONS: ${instructions}
${wordNote}
TOTAL MARKS: ${totalMarks}
GRADING MODE: ${isStrict ? 'STRICT' : 'LENIENT'}

STUDENT SUBMISSION:
---
${studentText.substring(0, 3000)}
---

RUBRIC:
- relevance_score (0–${rel}): Does the content address the topic "${title}" (mauzu se mutabiqat)?
- language_score (0–${lang}): Quality of Urdu language — grammar, vocabulary, idioms (zaban ki safai)?
- structure_score (0–${struct}): Clear organisation — introduction, body, conclusion (tarteeb)?
- wordcount_score (0–${wc}): Does it meet the length requirement?

${modeRules}

UNRELATED SUBMISSION: If the content has nothing to do with "${title}", set all scores to 0.

Respond ONLY with valid JSON, no markdown:
{
  "relevance_score": <0–${rel}>,
  "language_score": <0–${lang}>,
  "structure_score": <0–${struct}>,
  "wordcount_score": <0–${wc}>,
  "remarks": "<2-3 sentences in English: what is strong, what is weak, and whether the student passed or failed (passing = ${passingMarks}/${totalMarks})>"
}`;
  }

  // ─── Written / general text prompt (English, Science, Other) ─────────────

  private writtenPrompt(p: {
    title: string;
    instructions: string;
    subject: string;
    totalMarks: number;
    passingMarks: number;
    studentText: string;
    wordCount: number;
    wordLimit: number;
    isStrict: boolean;
  }): string {
    const {
      title,
      instructions,
      subject,
      totalMarks,
      passingMarks,
      studentText,
      wordCount,
      wordLimit,
      isStrict,
    } = p;

    const subjectLabel =
      subject.charAt(0).toUpperCase() + subject.slice(1);

    const c = Math.round(totalMarks * 0.40); // relevance
    const cont = Math.round(totalMarks * 0.30); // content depth
    const q = Math.round(totalMarks * 0.20); // structure / quality
    const r = Math.round(totalMarks * 0.10); // word count

    const wordNote =
      wordLimit > 0
        ? `REQUIRED WORD COUNT: ${wordLimit} words — student wrote ${wordCount} words`
        : `Word count: ${wordCount} words (no specific limit set)`;

    const modeRules = isStrict
      ? `STRICT MODE PENALTIES:
- Off-topic or only loosely related content: relevance_score ≤ ${Math.round(c * 0.3)}
- Word count below 70% of required (${Math.round(wordLimit * 0.7)} words): wordcount_score = 0
- Vague or unsupported claims: content_score ≤ ${Math.round(cont * 0.4)}
- No clear structure or paragraphing: structure_score ≤ ${Math.round(q * 0.3)}`
      : `LENIENT MODE BONUSES:
- Any genuine attempt at the topic earns at least ${Math.round(c * 0.5)} relevance_score
- Word count within 80% of required is acceptable — full wordcount_score
- Partial or thin content still earns at least ${Math.round(cont * 0.4)} content_score
- Any attempt at paragraphing earns at least ${Math.round(q * 0.4)} structure_score`;

    return `You are a ${subjectLabel} teacher grading a student's written assignment.

ASSIGNMENT: "${title}"
SUBJECT: ${subjectLabel}
INSTRUCTIONS: ${instructions}
${wordNote}
TOTAL MARKS: ${totalMarks}
GRADING MODE: ${isStrict ? 'STRICT' : 'LENIENT'}

STUDENT SUBMISSION:
---
${studentText.substring(0, 3000)}
---

RUBRIC:
- relevance_score (0–${c}): Does the content directly address "${title}"?
- content_score (0–${cont}): Is the information accurate, detailed, and well-explained?
- structure_score (0–${q}): Is it well-organised with clear paragraphs and flow?
- wordcount_score (0–${r}): Does it meet the word count requirement?

${modeRules}

UNRELATED SUBMISSION: If the content has nothing to do with "${title}", set all scores to 0.

Respond ONLY with valid JSON, no markdown:
{
  "relevance_score": <0–${c}>,
  "content_score": <0–${cont}>,
  "structure_score": <0–${q}>,
  "wordcount_score": <0–${r}>,
  "remarks": "<2-3 sentences: what is strong, what is weak or missing, and whether the student passed or failed (passing = ${passingMarks}/${totalMarks})>"
}`;
  }
}
