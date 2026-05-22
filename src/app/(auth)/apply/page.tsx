'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const SESSION_OPTIONS = ['보컬', '기타', '베이스', '드럼', '건반', '기타(악기)']

export default function ApplyPage() {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    name: '',
    generation: '',
    session: [] as string[],
    motivation: '',
    self_intro: '',
  })
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)

  const toggleSession = (s: string) => {
    setForm(prev => ({
      ...prev,
      session: prev.session.includes(s)
        ? prev.session.filter(x => x !== s)
        : [...prev.session, s],
    }))
  }

  const handleSubmit = async () => {
    if (!agreed || loading) return

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // users 테이블에 기수·세션 업데이트
    await supabase
      .from('users')
      .update({
        name: form.name,
        generation: Number(form.generation),
        session: form.session,
      })
      .eq('id', user.id)

    // 신청서 저장
    await supabase
      .from('join_applications')
      .insert({
        user_id: user.id,
        motivation: form.motivation,
        self_intro: form.self_intro,
      })

    router.push('/status')
    setLoading(false)
  }

  return (
    <main>
      <h2>가입 신청서</h2>

      <label>이름</label>
      <input
        value={form.name}
        onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
      />

      <label>기수</label>
      <input
        type="number"
        value={form.generation}
        onChange={e => setForm(p => ({ ...p, generation: e.target.value }))}
      />

      <label>세션 (복수 선택 가능)</label>
      {SESSION_OPTIONS.map(s => (
        <button
          key={s}
          type="button"
          onClick={() => toggleSession(s)}
          style={{ fontWeight: form.session.includes(s) ? 'bold' : 'normal' }}
        >
          {s}
        </button>
      ))}

      <label>지원 동기 (선택)</label>
      <textarea
        value={form.motivation}
        onChange={e => setForm(p => ({ ...p, motivation: e.target.value }))}
      />

      <label>자기소개 (선택)</label>
      <textarea
        value={form.self_intro}
        onChange={e => setForm(p => ({ ...p, self_intro: e.target.value }))}
      />

      <hr style={{ margin: '20px 0' }} />
      <div>
        <h3>개인정보 수집 및 이용 동의</h3>
        <ul>
          <li>수집 항목: 이름, 기수, 세션, 연락처 (선택)</li>
          <li>이용 목적: 동아리 운영 관리 및 연락</li>
          <li>보관 기간: 탈퇴 후 30일 이내 삭제</li>
          <li>연락처는 기본적으로 운영진에게만 공개됩니다.</li>
        </ul>
        <label>
          <input
            type="checkbox"
            checked={agreed}
            onChange={e => setAgreed(e.target.checked)}
          />
          위 내용에 동의합니다 (필수)
        </label>
      </div>
      <hr style={{ margin: '20px 0' }} />

      <button onClick={handleSubmit} disabled={!agreed || loading}>
        {loading ? '제출 중...' : '신청서 제출'}
      </button>
    </main>
  )
}