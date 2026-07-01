export interface IntentEntity {
  id: string;
  contextId: string;
  name: string;
  targetAmount: number;
  spentAmount: number;
  deadline?: Date | null;
}

export function intentProgress(intent: IntentEntity): number {
  if (intent.targetAmount <= 0) return 0;
  return Math.min(intent.spentAmount / intent.targetAmount, 1);
}
