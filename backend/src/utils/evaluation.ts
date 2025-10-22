export const buildJudgePrompt = ({
  questionText,
  answer,
  judgePrompt
}: {
  questionText: string;
  answer: string;
  judgePrompt: string;
}) => {
  return `Question: ${questionText}\nAnswer: ${answer}\nRubric: ${judgePrompt}\n\nRespond with a JSON object matching the schema.`;
};

export const BASE_SYSTEM_PROMPT = `You are an AI judge helping evaluate human annotations.\nReturn a strict JSON object with the fields \\"verdict\\" and \\"reasoning\\".\nverdict must be one of \\"pass\\", \\"fail\\", or \\"inconclusive\\".`;
