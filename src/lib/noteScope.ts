export const NULL_TOKEN = "__null__";

export function buildNoteScopeKey(projectName: string | null | undefined, noteDate: string | null | undefined) {
  const normalizedProject = projectName?.trim().toLowerCase() || NULL_TOKEN;
  const normalizedDate = noteDate || NULL_TOKEN;
  return `${normalizedProject}::${normalizedDate}`;
}
