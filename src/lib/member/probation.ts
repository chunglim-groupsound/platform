const PROBATION_DAYS = 30

export function calcProbationDday(startedAt: string): string {
  const end = new Date(new Date(startedAt).getTime() + PROBATION_DAYS * 24 * 60 * 60 * 1000)
  const diff = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  return diff > 0 ? `D-${diff}` : '만료'
}

export function calcProbationEndDate(startedAt: string): Date {
  return new Date(new Date(startedAt).getTime() + PROBATION_DAYS * 24 * 60 * 60 * 1000)
}
