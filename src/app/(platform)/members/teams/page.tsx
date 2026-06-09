import { redirect } from 'next/navigation'

export default function MembersTeamsRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  void searchParams
  redirect('/teams')
}
