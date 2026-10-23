import { useState } from "react";
import { Badge } from "@workspace/mind-matters-ds/components/ui/badge";
import { Button } from "@workspace/mind-matters-ds/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@workspace/mind-matters-ds/components/ui/card";
import { plantCareQuestions } from "./gardeningActivityData";

export function PlantCareQuiz() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);
  const question = plantCareQuestions[questionIndex];
  const answered = answers[questionIndex] !== undefined;
  const score = answers.reduce(
    (total, answer, index) =>
      total + (answer === plantCareQuestions[index].answer ? 1 : 0),
    0,
  );

  function chooseAnswer(choiceIndex: number) {
    if (answered) return;
    setAnswers((current) => [...current, choiceIndex]);
  }

  function goNext() {
    if (questionIndex === plantCareQuestions.length - 1) {
      setFinished(true);
    } else {
      setQuestionIndex((current) => current + 1);
    }
  }

  function replay() {
    setQuestionIndex(0);
    setAnswers([]);
    setFinished(false);
  }

  return (
    <Card className="border-primary/20 bg-card/90">
      <CardHeader className="gap-3 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-serif text-2xl font-semibold italic">Plant-care quiz</h2>
          <Badge variant="accent">{finished ? "Round complete" : `${questionIndex + 1} of ${plantCareQuestions.length}`}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Think like a plant scientist. Learn a little with every answer.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {finished ? (
          <div className="space-y-4" aria-live="polite">
            <div className="rounded-xl border border-secondary/30 bg-secondary/10 p-4">
              <p className="font-semibold">You scored {score} out of {plantCareQuestions.length}.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Every garden grows with observation. Replay to try the questions again.
              </p>
            </div>
            <Button type="button" variant="secondary" onClick={replay}>Play again</Button>
          </div>
        ) : (
          <>
            <p className="font-semibold leading-relaxed">{question.question}</p>
            <div className="grid gap-2" role="group" aria-label="Answer choices">
              {question.choices.map((choice, choiceIndex) => {
                const isPicked = answers[questionIndex] === choiceIndex;
                const isCorrect = question.answer === choiceIndex;
                const resultClass = answered && isCorrect
                  ? "border-secondary bg-secondary/15"
                  : answered && isPicked
                    ? "border-destructive bg-destructive/10"
                    : "";
                return (
                  <Button
                    key={choice}
                    type="button"
                    variant="outline"
                    className={`h-auto w-full justify-start whitespace-normal rounded-xl px-4 py-3 text-left ${resultClass}`}
                    onClick={() => chooseAnswer(choiceIndex)}
                    disabled={answered}
                    aria-pressed={isPicked}
                  >
                    {choice}
                  </Button>
                );
              })}
            </div>
            {answered && (
              <div className="space-y-3 rounded-xl border border-border/60 bg-background/70 p-4" aria-live="polite">
                <p className="font-semibold">
                  {answers[questionIndex] === question.answer ? "That’s right!" : "Good try!"}
                </p>
                <p className="text-sm text-muted-foreground">{question.explanation}</p>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold">Score so far: {score}</p>
                  <Button type="button" onClick={goNext}>
                    {questionIndex === plantCareQuestions.length - 1 ? "See my score" : "Next question"}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
