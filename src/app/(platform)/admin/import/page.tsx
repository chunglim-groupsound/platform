'use client'

import { useState } from 'react'
import Papa from 'papaparse'   // pnpm add papaparse @types/papaparse

export default function ImportPage() {
  const [preview, setPreview] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      complete: (result) => setPreview(result.data as any[]),
    })
  }

  const handleUpload = async () => {
    setLoading(true)
    await fetch('/api/admin/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ members: preview }),
    })
    setLoading(false)
    alert(`${preview.length}명 업로드 완료`)
  }

  return (
    <div>
      <h2>기존 회원 데이터 일괄 업로드</h2>
      <input type="file" accept=".csv" onChange={handleFile} />
      {preview.length > 0 && (
        <>
          <p>미리보기: {preview.length}명</p>
          <button onClick={handleUpload} disabled={loading}>
            {loading ? '업로드 중...' : '업로드 실행'}
          </button>
        </>
      )}
    </div>
  )
}