import { NextRequest, NextResponse } from "next/server";
import { answerFormulaQuestion } from "@/lib/ai";
import { AssessmentAnswers, FormulaRecommendation } from "@/lib/types";

interface ChatRequestBody {
  question: string;
  answers: AssessmentAnswers;
  formula: FormulaRecommendation;
  locale: "en" | "es";
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ChatRequestBody;

  if (!body?.question || !body?.answers || !body?.formula) {
    return NextResponse.json({ error: "Missing question, answers, or formula" }, { status: 400 });
  }

  const answer = await answerFormulaQuestion(body.question, {
    answers: body.answers,
    formula: body.formula,
    locale: body.locale === "es" ? "es" : "en",
  });

  return NextResponse.json({ answer });
}
