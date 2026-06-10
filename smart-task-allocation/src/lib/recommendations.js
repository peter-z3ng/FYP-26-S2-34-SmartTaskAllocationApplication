export function confidenceFromEvaluation(evaluation) {
  const totalChecks = Math.max(1, evaluation?.reasons?.length ?? 3);
  return Math.round(((evaluation?.score ?? 0) / totalChecks) * 100);
}

export function buildRecommendation(task, entry, evaluated = []) {
  const confidence = confidenceFromEvaluation(entry?.evaluation);
  const employeeName = entry?.employee?.username ?? entry?.employee?.email ?? "the selected employee";
  const eligibleCount = evaluated.filter((candidate) => candidate.evaluation?.eligible).length;
  const totalCount = evaluated.length;

  return {
    title: "Best match recommendation",
    confidence,
    summary: `${employeeName} is recommended for ${task?.title ?? "this task"} with ${confidence}% confidence.`,
    rationale: entry?.evaluation?.reasons ?? [],
    coverage: `${eligibleCount} of ${totalCount} employees passed all checks.`,
  };
}

export function sortEvaluatedCandidates(evaluated) {
  return [...evaluated].sort((left, right) => {
    // Eligible employees always rank above partial matches, then by explainable check score.
    if (left.evaluation.eligible !== right.evaluation.eligible) {
      return left.evaluation.eligible ? -1 : 1;
    }

    if (right.evaluation.score !== left.evaluation.score) {
      return right.evaluation.score - left.evaluation.score;
    }

    return String(left.employee?.username ?? "").localeCompare(String(right.employee?.username ?? ""));
  });
}
