'use client';
import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from '@/components/icons';
import { UI } from '@/components/shared-ui';

type IconComp = (props: { size?: number }) => React.ReactElement;

type SubTab = { key: string; label: string; icon: IconComp };
type Group  = { key: string; label: string; items: SubTab[] };

const GROUPS: Group[] = [
  {
    key: 'recruit',
    label: '지원',
    items: [
      { key: 'recruit',    label: '모집 설정', icon: Icons.megaphone },
      { key: 'interview',  label: '면접 일정', icon: Icons.calendar },
      { key: 'applicants', label: '지원자',    icon: Icons.person },
    ],
  },
  {
    key: 'teams',
    label: '팀',
    items: [
      { key: 'teams', label: '팀 활성화', icon: Icons.grid },
    ],
  },
  {
    key: 'timetable',
    label: '타임테이블',
    items: [
      { key: 'timetable', label: '타임테이블', icon: Icons.clock },
    ],
  },
  {
    key: 'members',
    label: '부원',
    items: [
      { key: 'members', label: '부원 관리', icon: Icons.shield },
      { key: 'migrate', label: '부원 이전', icon: Icons.upload },
    ],
  },
  {
    key: 'notices',
    label: '게시판',
    items: [
      { key: 'notices', label: '공지 관리', icon: Icons.pin },
    ],
  },
  {
    key: 'reports',
    label: '신고 제보',
    items: [
      { key: 'reports', label: '신고 관리', icon: Icons.flag },
    ],
  },
];

const SECTION_GROUP: Record<string, Group> = {};
for (const g of GROUPS) for (const t of g.items) SECTION_GROUP[t.key] = g;

const KICK: Record<string, string> = {
  recruit:    '운영진 전용 · 랜딩 페이지',
  interview:  '운영진 전용 · 신입 면접',
  applicants: '운영진 전용 · 신입 선발',
  teams:      '운영진 전용 · 팀 활성화',
  timetable:  '운영진 전용 · 합주실 운영',
  members:    '운영진 전용 · 부원 일괄 관리',
  migrate:    '운영진 전용 · 데이터 이전',
  notices:    '운영진 전용 · 공식 공지',
  reports:    '운영진 전용 · 신고·제보 처리',
};

const TITLE: Record<string, string> = {
  recruit:    'RECRUIT',
  interview:  'RECRUIT',
  applicants: 'RECRUIT',
  teams:      'TEAMS',
  timetable:  'TIMETABLE',
  members:    'ROSTER',
  migrate:    'MIGRATE',
  notices:    'NOTICES',
  reports:    'REPORTS',
};

const INTRO: Record<string, string> = {
  recruit:    '랜딩 페이지의 신입 모집 노출 여부와 모집글을 관리합니다. 저장하면 방문자에게 보이는 화면에 즉시 반영돼요.',
  interview:  '지원자에게 안내할 면접 가능 시간대를 등록·삭제합니다. 등록한 시간대는 지원자의 면접 예약 화면에 노출돼요.',
  applicants: '신입 지원서와 지원자가 고른 희망 면접 시간대를 확인하고, 그중 하나로 면접을 확정해요. 합격·불합격을 결정해 결과를 통지합니다.',
  teams:      '팀장이 보낸 활성화 신청을 검토해 수락하면 해당 팀이 정식 활동 팀으로 공개됩니다. 전체 팀의 활성 상태도 한 곳에서 일괄로 켜고 끌 수 있어요.',
  timetable:  '합주실 타임테이블의 학기·방학 운영시간과 행사 기간을 설정합니다. 오늘 날짜에 맞는 운영 모드가 자동으로 적용되고, 변경 내용은 부원이 보는 타임테이블에 반영돼요.',
  members:    '부원 전체를 한 곳에서 관리합니다. 화이트리스트 지정, 운영진 위임, 경고 부여, 정지·제적을 개별 또는 일괄로 처리할 수 있어요.',
  migrate:    '기존 부원 명단을 CSV로 한 번에 옮겨옵니다. 양식을 내려받아 채운 뒤 업로드하면, 미리보기로 검증한 다음 명단에 일괄 등록돼요.',
  notices:    '운영진 공지를 작성·수정·삭제하고 상단 고정 여부를 관리합니다. 상시 안내 카드도 이 곳에서 등록·수정할 수 있어요.',
  reports:    '부원이 접수한 신고·제보를 확인하고 처리합니다. 상태를 변경하거나 답변을 남기면 접수자에게 알림이 전달돼요.',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const section = pathname.split('/')[2] ?? 'recruit';
  const activeGroup = SECTION_GROUP[section] ?? GROUPS[0];
  const showSubTabs = activeGroup.items.length > 1;

  const groupBarRef    = useRef<HTMLDivElement>(null);
  const activeGroupRef = useRef<HTMLAnchorElement>(null);
  const subBarRef      = useRef<HTMLDivElement>(null);
  const activeSubRef   = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    for (const [bar, tab] of [
      [groupBarRef.current, activeGroupRef.current],
      [subBarRef.current,   activeSubRef.current],
    ] as const) {
      if (!bar || !tab) continue;
      const tabLeft  = tab.offsetLeft;
      const tabRight = tabLeft + tab.offsetWidth;
      const { scrollLeft, clientWidth } = bar;
      if (tabLeft < scrollLeft || tabRight > scrollLeft + clientWidth) {
        bar.scrollTo({ left: tabLeft - 24, behavior: 'smooth' });
      }
    }
  }, [section]);

  return (
    <div className="screen-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
        <div>
          <UI.Kicker>{KICK[section] ?? KICK.recruit}</UI.Kicker>
          <h1 className="display" style={{ margin: '14px 0 0', fontSize: 60 }}>
            {TITLE[section] ?? TITLE.recruit}
          </h1>
          <p style={{ margin: '12px 0 0', fontSize: 14.5, color: 'var(--muted-foreground)', maxWidth: 480, lineHeight: 1.7, textWrap: 'pretty' }}>
            {INTRO[section] ?? INTRO.recruit}
          </p>
        </div>
        {section === 'recruit' && (
          <a
            className="btn btn-ghost mono"
            href="랜딩 페이지.html"
            target="_blank"
            rel="noopener"
            style={{ fontSize: 12, letterSpacing: '0.04em', color: 'var(--muted-foreground)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted-foreground)')}
          >
            랜딩 페이지 열기<Icons.arrow size={14} />
          </a>
        )}
      </div>

      {/* 내비게이션 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

        {/* 상위 그룹 필 */}
        <div ref={groupBarRef} className="admin-tabbar" style={{ display: 'flex', gap: 6, paddingBottom: 14, flexWrap: 'nowrap', overflowX: 'auto' }}>
          {GROUPS.map((g) => {
            const on  = activeGroup.key === g.key;
            const href = `/admin/${g.items[0].key}`;
            return (
              <Link
                key={g.key}
                href={href}
                ref={on ? activeGroupRef : undefined}
                className="badge"
                style={{
                  borderColor: on
                    ? 'color-mix(in oklab, var(--accent) 40%, transparent)'
                    : undefined,
                  background:  on ? 'var(--accent-muted)' : undefined,
                  color:       on ? 'var(--accent-hover)' : undefined,
                  fontSize: 10.5,
                  padding: '4px 10px',
                  transition: 'all .14s',
                  cursor: 'pointer',
                }}
              >
                {g.label}
              </Link>
            );
          })}
        </div>

        {/* 하위 서브 탭 — 아이템 2개 이상인 그룹만 */}
        {showSubTabs ? (
          <div
            ref={subBarRef}
            className="admin-tabbar"
            style={{ display: 'flex', gap: 24, boxShadow: 'inset 0 -1px 0 var(--border-subtle)', flexWrap: 'nowrap', overflowX: 'auto' }}
          >
            {activeGroup.items.map(({ key, label, icon: Ic }) => {
              const on = section === key;
              return (
                <Link
                  key={key}
                  href={`/admin/${key}`}
                  ref={on ? activeSubRef : undefined}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    padding: '11px 2px',
                    fontFamily: 'var(--font-sans)', fontSize: 14,
                    fontWeight: on ? 700 : 500,
                    color: on ? 'var(--foreground)' : 'var(--muted-foreground)',
                    boxShadow: on ? 'inset 0 -2px 0 var(--accent)' : 'none',
                    transition: 'color .14s', whiteSpace: 'nowrap', flex: '0 0 auto',
                    textDecoration: 'none',
                  }}
                >
                  <span className="ico">{React.createElement(Ic, { size: 15 })}</span>{label}
                </Link>
              );
            })}
          </div>
        ) : (
          <hr className="rule" />
        )}
      </div>

      {children}
    </div>
  );
}
