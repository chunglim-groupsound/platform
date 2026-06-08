import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: '인증 필요' }, { status: 401 }), supabase: null }

  const { data: caller } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!['ADMIN', 'SUPER_ADMIN'].includes(caller?.role ?? '')) {
    return { error: NextResponse.json({ error: '권한 없음' }, { status: 403 }), supabase: null }
  }

  return { error: null, supabase }
}

export async function GET() {
  const { error, supabase } = await requireAdmin()
  if (error) return error

  const { data, error: dbError } = await supabase!
    .from('recruitment_periods')
    .select('is_open, open_at, close_at')
    .maybeSingle()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data ?? { is_open: false, open_at: null, close_at: null })
}

export async function PATCH(request: Request) {
  const { error, supabase } = await requireAdmin()
  if (error) return error

  const { data: { user } } = await (await createClient()).auth.getUser()

  const body = await request.json()
  const { is_open, open_at, close_at } = body

  if (typeof is_open !== 'boolean' || !open_at || !close_at) {
    return NextResponse.json({ error: 'is_open, open_at, close_at 필드가 필요합니다' }, { status: 400 })
  }

  const { data: existing } = await supabase!
    .from('recruitment_periods')
    .select('id')
    .maybeSingle()

  const payload = { is_open, open_at, close_at, created_by: user!.id }

  const { error: dbError } = existing
    ? await supabase!.from('recruitment_periods').update(payload).eq('id', existing.id)
    : await supabase!.from('recruitment_periods').insert(payload)

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
