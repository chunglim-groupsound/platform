'use client'
// src/app/(platform)/admin/import/page.tsx
// 한글 인코딩 해결 버전
// - UTF-8 BOM 자동 제거
// - EUC-KR 파일 자동 감지 후 재인코딩
// 실행 전: pnpm add papaparse && pnpm add -D @types/papaparse

import { useState } from 'react'
import Papa from 'papaparse'

interface CsvRow {
  name:         string
  generation:   string
  session:      string
  department?:  string
  student_id?:  string
  school_year?: string
  phone?:       string
  is_whitelist?: string
  status?:      string
}

// ─────────────────────────────────────────────
// 인코딩 감지 및 변환 유틸
// ─────────────────────────────────────────────

// EUC-KR 여부 간단 감지
// UTF-8은 멀티바이트 시퀀스가 0xC0~0xFD로 시작하지만
// EUC-KR은 0xA1~0xFE 범위의 2바이트 조합을 사용
function detectEncoding(buffer: ArrayBuffer): 'utf-8' | 'euc-kr' {
  const bytes = new Uint8Array(buffer)

  // UTF-8 BOM 확인 (EF BB BF)
  if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
    return 'utf-8'
  }

  // EUC-KR 패턴 탐지: 0xA1~0xFE 범위 연속 2바이트
  let eucKrCount = 0
  for (let i = 0; i < Math.min(bytes.length - 1, 2000); i++) {
    if (bytes[i] >= 0xA1 && bytes[i] <= 0xFE &&
        bytes[i + 1] >= 0xA1 && bytes[i + 1] <= 0xFE) {
      eucKrCount++
      i++ // 2바이트 건너뜀
    }
  }

  return eucKrCount > 3 ? 'euc-kr' : 'utf-8'
}

// ArrayBuffer → 문자열 (인코딩 지정)
function decodeBuffer(buffer: ArrayBuffer, encoding: string): string {
  const decoder = new TextDecoder(encoding)
  let text = decoder.decode(buffer)

  // UTF-8 BOM 제거 (있는 경우)
  if (text.charCodeAt(0) === 0xFEFF) {
    text = text.slice(1)
  }

  return text
}

// ─────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────
export default function ImportPage() {
  const [preview,  setPreview]  = useState<CsvRow[]>([])
  const [loading,  setLoading]  = useState(false)
  const [result,   setResult]   = useState<string | null>(null)
  const [encoding, setEncoding] = useState<string>('')

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()

    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer
      if (!buffer) return

      // 1. 인코딩 감지
      const detectedEncoding = detectEncoding(buffer)
      setEncoding(detectedEncoding)

      // 2. 감지된 인코딩으로 디코딩
      const text = decodeBuffer(buffer, detectedEncoding)

      // 3. papaparse로 파싱 (문자열 직접 전달)
      Papa.parse<CsvRow>(text, {
        header:         true,
        skipEmptyLines: true,
        complete: (parsed) => {
          setPreview(parsed.data)
          setResult(null)
        },
        error: (err: Error) => {
          setResult(`❌ 파싱 오류: ${err.message}`)
        },
      })
    }

    // ArrayBuffer로 읽기 (인코딩 처리를 직접 하기 위해)
    reader.readAsArrayBuffer(file)
  }

  const handleUpload = async () => {
    if (preview.length === 0) return
    setLoading(true)

    const res = await fetch('/api/admin/import', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ members: preview }),
    })

    setLoading(false)

    if (res.ok) {
      const { imported } = await res.json()
      setResult(`✅ ${imported}명 업로드 완료`)
      setPreview([])
      setEncoding('')
    } else {
      const { error } = await res.json()
      setResult(`❌ 오류: ${error}`)
    }
  }

  const PREVIEW_COLS: (keyof CsvRow)[] = [
    'name', 'generation', 'session',
    'department', 'student_id', 'school_year',
    'phone', 'is_whitelist', 'status',
  ]
  const COL_LABELS: Record<string, string> = {
    name:         '이름',
    generation:   '기수',
    session:      '세션',
    department:   '학과',
    student_id:   '학번',
    school_year:  '학년',
    phone:        '연락처',
    is_whitelist: '화이트리스트',
    status:       '상태',
  }

  return (
    <div style={{ padding: '32px', maxWidth: '900px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 500, marginBottom: '6px' }}>
        기존 회원 데이터 일괄 업로드
      </h2>

      {/* CSV 형식 안내 */}
      <div style={styles.formatBox}>
        <p style={{ fontWeight: 500, marginBottom: '8px', fontSize: '13px' }}>
          CSV 헤더 형식
        </p>
        <code style={styles.code}>
          name, generation, session, department, student_id, school_year, phone, is_whitelist, status
        </code>
        <ul style={styles.formatList}>
          <li><strong>필수:</strong> name, generation, session</li>
          <li><strong>선택:</strong> department, student_id, school_year, phone, is_whitelist, status</li>
          <li>session 복수: 쌍따옴표로 묶기 <code>"기타,보컬"</code></li>
        </ul>

        {/* 인코딩 안내 */}
        <div style={styles.encodingTip}>
          <strong>한글 파일 저장 방법</strong>
          <ul style={{ ...styles.formatList, marginTop: '6px' }}>
            <li>Excel: 다른 이름으로 저장 → <strong>CSV UTF-8 (쉼표로 분리)</strong> 선택</li>
            <li>메모장/VSCode: UTF-8 또는 UTF-8 BOM으로 저장</li>
            <li>EUC-KR 파일도 자동 감지하여 변환합니다.</li>
          </ul>
        </div>
      </div>

      <input
        type="file"
        accept=".csv"
        onChange={handleFile}
        style={{ marginBottom: '12px' }}
      />

      {/* 인코딩 감지 결과 표시 */}
      {encoding && (
        <p style={styles.encodingBadge}>
          감지된 인코딩: <strong>{encoding.toUpperCase()}</strong>
          {encoding === 'euc-kr' && ' — 자동으로 UTF-8로 변환됩니다.'}
        </p>
      )}

      {preview.length > 0 && (
        <div>
          <p style={{ marginBottom: '10px', fontSize: '14px' }}>
            미리보기: <strong>{preview.length}명</strong>
            {preview.length > 5 && ` (상위 5명만 표시)`}
          </p>

          <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {PREVIEW_COLS.map(col => (
                    <th key={col} style={styles.th}>
                      {COL_LABELS[col] ?? col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 5).map((row, i) => (
                  <tr key={i}>
                    {PREVIEW_COLS.map(col => (
                      <td key={col} style={styles.td}>
                        {row[col]
                          ? row[col]
                          : <span style={{ color: '#ccc' }}>-</span>
                        }
                      </td>
                    ))}
                  </tr>
                ))}
                {preview.length > 5 && (
                  <tr>
                    <td
                      colSpan={PREVIEW_COLS.length}
                      style={{ ...styles.td, textAlign: 'center', color: '#aaa' }}
                    >
                      ... 외 {preview.length - 5}명
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleUpload}
            disabled={loading}
            style={{
              padding: '10px 24px',
              background: loading ? '#aaa' : '#4A90E2',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            {loading ? '업로드 중...' : `${preview.length}명 업로드 실행`}
          </button>
        </div>
      )}

      {result && (
        <p style={{
          marginTop: '16px',
          fontWeight: 500,
          padding: '12px 16px',
          borderRadius: '6px',
          background: result.startsWith('✅') ? '#f0fff4' : '#fff5f5',
          color:      result.startsWith('✅') ? '#276749' : '#c53030',
          border:     `1px solid ${result.startsWith('✅') ? '#9ae6b4' : '#feb2b2'}`,
        }}>
          {result}
        </p>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  formatBox: {
    background: '#f8f9fa',
    border: '1px solid #e9ecef',
    borderRadius: '8px',
    padding: '16px 20px',
    marginBottom: '20px',
    fontSize: '13px',
  },
  code: {
    display: 'block',
    background: '#eee',
    padding: '8px 12px',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '12px',
    marginBottom: '10px',
    wordBreak: 'break-all' as const,
  },
  formatList: {
    paddingLeft: '18px',
    color: '#555',
    lineHeight: 1.8,
    margin: 0,
  },
  encodingTip: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #e0e0e0',
    fontSize: '13px',
    color: '#444',
  },
  encodingBadge: {
    display: 'inline-block',
    marginBottom: '12px',
    padding: '4px 12px',
    background: '#EFF6FF',
    border: '1px solid #BFDBFE',
    borderRadius: '20px',
    fontSize: '13px',
    color: '#1E40AF',
  },
  table: {
    borderCollapse: 'collapse' as const,
    width: '100%',
    fontSize: '13px',
  },
  th: {
    border: '1px solid #e0e0e0',
    padding: '8px 12px',
    background: '#f5f5f5',
    fontWeight: 500,
    textAlign: 'left' as const,
    whiteSpace: 'nowrap' as const,
  },
  td: {
    border: '1px solid #e0e0e0',
    padding: '8px 12px',
    whiteSpace: 'nowrap' as const,
  },
}