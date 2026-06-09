export function extractJsonObject(text: string): Record<string, unknown> | null {
  const fenceMatch = text.match(/```json\s*([\s\S]*?)```/i);
  const rawCandidate = fenceMatch?.[1] ?? text.match(/\{[\s\S]*\}/)?.[0];

  if (!rawCandidate) {
    return null;
  }

  try {
    return JSON.parse(rawCandidate) as Record<string, unknown>;
  } catch {
    return null;
  }
}

