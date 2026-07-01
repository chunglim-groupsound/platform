'use client';
import React from 'react';
import * as ReactDOM from 'react-dom';
import { Icons } from '@/components/icons';
import { UI } from '@/components/shared-ui';
import { DATA, HistoryStore, type OfficerHistoryEntry } from '@/lib/mock-data';

// ═══════════════════════════════════════════════════════════════════════════
// 역대 회장·부회장·총무 + 기수별 기장 — 조회 · 지정 (기록용, 열람 권한은 일반 부원과 동일)
// 운영 탭의 "연혁" 그룹 아래 회장 · 부회장 · 총무 · 기장 4개 서브 탭으로 나뉜다.
// ═══════════════════════════════════════════════════════════════════════════
const { useState, useEffect, useMemo } = React;
const HS = HistoryStore;
const MEMBERS = DATA.MEMBERS;
const ROLE_OPTS: OfficerHistoryEntry['role'][] = ['회장', '부회장', '총무'];

function useHistory() {
  const [tick, setTick] = useState(0);
  useEffect(() => HS.subscribe(() => setTick(x => x + 1)), []);
  return tick;
}

// ───────── 회장 · 부회장 · 총무 (직책별 서브 탭) ─────────
function OfficerRoleScreen({ role }: { role: OfficerHistoryEntry['role'] }) {
  const tick = useHistory();
  const [form, setForm] = useState<OfficerHistoryEntry | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const entries = useMemo(() => HS.officerHistory().filter(e => e.role === role), [tick, role]);

  return (
    <div className="screen-in" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: 11, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr 60px 76px', gap: 10, padding: '11px 14px', borderBottom: '1px solid var(--border)', background: 'var(--background)', alignItems: 'center' }}>
          <span className="mono" style={{ fontSize: 10, color: 'var(--subtle-foreground)' }}>연도</span>
          <span className="mono" style={{ fontSize: 10, color: 'var(--subtle-foreground)' }}>이름</span>
          <span className="mono" style={{ fontSize: 10, color: 'var(--subtle-foreground)' }}>기수</span>
          <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="ma-iconbtn" aria-label="추가" title="추가" onClick={() => setForm({ id: '', role, year: '', memberId: null, name: '', gen: null })}>
              <Icons.plus size={14} />
            </button>
          </span>
        </div>
        {entries.length === 0 ? (
          <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--subtle-foreground)', fontSize: 13 }}>등록된 {role} 이력이 없습니다.</div>
        ) : entries.map(e => (
          <div key={e.id} style={{ display: 'grid', gridTemplateColumns: '72px 1fr 60px 76px', gap: 10, alignItems: 'center', padding: '11px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
            <span className="mono" style={{ fontSize: 12.5, color: 'var(--muted-foreground)' }}>{e.year}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <UI.Avatar name={e.name} size={26} />
              <span style={{ fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.name}</span>
            </span>
            <span className="mono" style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{e.gen ? `${e.gen}기` : '—'}</span>
            <span style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
              <button className="ma-iconbtn" aria-label="수정" onClick={() => setForm(e)}><Icons.edit size={14} /></button>
              <button className="ma-iconbtn" aria-label="삭제" onClick={() => setConfirmDel(e.id)}><Icons.trash size={14} /></button>
            </span>
          </div>
        ))}
      </div>

      {form && <OfficerForm entry={form} onClose={() => setForm(null)} />}
      {confirmDel && <DeleteConfirm id={confirmDel} onClose={() => setConfirmDel(null)} />}
    </div>
  );
}

const PresidentScreen = () => <OfficerRoleScreen role="회장" />;
const ViceScreen = () => <OfficerRoleScreen role="부회장" />;
const TreasurerScreen = () => <OfficerRoleScreen role="총무" />;

// ───────── 기수별 기장 ─────────
function GenLeaderScreen() {
  const tick = useHistory();
  const genLeaders = useMemo(() => HS.genLeaders(), [tick]);

  return (
    <div className="screen-in" style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--border-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 11, overflow: 'hidden' }}>
      {genLeaders.map(g => <GenLeaderRow key={g.gen} gen={g.gen} memberId={g.memberId} />)}
    </div>
  );
}

function GenLeaderRow({ gen, memberId }: { gen: number; memberId: string | null }) {
  const inGen = useMemo(() => MEMBERS.filter(m => m.gen === gen), [gen]);
  const current = memberId ? MEMBERS.find(m => m.id === memberId) : undefined;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: '13px 16px', background: 'var(--surface)', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-hover)', flex: '0 0 auto' }}>{gen}기</span>
        {current ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <UI.Avatar name={current.name} size={28} />
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>{current.nick || current.name}</span>
          </span>
        ) : (
          <span className="mono" style={{ fontSize: 12, color: 'var(--subtle-foreground)' }}>지정된 기장 없음</span>
        )}
      </div>
      <select
        value={memberId || ''}
        onChange={e => HS.setGenLeader(gen, e.target.value || null)}
        style={{ fontSize: 12.5, padding: '7px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-elevated)', color: 'var(--foreground)' }}
      >
        <option value="">— 지정 안 함 —</option>
        {inGen.map(m => <option key={m.id} value={m.id}>{m.nick || m.name}</option>)}
      </select>
    </div>
  );
}

// ───────── 회장 · 부회장 · 총무 추가/수정 모달 ─────────
function OfficerForm({ entry, onClose }: { entry: OfficerHistoryEntry; onClose: () => void }) {
  const isNew = !entry.id;
  const [role, setRole] = useState<OfficerHistoryEntry['role']>(entry.role);
  const [year, setYear] = useState(entry.year);
  const [memberId, setMemberId] = useState(entry.memberId || '');
  const [name, setName] = useState(entry.name);
  const [gen, setGen] = useState(entry.gen != null ? String(entry.gen) : '');

  const pickMember = (id: string) => {
    setMemberId(id);
    const m = MEMBERS.find(x => x.id === id);
    if (m) { setName(m.nick || m.name); setGen(String(m.gen)); }
  };

  const canSave = year.trim() !== '' && name.trim() !== '';
  const save = () => {
    const payload = { role, year: year.trim(), memberId: memberId || null, name: name.trim(), gen: gen ? Number(gen) : null };
    if (isNew) HS.addOfficerEntry(payload);
    else HS.updateOfficerEntry(entry.id, payload);
    onClose();
  };

  return ReactDOM.createPortal((
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <button onClick={onClose} className="modal-close" aria-label="닫기"><Icons.x size={18} /></button>
        <UI.Kicker>{isNew ? '임원 이력 추가' : '임원 이력 수정'}</UI.Kicker>
        <h2 style={{ margin: '12px 0 18px', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 20 }}>회장 · 부회장 · 총무</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span className="mono" style={{ fontSize: 10.5, color: 'var(--subtle-foreground)' }}>직책</span>
            <select value={role} onChange={e => setRole(e.target.value as OfficerHistoryEntry['role'])} style={{ padding: '9px 11px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-elevated)', color: 'var(--foreground)', fontSize: 13.5 }}>
              {ROLE_OPTS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span className="mono" style={{ fontSize: 10.5, color: 'var(--subtle-foreground)' }}>연도</span>
            <input value={year} onChange={e => setYear(e.target.value)} placeholder="예: 2025" style={{ padding: '9px 11px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-elevated)', color: 'var(--foreground)', fontSize: 13.5, boxSizing: 'border-box' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span className="mono" style={{ fontSize: 10.5, color: 'var(--subtle-foreground)' }}>부원 연동 (선택 · 없으면 직접 입력)</span>
            <select value={memberId} onChange={e => pickMember(e.target.value)} style={{ padding: '9px 11px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-elevated)', color: 'var(--foreground)', fontSize: 13.5 }}>
              <option value="">— 부원 아님 (직접 입력) —</option>
              {MEMBERS.slice().sort((a, b) => b.gen - a.gen).map(m => <option key={m.id} value={m.id}>{m.gen}기 · {m.nick || m.name}</option>)}
            </select>
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 2 }}>
              <span className="mono" style={{ fontSize: 10.5, color: 'var(--subtle-foreground)' }}>이름</span>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="이름" style={{ padding: '9px 11px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-elevated)', color: 'var(--foreground)', fontSize: 13.5, boxSizing: 'border-box' }} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              <span className="mono" style={{ fontSize: 10.5, color: 'var(--subtle-foreground)' }}>기수</span>
              <input value={gen} onChange={e => setGen(e.target.value.replace(/[^0-9]/g, ''))} placeholder="18" style={{ padding: '9px 11px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-elevated)', color: 'var(--foreground)', fontSize: 13.5, boxSizing: 'border-box' }} />
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 9, marginTop: 20 }}>
          <button className="btn btn-primary" disabled={!canSave} onClick={save} style={{ flex: 1, justifyContent: 'center', opacity: canSave ? 1 : 0.5, cursor: canSave ? 'pointer' : 'not-allowed' }}>{isNew ? '추가' : '저장'}</button>
          <button className="btn" onClick={onClose} style={{ padding: '9px 20px' }}>취소</button>
        </div>
      </div>
    </div>
  ), document.body);
}

function DeleteConfirm({ id, onClose }: { id: string; onClose: () => void }) {
  const entry = HS.officerHistory().find(e => e.id === id);
  if (!entry) return null;
  return ReactDOM.createPortal((
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
        <button onClick={onClose} className="modal-close" aria-label="닫기"><Icons.x size={18} /></button>
        <UI.Kicker>이력 삭제</UI.Kicker>
        <p style={{ margin: '14px 0 0', fontSize: 13.5, color: 'var(--muted-foreground)', lineHeight: 1.7 }}>
          <b style={{ color: 'var(--foreground)' }}>{entry.year} {entry.role} {entry.name}</b> 이력을 삭제할까요?
        </p>
        <div style={{ display: 'flex', gap: 9, marginTop: 18 }}>
          <button className="btn" onClick={() => { HS.removeOfficerEntry(id); onClose(); }} style={{ flex: 1, justifyContent: 'center', borderColor: 'rgba(224,138,138,0.4)', color: '#E08A8A' }}>삭제</button>
          <button className="btn" onClick={onClose} style={{ padding: '9px 20px' }}>취소</button>
        </div>
      </div>
    </div>
  ), document.body);
}

export const OfficersModule = { PresidentScreen, ViceScreen, TreasurerScreen, GenLeaderScreen };
