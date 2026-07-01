// ═══════════════════════════════════════════════════════════════════════════
// 청림그룹사운드 리디자인
// 모듈: 목(mock) 데이터 · 공용 스토어 (DATA / TTShared / Role·Team·Term 스토어)
// 메인 파일에서 src="modules/01-mock-data.jsx" 로 로드됨.
// 로드 순서가 의존성 순서입니다 (이 파일은 01/12 번째).
// ═══════════════════════════════════════════════════════════════════════════

// ───────────── TYPE DEFINITIONS ─────────────
export interface Warning {
  reason: string;
  date: string;
  issuer: string;
}

export interface Member {
  id: string;
  name: string;
  nick: string | null;
  gen: number;
  session: string[];
  dept: string;
  role: 'ADMIN' | 'SUPER_ADMIN' | null;
  me: boolean;
  teamId?: string | null;
  teamRole?: 'leader' | 'vice' | 'member' | null;
  status?: string;
  phone?: string;
  joinedAt?: string;
  bio?: string;
  privatePhone?: boolean;
  warnings?: Warning[];
  whitelist?: boolean;
  adminRole?: string | null;
}

export interface Team {
  id: string;
  name: string;
  hue: string;
  leader: string;
  members: number;
  sessions: Record<string, number>;
  song: string | null;
  recruiting: boolean;
  active: boolean;
  desc: string;
}

export interface Booking {
  id: string;
  day: number;
  start: number;
  len: number;
  team: string;
  kind: 'regular' | 'oneoff';
}

export interface RoomEvent {
  day: number;
  start: number;
  len: number;
  label: string;
}

export interface NoticeImage {
  name: string;
  url: string;
}

export interface Notice {
  id: string;
  kind: 'admin' | 'user';
  tag: string;
  pinned: boolean;
  authorId: string;
  author: string;
  title: string;
  date: string;
  createdAt: string;
  updatedAt: string | null;
  views: number;
  body: string;
  images?: NoticeImage[];
}

export interface Reply {
  id: string;
  authorId: string;
  author: string;
  body: string;
  date: string;
  parentReplyId?: string | null;
}

export interface Comment {
  id: string;
  authorId: string;
  author: string;
  body: string;
  date: string;
  replies: Reply[];
}

export interface Reference {
  id: string;
  icon: string;
  label: string;
  value: string;
  secret?: boolean;
  note: string;
}

export interface OfficerHistoryEntry {
  id: string;
  role: '회장' | '부회장' | '총무';
  year: string;
  memberId: string | null;
  name: string;
  gen: number | null;
}

export interface GenLeader {
  gen: number;
  memberId: string | null;
  name: string;
}

export interface ActivationRequest {
  id: string;
  teamId: string;
  by: string;
  role: string;
  at: string;
  note: string;
  status: 'pending' | 'approved' | 'rejected';
  decidedAt?: string;
}

export interface Term {
  id: string;
  type: 'semester' | 'vacation';
  label: string;
  start: string;
  end: string;
  bookOpenDate?: string;
  bookOpenTime?: string;
}

export interface HourConfig {
  weekdayOpen: number;
  weekdayClose: number;
  weekendOpen: number;
  weekendClose: number;
}

export interface HoursConfig {
  semester: HourConfig;
  vacation: HourConfig;
  [key: string]: HourConfig;
}

export interface CalEvent {
  id: string;
  kind: 'closed' | 'event';
  label: string;
  start: string;
  end: string;
  allDay: boolean;
  startTime: number;
  endTime: number;
  note: string;
}

export interface WeekDay {
  mm: string;
  dd: string;
}

export interface BookingState {
  open: boolean;
  hasOpen: boolean;
  opensAt?: string;
  openDate?: string;
  openTime?: string;
  openWeekday?: string;
  dLeft?: number;
}


// ───────────── MOCK DATA: 청림그룹사운드 ─────────────
const SESSIONS = ['보컬', '기타', '베이스', '드럼', '건반'];

// team accent hues — desaturated so the eye doesn't tire
const TEAM_HUES = {
  obj: '#5B8EC7', // steel blue
  nav: '#C77F4A', // ember
  grn: '#6FAF8A', // moss
  rse: '#C77A86', // dusty rose
  vlt: '#8B7FC7', // muted violet
  tea: '#5FA9A6', // teal
};

const _BASE_MEMBERS: Member[] = [
  { id:'m1', name:'김도현', nick:'도형', gen:18, session:['기타'], dept:'실용음악과', role:'ADMIN', me:false },
  { id:'m2', name:'이서연', nick:'서니', gen:19, session:['보컬'], dept:'국어국문학과', role:null, me:true },
  { id:'m3', name:'박지훈', nick:null, gen:18, session:['드럼'], dept:'기계공학과', role:'SUPER_ADMIN', me:false },
  { id:'m4', name:'최유진', nick:'유즈', gen:20, session:['건반'], dept:'작곡과', role:null, me:false },
  { id:'m5', name:'정민재', nick:null, gen:19, session:['베이스'], dept:'경영학과', role:null, me:false },
  { id:'m6', name:'강하늘', nick:'하늘', gen:20, session:['기타','보컬'], dept:'시각디자인과', role:null, me:false },
  { id:'m7', name:'윤서아', nick:'아라', gen:21, session:['보컬'], dept:'심리학과', role:null, me:false },
  { id:'m8', name:'임준호', nick:'준', gen:18, session:['드럼'], dept:'전자공학과', role:'ADMIN', me:false },
  { id:'m9', name:'한지민', nick:null, gen:20, session:['건반','보컬'], dept:'성악과', role:null, me:false },
  { id:'m10', name:'오세훈', nick:'세훈', gen:19, session:['기타'], dept:'신문방송학과', role:null, me:false },
  { id:'m11', name:'신예은', nick:'예니', gen:21, session:['베이스'], dept:'화학과', role:null, me:false },
  { id:'m12', name:'배수빈', nick:null, gen:21, session:['보컬','건반'], dept:'사회학과', role:null, me:false },
  { id:'m13', name:'조현우', nick:'우디', gen:19, session:['기타'], dept:'건축학과', role:null, me:false },
  { id:'m14', name:'문가영', nick:'가비', gen:20, session:['드럼'], dept:'무용과', role:null, me:false },
];
// expand to a full roster (48 members, matching the club stat) for realistic pagination
const _FAM = ['김','이','박','최','정','강','조','윤','장','임','한','오','서','신','권','황','안','송','전','홍','문','양','배','백','허','남','심','노','하','구','구','류'];
const _GIV = ['민준','서윤','도윤','지우','하준','수아','지호','하은','지훈','수빈','준서','지유','예준','채원','시우','다은','건우','유나','우진','소율','현우','지아','선우','예린','연우','다인','민서','지원','정우','시은','윤서','승현','지환','하린'];
const _SESS = ['보컬','기타','베이스','드럼','건반'];
const _DEPTS = ['실용음악과','컴퓨터공학과','경영학과','시각디자인과','심리학과','전자공학과','신문방송학과','화학과','사회학과','건축학과','영어영문학과','법학과','체육교육과','회계학과','국어국문학과','기계공학과','산업디자인과','생명과학과'];
const _EXTRA: Member[] = Array.from({ length: 34 }, (_, k): Member => {
  const i = k + 14;
  const name = _FAM[k % _FAM.length] + _GIV[k % _GIV.length];
  const s = [_SESS[i % 5]];
  if (k % 6 === 2) s.push(_SESS[(i + 2) % 5]);
  return { id:'m'+(i+1), name, nick: k % 3 === 0 ? _GIV[k % _GIV.length] : null,
    gen: 18 + (i % 5), session: s, dept: _DEPTS[k % _DEPTS.length],
    role: k === 4 ? 'ADMIN' : null, me: false };
});
const MEMBERS: Member[] = _BASE_MEMBERS.concat(_EXTRA);

const TEAMS: Team[] = [
  { id:'t1', name:'야간비행', hue:TEAM_HUES.obj, leader:'도형', members:5, sessions:{보컬:1,기타:2,베이스:1,드럼:1}, song:'잔나비 — 주저하는 연인들을 위해', recruiting:false, active:true,
    desc:'잔잔한 인디 사운드를 지향하는 팀' },
  { id:'t2', name:'오버드라이브', hue:TEAM_HUES.nav, leader:'세훈', members:4, sessions:{보컬:1,기타:1,베이스:1,드럼:1}, song:'실리카겔 — NO PAIN', recruiting:true, active:true,
    desc:'드라이브 깊게 건 록 사운드' },
  { id:'t3', name:'청춘낙서', hue:TEAM_HUES.grn, leader:'아라', members:5, sessions:{보컬:2,기타:1,베이스:1,건반:1}, song:'데이식스 — 예뻤어', recruiting:false, active:true,
    desc:'밝고 청량한 밴드팝' },
  { id:'t4', name:'노이즈가든', hue:TEAM_HUES.rse, leader:'유즈', members:4, sessions:{보컬:1,기타:1,베이스:1,드럼:1}, song:'새소년 — 긴 꿈', recruiting:true, active:true,
    desc:'몽환적인 무드의 사운드' },
  { id:'t5', name:'리버브', hue:TEAM_HUES.vlt, leader:'가비', members:5, sessions:{보컬:1,기타:2,건반:1,드럼:1}, song:'혁오 — TOMBOY', recruiting:false, active:true,
    desc:'레트로 시티팝 감성' },
  { id:'t6', name:'스테레오타입', hue:TEAM_HUES.tea, leader:'준', members:3, sessions:{기타:1,베이스:1,드럼:1}, song:null, recruiting:true, active:false,
    desc:'세션 모집 중 — 보컬/건반 환영' },
  { id:'t7', name:'페이드아웃', hue:TEAM_HUES.obj, leader:'우진', members:4, sessions:{보컬:1,기타:1,베이스:1,드럼:1}, song:'터치드 — 그날의 우리', recruiting:false, active:true,
    desc:'서정적인 얼터너티브 록' },
  { id:'t8', name:'할로윈', hue:TEAM_HUES.rse, leader:'예린', members:5, sessions:{보컬:1,기타:2,건반:1,드럼:1}, song:'쏜애플 — 시퍼렇게', recruiting:true, active:true,
    desc:'어둡고 강렬한 무대 지향' },
  { id:'t9', name:'블랭크', hue:TEAM_HUES.grn, leader:'선우', members:3, sessions:{기타:1,베이스:1,드럼:1}, song:null, recruiting:true, active:false,
    desc:'세션 모집 중 — 보컬/건반 환영' },
];

// ───────────── TIMETABLE: weekly 합주실 schedule ─────────────
const DAYS = ['월','화','수','목','금','토','일'];
const HOURS = [8,9,10,11,12,13,14,15,16,17,18,19,20,21]; // 그리드 표시 시간대 (slot start) — 마지막 21 = 21:00–22:00
// 동아리방 운영시간: 학기중 평일 8–22 / 주말 8–19, 방학중 전일 8–19
const ROOM_OPEN = 8;
// bookings: id, day index (0=Mon), start hour, length (hrs), team id, kind('regular' 정기 | 'oneoff' 단발성)
const BOOKINGS: Booking[] = [
  { id:'bk1',  day:0, start:18, len:2, team:'t1', kind:'regular' },
  { id:'bk2',  day:0, start:20, len:2, team:'t3', kind:'regular' },
  { id:'bk3',  day:1, start:19, len:2, team:'t2', kind:'regular' },
  { id:'bk4',  day:2, start:16, len:2, team:'t5', kind:'oneoff' },
  { id:'bk5',  day:2, start:20, len:2, team:'t4', kind:'regular' },
  { id:'bk6',  day:3, start:18, len:3, team:'t1', kind:'regular' },
  { id:'bk7',  day:4, start:16, len:2, team:'t6', kind:'oneoff' },
  { id:'bk8',  day:4, start:19, len:2, team:'t3', kind:'regular' },
  { id:'bk9',  day:4, start:21, len:1, team:'t2', kind:'oneoff' },
  { id:'bk10', day:5, start:10, len:2, team:'t5', kind:'regular' },
  { id:'bk11', day:6, start:14, len:2, team:'t2', kind:'regular' },
  { id:'bk12', day:6, start:16, len:2, team:'t3', kind:'oneoff' },
];
// 행사 등으로 합주실 사용 불가 구간
const ROOM_EVENTS: RoomEvent[] = [
  { day:5, start:13, len:6, label:'정기공연 리허설' }, // 토 13–19
];

// "now" marker for the live indicator (Fri 19:40-ish for a lively view)
const NOW = { day:4, hour:19, minute:40 };

// kind: 'admin' = 운영진 공지 (운영진만 작성) · 'user' = 부원 공지 (모든 부원 작성)
// authorId 가 있으면 작성자 프로필로 연결, 'officer' 는 운영진 공식 계정
const NOTICES: Notice[] = [
  /* ───── 운영진 공지 ───── */
  { id:'n1', kind:'admin', tag:'공연', pinned:true, authorId:'officer', author:'운영진',
    title:'2026 정기공연 〈청림, 소리내다〉 라인업 확정', date:'06.08',
    createdAt:'2026.06.08 21:40', updatedAt:'2026.06.09 10:12', views:412,
    body:`9월 정기공연 〈청림, 소리내다〉 무대에 오를 6개 팀이 최종 확정되었습니다.\n\n■ 일시 — 2026.09.20(토) 18:00\n■ 장소 — 학생회관 대강당\n■ 출연 — 확정 6개 팀 (순서 추후 공지)\n\n각 팀 셋리스트는 이번 주 내로 합주실 게시판과 플랫폼에 함께 부착됩니다. 음향·조명 리허설 일정은 8월 말 별도 공지하며, 전 팀 필수 참석입니다.\n\n무대 관련 문의는 운영진(도형·준)에게 남겨주세요.` },

  { id:'n2', kind:'admin', tag:'합주실', pinned:true, authorId:'m1', author:'도형',
    title:'합주실 예약 규칙 변경 안내 (2시간 단위)', date:'06.05',
    createdAt:'2026.06.05 14:03', updatedAt:null, views:388,
    body:`합주실 예약 단위가 기존 1시간에서 2시간으로 변경됩니다. 짧은 예약이 반복되며 전환 시간 낭비가 커진다는 의견을 반영했습니다.\n\n■ 적용 — 2026.06.10(월) 예약분부터\n■ 단위 — 2시간 (평일 야간 한정 1시간 연장 가능)\n■ 노쇼 — 2회 누적 시 2주간 예약 제한\n\n예약 변경·취소는 사용 24시간 전까지 플랫폼에서 가능합니다. 규칙 관련 의견은 댓글이 아닌 운영진 채널로 부탁드립니다.` },

  { id:'n3', kind:'admin', tag:'공연', pinned:false, authorId:'officer', author:'운영진',
    title:'9월 정기공연 준비 일정 및 대관 계획', date:'06.02',
    createdAt:'2026.06.02 19:25', updatedAt:null, views:301,
    body:`정기공연까지의 전체 준비 일정을 공유합니다.\n\n• 6월 — 팀 편성·곡 선정 마감\n• 7월 — 합주 주 2회 의무화, 중간 점검\n• 8월 — 음향 대관 확정, 포스터·티켓 제작\n• 9월 — 리허설 2회, 본 공연\n\n대관은 대강당으로 가닥이 잡혔으며, 예산안은 회계 공지를 함께 참고해 주세요. 팀별 진행 상황은 매주 운영진이 점검합니다.` },

  { id:'n4', kind:'admin', tag:'회계', pinned:false, authorId:'m8', author:'준',
    title:'상반기 회비(3만원) 납부 안내', date:'05.28',
    createdAt:'2026.05.28 11:10', updatedAt:null, views:356,
    body:`상반기 회비 납부 안내드립니다.\n\n■ 금액 — 30,000원\n■ 기한 — 2026.06.15(일)까지\n■ 입금 — 청림그룹사운드 (국민 000-00-0000)\n\n회비는 합주실 비품 구입, 공연 대관·음향, MT 등 동아리 운영 전반에 사용됩니다. 입금 시 받는 분에 본인 이름을 꼭 기재해 주세요. 사정이 있는 경우 운영진에게 개별 문의 바랍니다.` },

  { id:'n5', kind:'admin', tag:'합주실', pinned:false, authorId:'m1', author:'도형',
    title:'합주실 장비 점검 — 6월 18일 오전 사용 불가', date:'05.18',
    createdAt:'2026.05.18 09:30', updatedAt:null, views:240,
    body:`앰프 및 드럼 정기 점검으로 아래 시간 합주실 사용이 제한됩니다.\n\n■ 일시 — 2026.06.18(목) 09:00 ~ 13:00\n■ 내용 — 앰프 점검, 드럼 헤드 교체, 케이블 정리\n\n오후 1시부터 정상 운영하며, 해당 시간대 예약은 자동 취소됩니다. 점검 후 장비 이상이 발견되면 운영진에게 알려주세요.` },

  { id:'n6', kind:'admin', tag:'회계', pinned:false, authorId:'m8', author:'준',
    title:'4월 회계 내역 공개', date:'05.02',
    createdAt:'2026.05.02 22:05', updatedAt:null, views:198,
    body:`4월 한 달간의 수입·지출 내역을 공개합니다.\n\n• 수입 — 회비 1,440,000원\n• 지출 — 합주실 소모품 86,000원, 버스킹 장비 대여 120,000원\n• 잔액 — 이월 포함 3,212,000원\n\n자세한 항목은 첨부 문서를 참고해 주시고, 문의는 회계(준)에게 부탁드립니다.` },

  /* ───── 부원 공지 (유저) ───── */
  { id:'u1', kind:'user', tag:'모집', pinned:true, authorId:'m6', author:'하늘',
    title:'록 밴드 같이 하실 분! 드럼 급구합니다 🥁', date:'06.07',
    createdAt:'2026.06.07 23:18', updatedAt:null, views:174,
    body:`9월 공연 목표로 록 밴드 팀 꾸리고 있어요. 현재 기타(저)·베이스·보컬 모였고 드럼만 구하면 바로 시작합니다!\n\n• 장르 — 모던록 / 펑크록 (위저, 그린데이 느낌)\n• 합주 — 주 2회, 평일 저녁 위주\n• 실력 — 기본 8비트 + 합주 경험 있으면 환영\n\n관심 있으면 댓글이나 DM 주세요. 같이 무대 서요!` },

  { id:'u2', kind:'user', tag:'모집', pinned:false, authorId:'m7', author:'아라',
    title:'보컬+기타 어쿠스틱 듀오 하실 분 찾아요', date:'06.04',
    createdAt:'2026.06.04 20:42', updatedAt:null, views:121,
    body:`잔잔한 어쿠스틱 듀오 같이 하실 기타 세션 구해요. 버스킹이나 소규모 무대 위주로 가볍게 시작해보고 싶어요.\n\n좋아하는 곡 위주로 편하게 맞춰가요. 커버곡 리스트는 따로 정리해뒀습니다. 부담 없이 연락 주세요 :)` },

  { id:'u3', kind:'user', tag:'자유', pinned:false, authorId:'m4', author:'유즈',
    title:'이펙터 공동구매 하실 분 (마감 임박)', date:'05.30',
    createdAt:'2026.05.30 13:55', updatedAt:null, views:96,
    body:`멀티 이펙터 공동구매 모집합니다. 5명 이상이면 배송비 무료에 추가 할인까지 가능해요.\n\n현재 3명 모였고, 2명만 더 모으면 됩니다. 모델·가격은 댓글에 정리해둘게요. 참여 원하시는 분 댓글 남겨주세요!` },

  { id:'u4', kind:'user', tag:'행사', pinned:false, authorId:'m5', author:'정민재',
    title:'여름 MT 〈리프〉 같이 가요 — 사전 수요 조사', date:'05.21',
    createdAt:'2026.05.21 18:30', updatedAt:null, views:143,
    body:`7월 셋째 주 1박 2일 MT 어떠세요? 펜션 잡아서 합주하고 바베큐하고 놀다 오는 컨셉이에요.\n\n인원 파악되면 장소·회비 정해서 다시 공지할게요. 갈 생각 있으신 분들 댓글로 인원 남겨주시면 감사하겠습니다!` },

  { id:'u5', kind:'user', tag:'자유', pinned:false, authorId:'m2', author:'서니',
    title:'오늘 합주 끝나고 뒷풀이 하실 분~', date:'05.16',
    createdAt:'2026.05.16 17:02', updatedAt:null, views:88,
    body:`오늘 저녁 합주 마치고 근처에서 가볍게 한잔 어떠세요? 합주실 앞에서 9시쯤 모일 생각이에요.\n\n오는 사람 봐서 자리 잡을게요. 편하게 와주세요!` },

  { id:'u6', kind:'user', tag:'후기', pinned:false, authorId:'m7', author:'아라',
    title:'버스킹 〈봄밤〉 후기 + 사진 공유합니다', date:'05.09',
    createdAt:'2026.05.09 23:50', updatedAt:null, views:207,
    images:[
      { name:'busking_01.jpg', url:"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='480' height='320'%3E%3Cdefs%3E%3ClinearGradient id='a' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%23C77F4A'/%3E%3Cstop offset='1' stop-color='%23151A26'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='480' height='320' fill='url(%23a)'/%3E%3Ctext x='30' y='292' fill='%23fff' font-family='sans-serif' font-size='21' opacity='0.9'%3E버스킹 〈봄밤〉 ①%3C/text%3E%3C/svg%3E" },
      { name:'busking_02.jpg', url:"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='480' height='320'%3E%3Cdefs%3E%3ClinearGradient id='b' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%235B8EC7'/%3E%3Cstop offset='1' stop-color='%23151A26'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='480' height='320' fill='url(%23b)'/%3E%3Ctext x='30' y='292' fill='%23fff' font-family='sans-serif' font-size='21' opacity='0.9'%3E버스킹 〈봄밤〉 ②%3C/text%3E%3C/svg%3E" },
    ],
    body:`지난 주말 교내 버스킹에 함께해 주신 모든 분들 너무 고생 많으셨어요!\n\n날씨도 좋고 사람도 많이 모여서 진짜 즐거웠습니다. 현장 사진은 단체 채널에 올려뒀으니 각자 마음에 드는 사진 가져가세요. 다음 버스킹도 기대해 주세요 🎸` },
];

// 운영진 상시 안내 (항상 상단 노출, 운영진 탭 전용 레퍼런스 카드)
const REFERENCE: Reference[] = [
  { id:'r1', icon:'lock', label:'동방 비밀번호', value:'1204', secret:true,
    note:'분실 우려가 있으니 외부 공유 금지. 변경 시 운영진이 재공지합니다.' },
  { id:'r2', icon:'book', label:'동아리방 운영 수칙', value:'08:00 – 24:00',
    note:'마지막 사용자가 소등·문단속. 음식물 반입 금지, 개인 짐은 사물함만 사용.' },
  { id:'r3', icon:'guitar', label:'장비 사용 수칙', value:'사용 후 원위치',
    note:'앰프 볼륨 6 이하, 드럼 스틱 개인 지참, 케이블은 8자 정리. 고장 시 즉시 운영진에 보고.' },
];

// 부원 공지 댓글 (소통)
const NOTICE_COMMENTS: Record<string, Comment[]> = {
  u1: [
    { id:'c1', authorId:'m12', author:'다른부원', body:'드럼 칩니다! 8비트는 자신 있어요. 합주 시간 맞으면 참여하고 싶어요 :)', date:'06.08 09:12', replies:[
      { id:'r1', authorId:'m6', author:'하늘', body:'오 반가워요! 평일 저녁 위주인데 가능하실까요?', date:'06.08 09:40', parentReplyId:null },
      { id:'r1a', authorId:'m12', author:'다른부원', body:'@하늘 네 평일 저녁 대부분 괜찮아요!', date:'06.08 09:55', parentReplyId:'r1' },
      { id:'r1b', authorId:'m6', author:'하늘', body:'@다른부원 그럼 수요일 7시로 잡을까요?', date:'06.08 10:03', parentReplyId:'r1a' },
      { id:'r1c', authorId:'m12', author:'다른부원', body:'@하늘 좋아요 확정이요!', date:'06.08 10:10', parentReplyId:'r1b' },
      { id:'r2', authorId:'m9', author:'부원', body:'저도 베이스로 낄 수 있을까요?', date:'06.08 10:30', parentReplyId:null },
      { id:'r2a', authorId:'m12', author:'다른부원', body:'@부원 당연하죠! 같이해요 ㅎㅎ', date:'06.08 10:45', parentReplyId:'r2' },
    ] },
    { id:'c2', authorId:'m6', author:'하늘', body:'오 좋아요! DM 드릴게요 🙌', date:'06.08 10:01', replies:[] },
  ],
  u3: [
    { id:'c3', authorId:'m9', author:'부원', body:'저요! 모델 뭐 생각하고 계세요?', date:'05.30 14:20', replies:[] },
  ],
  u4: [
    { id:'c4', authorId:'m11', author:'부원', body:'2명이요~ 친구도 데려갈게요', date:'05.21 19:05', replies:[] },
    { id:'c5', authorId:'m2', author:'서니', body:'저도 갈래요!! 펜션 추천 있으면 알려주세요', date:'05.21 21:30', replies:[
      { id:'r2', authorId:'m5', author:'정민재', body:'가평 쪽으로 알아보고 있어요. 정해지면 공지할게요!', date:'05.21 22:10' },
    ] },
  ],
};

const ME = MEMBERS.find(m => m.me);
const STATS = { members: 48, teams: TEAMS.filter(t=>t.active).length, gen: 21 };

/* ───────────── ENRICH: team membership, role, status, profile ───────────── */
// vice-leaders per team (by member id)
const VICE: Record<string, string> = { t1:'m6', t2:'m13', t3:'m11', t4:'m5', t5:'m9', t7:'m12' };
// leader nick → member, to stamp teamRole='leader'
const _leaderByTeam: Record<string, string> = { t1:'m1', t2:'m10', t3:'m7', t4:'m4', t5:'m14', t6:'m8' };
Object.entries(_leaderByTeam).forEach(([tid, mid]) => {
  const m = MEMBERS.find(x=>x.id===mid); if (m){ m.teamId=tid; m.teamRole='leader'; }
});
Object.entries(VICE).forEach(([tid, mid]) => {
  const m = MEMBERS.find(x=>x.id===mid); if (m && !m.teamRole){ m.teamId=tid; m.teamRole='vice'; }
});
// assign everyone else round-robin into active teams as ordinary members (some left unassigned)
const _activeTeams = TEAMS.filter(t=>t.active);
let _ri = 0;
MEMBERS.forEach((m, i) => {
  if (!m.teamRole) {
    if (i % 5 === 4) { m.teamId = null; m.teamRole = null; }   // ~1/5 have no team
    else { m.teamId = _activeTeams[_ri % _activeTeams.length].id; m.teamRole = 'member'; _ri++; }
  }
});
// status, contact, join date, bio, warnings
const _BIOS = [
  '타임이 생명인 멜디 라인을 좋아합니다.', '합주실에서 살다십피 살아요.', '무대 위에서 가장 행복한 사람.',
  '조용한 인디포크부터 거친 록까지 다 좋아해요.', '연습량이 실력을 만든다고 믿어요.', '새로운 곡 파보는 게 제일 재미있어요.',
  '멤버 모집 중! 함께 합주해요.', '언제든 세션 질문 환영입니다.',
];
const _STATUSES = ['ACTIVE','ACTIVE','ACTIVE','ACTIVE','PROBATION','ACTIVE','ACTIVE','INACTIVE','ACTIVE','ACTIVE'];
MEMBERS.forEach((m, i) => {
  m.status = m.role ? 'ACTIVE' : _STATUSES[i % _STATUSES.length];
  m.phone = '010-' + String(2000 + (i*37)%8000).padStart(4,'0') + '-' + String(1000 + (i*53)%9000).padStart(4,'0');
  m.joinedAt = `${2026 - (m.gen<=18?2 : m.gen===19?1 : 0)}.03`;
  m.bio = _BIOS[i % _BIOS.length];
  m.privatePhone = i % 3 === 0;   // some members keep phone private
  m.warnings = [];
  m.whitelist = (i % 4 === 1) || m.role === 'SUPER_ADMIN';   // skill-verified title (~25% + devs)
});
// a few demo warning histories
(function(){
  const add = (mid: string, items: Warning[]) => { const m = MEMBERS.find(x=>x.id===mid); if(m) m.warnings = items; };
  add('m12', [
    { reason:'공지 미확인으로 공연 리허설 불참', date:'2026.05.28', issuer:'운영진' },
    { reason:'합주실 예약 노쇼 1회', date:'2026.05.20', issuer:'도형' },
  ]);
  add('m5', [{ reason:'회비 납부 지연', date:'2026.04.30', issuer:'준' }]);
})();

// ───────────── 운영진 직책 (회장·부회장·총무) ─────────────
// 기존 운영진(ADMIN) 3인에게 세부 직책을 부여
(function(){
  const set = (id: string, t: string | null) => { const m = MEMBERS.find(x=>x.id===id); if(m) m.adminRole = t; };
  set('m1', '회장');     // 김도현 · 도형
  set('m19', '부회장');  // 정하준
  set('m8', '총무');     // 임준호 · 준
})();
const OFFICER_TITLES = ['회장','부회장','총무'];
const RoleStore = (function(){
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach(l => l());
  return {
    titles: OFFICER_TITLES,
    // 화면에 표시할 직책 라벨: 개발 / 회장·부회장·총무 / 운영진 / (없음)
    label(m: Member | null | undefined): string | null {
      if(!m) return null;
      if(m.role === 'SUPER_ADMIN') return '개발';
      if(m.adminRole) return m.adminRole;
      if(m.role === 'ADMIN') return '운영진';
      return null;
    },
    isOfficer(m: Member | null | undefined): boolean { return !!m && (m.role === 'ADMIN' || m.role === 'SUPER_ADMIN' || !!m.adminRole); },
    holder(title: string): Member | null { return MEMBERS.find(m => m.adminRole === title) || null; },
    // 직책 지정: 같은 직책은 1명만 — 기존 담당자는 일반 운영진으로 강등
    setRole(mid: string, title: string | null): void {
      const m = MEMBERS.find(x => x.id === mid); if(!m) return;
      if(title){
        MEMBERS.forEach(x => { if(x.adminRole === title && x.id !== mid) x.adminRole = null; });
        m.adminRole = title;
        if(m.role !== 'SUPER_ADMIN') m.role = 'ADMIN';
      } else {
        m.adminRole = null;
      }
      emit();
    },
    subscribe(l: () => void): () => void { listeners.add(l); return () => listeners.delete(l); },
  };
})();
export { RoleStore };

// ───────────── 역대 회장·부회장·총무 / 기수별 기장 ─────────────
// 부원 전체 테이블에 넣기엔 부적절한 소수(연혁) 데이터라 별도 테이블(스토어)로 관리.
// 역대 임원: 탈퇴한 졸업생 등 현재 MEMBERS에 없는 사람도 있을 수 있어 memberId는 선택값, name은 항상 보관.
let _ohSeq = 1;
const OFFICER_HISTORY: OfficerHistoryEntry[] = [
  { id:'oh'+(_ohSeq++), role:'회장',   year:'2026', memberId:'m1',  name:'김도현', gen:18 },
  { id:'oh'+(_ohSeq++), role:'부회장', year:'2026', memberId:'m19', name:'정하준', gen:21 },
  { id:'oh'+(_ohSeq++), role:'총무',   year:'2026', memberId:'m8',  name:'임준호', gen:18 },
  { id:'oh'+(_ohSeq++), role:'회장',   year:'2025', memberId:null,  name:'이규민', gen:17 },
  { id:'oh'+(_ohSeq++), role:'부회장', year:'2025', memberId:null,  name:'박서현', gen:18 },
  { id:'oh'+(_ohSeq++), role:'총무',   year:'2025', memberId:null,  name:'최다인', gen:17 },
  { id:'oh'+(_ohSeq++), role:'회장',   year:'2024', memberId:null,  name:'강태오', gen:16 },
  { id:'oh'+(_ohSeq++), role:'부회장', year:'2024', memberId:null,  name:'윤소민', gen:17 },
  { id:'oh'+(_ohSeq++), role:'총무',   year:'2024', memberId:null,  name:'한지원', gen:16 },
];

// 기수별 기장: 현재 활동 중인 기수만 지정 (졸업·비활동 기수는 관리하지 않음)
const _ACTIVE_GENS = Array.from(new Set(MEMBERS.map(m => m.gen))).sort((a, b) => a - b);
const _pickGenLeader = (g: number): Member | undefined => {
  const inGen = MEMBERS.filter(m => m.gen === g);
  return inGen.find(m => m.teamRole === 'leader') || inGen[0];
};
const GEN_LEADERS: GenLeader[] = _ACTIVE_GENS.map(g => {
  const m = _pickGenLeader(g);
  return { gen: g, memberId: m ? m.id : null, name: m ? (m.nick || m.name) : '' };
});

const HistoryStore = (function () {
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach(l => l());
  return {
    officerHistory(): OfficerHistoryEntry[] { return OFFICER_HISTORY.slice().sort((a, b) => b.year.localeCompare(a.year) || a.role.localeCompare(b.role, 'ko')); },
    addOfficerEntry(entry: Omit<OfficerHistoryEntry, 'id'>): void {
      OFFICER_HISTORY.push({ id: 'oh' + (_ohSeq++), ...entry });
      emit();
    },
    updateOfficerEntry(id: string, patch: Omit<OfficerHistoryEntry, 'id'>): void {
      const idx = OFFICER_HISTORY.findIndex(e => e.id === id);
      if (idx >= 0) { OFFICER_HISTORY[idx] = { id, ...patch }; emit(); }
    },
    removeOfficerEntry(id: string): void {
      const idx = OFFICER_HISTORY.findIndex(e => e.id === id);
      if (idx >= 0) { OFFICER_HISTORY.splice(idx, 1); emit(); }
    },
    activeGens(): number[] { return _ACTIVE_GENS.slice(); },
    genLeaders(): GenLeader[] { return GEN_LEADERS.slice().sort((a, b) => b.gen - a.gen); },
    setGenLeader(gen: number, memberId: string | null): void {
      const row = GEN_LEADERS.find(g => g.gen === gen); if (!row) return;
      const m = memberId ? MEMBERS.find(x => x.id === memberId) : undefined;
      row.memberId = memberId; row.name = m ? (m.nick || m.name) : '';
      emit();
    },
    subscribe(l: () => void): () => void { listeners.add(l); return () => listeners.delete(l); },
  };
})();
export { HistoryStore };

/* ───────────── TEAM ACTIVATION STORE ─────────────
   비활성 팀 → 팀장이 활성화 신청 → 운영진이 수락하면 active=true.
   팀 페이지(TeamDetail/TeamsScreen)와 운영 페이지(팀 활성화 탭)가 공유하는 반응형 스토어. */
function _teamNow(){ return `2026.06.13 ${String(NOW.hour).padStart(2,'0')}:${String(NOW.minute).padStart(2,'0')}`; }
const TeamStore = (function(){
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach(l => l());
  const team = (id: string) => TEAMS.find(t => t.id === id);
  // 활성화 신청 큐 — 데모 시드 1건 (블랭크 · t9)
  let reqs: ActivationRequest[] = [
    { id:'ar_seed1', teamId:'t9', by:'선우', role:'팀장', at:'2026.06.12 21:30',
      note:'세션 구성이 마무리되어 정식 활동을 시작하려 합니다. 정기 합주도 화요일 저녁으로 잡았어요!', status:'pending' },
  ];
  let seq = 1;
  return {
    isActive(id: string): boolean { const t = team(id); return t ? !!t.active : false; },
    requests(): ActivationRequest[] { return reqs; },
    pending(): ActivationRequest[] { return reqs.filter(r => r.status === 'pending'); },
    pendingFor(teamId: string): ActivationRequest | null { return reqs.find(r => r.teamId === teamId && r.status === 'pending') || null; },
    lastFor(teamId: string): ActivationRequest | null { return reqs.find(r => r.teamId === teamId) || null; },
    // 팀장: 활성화 신청 / 취소
    submit(teamId: string, by: string, note: string): void {
      if (reqs.some(r => r.teamId === teamId && r.status === 'pending')) return;
      reqs = [{ id:'ar'+(seq++), teamId, by: by || '팀장', role:'팀장', at:_teamNow(), note:(note||'').trim(), status:'pending' }, ...reqs];
      emit();
    },
    cancel(teamId: string): void { reqs = reqs.filter(r => !(r.teamId === teamId && r.status === 'pending')); emit(); },
    // 운영진: 수락(→활성화) / 거절
    approve(id: string): void { const r = reqs.find(x => x.id === id); if(!r) return; const t = team(r.teamId); if(t) t.active = true; r.status='approved'; r.decidedAt=_teamNow(); emit(); },
    reject(id: string): void { const r = reqs.find(x => x.id === id); if(!r) return; r.status='rejected'; r.decidedAt=_teamNow(); emit(); },
    approveMany(ids: string[]): void { const s = new Set(ids); reqs.forEach(r => { if(s.has(r.id) && r.status==='pending'){ const t = team(r.teamId); if(t) t.active = true; r.status='approved'; r.decidedAt=_teamNow(); } }); emit(); },
    rejectMany(ids: string[]): void { const s = new Set(ids); reqs.forEach(r => { if(s.has(r.id) && r.status==='pending'){ r.status='rejected'; r.decidedAt=_teamNow(); } }); emit(); },
    // 운영진: 일괄 활성/비활성 (운영 페이지 직접 관리)
    setActive(teamId: string, on: boolean): void { const t = team(teamId); if(t) t.active = !!on; if(!on) reqs = reqs.filter(r => !(r.teamId===teamId && r.status==='pending')); emit(); },
    setActiveMany(ids: string[], on: boolean): void { const s = new Set(ids); TEAMS.forEach(t => { if(s.has(t.id)) t.active = !!on; }); if(!on) reqs = reqs.filter(r => !(s.has(r.teamId) && r.status==='pending')); emit(); },
    subscribe(l: () => void): () => void { listeners.add(l); return () => listeners.delete(l); },
  };
})();
export { TeamStore };

export const DATA = { SESSIONS, MEMBERS, TEAMS, DAYS, HOURS, BOOKINGS, NOW, NOTICES, REFERENCE, NOTICE_COMMENTS, ME, STATS, TEAM_HUES, VICE, ROOM_OPEN, ROOM_EVENTS };

/* ═════════════ 운영 기간(학기·방학) 공용 설정 — 운영자 페이지 · 부원 타임테이블 공통 ═════════════
   운영자가 '타임테이블 설정'에서 정의한 학기/방학 기간과 '합주예약 시작' 일시를 기준으로,
   부원 타임테이블이 현재 기간 + 다음 기간을 보여주고, 예약 오픈 일시 전에는 조회만 가능하게 한다. */
export const TTShared = (function(){
  const TT_TODAY = '2026-06-13';        // 데모 기준일 (금요일)
  const TT_ANCHOR_MON = '2026-06-09';   // 데모 기준 주의 월요일
  const NOW_TS = TT_TODAY + 'T' + String(NOW.hour).padStart(2,'0') + ':' + String(NOW.minute).padStart(2,'0'); // 현재 일시 (예약 오픈 비교용)

  const KEYS = { terms:'CHUNGLIM_tt_terms_v1', events:'CHUNGLIM_tt_events_v1', hours:'CHUNGLIM_tt_hours_v1' };

  const TERMS_DEFAULT: Term[] = [
    { id:'tm1', type:'semester', label:'2026-1학기', start:'2026-03-02', end:'2026-06-21', bookOpenDate:'2026-02-26', bookOpenTime:'20:00' },
    { id:'tm2', type:'vacation', label:'여름방학',   start:'2026-06-22', end:'2026-08-31', bookOpenDate:'2026-06-19', bookOpenTime:'18:00' },
    { id:'tm3', type:'semester', label:'2026-2학기', start:'2026-09-01', end:'2026-12-20', bookOpenDate:'2026-08-28', bookOpenTime:'20:00' },
  ];
  const HOURS_DEFAULT: HoursConfig = {
    semester: { weekdayOpen:8, weekdayClose:22, weekendOpen:8, weekendClose:19 },
    vacation: { weekdayOpen:8, weekdayClose:19, weekendOpen:8, weekendClose:19 },
  };
  const EVENTS_DEFAULT: CalEvent[] = [
    { id:'ev0', kind:'closed', label:'합주실 장비 점검',     start:'2026-06-18', end:'2026-06-18', allDay:false, startTime:9,  endTime:13, note:'앰프 점검·드럼 헤드 교체로 오전 사용이 제한됩니다.' },
    { id:'ev1', kind:'closed', label:'기말고사 합주실 휴무', start:'2026-06-15', end:'2026-06-21', allDay:true,  startTime:8,  endTime:22, note:'시험기간 동안 합주실 운영을 중단합니다.' },
    { id:'ev2', kind:'event',  label:'정기공연 리허설 주간', start:'2026-09-14', end:'2026-09-20', allDay:false, startTime:18, endTime:22, note:'정기공연 〈청림, 소리내다〉 무대 준비 — 저녁 시간 합주실 우선 배정.' },
    { id:'ev3', kind:'event',  label:'여름 MT 〈리프〉',     start:'2026-07-25', end:'2026-07-26', allDay:true,  startTime:8,  endTime:22, note:'1박 2일 워크숍 · 합주실 정기 예약 미운영.' },
  ];

  function load<T>(key: string, def: T): T { try{ const r = localStorage.getItem(key); if(r) return JSON.parse(r) as T; }catch(e){} return def; }
  function loadTerms(): Term[] { return load(KEYS.terms, TERMS_DEFAULT.map(t => ({ ...t }))); }
  function loadHours(): HoursConfig { return load(KEYS.hours, JSON.parse(JSON.stringify(HOURS_DEFAULT)) as HoursConfig); }
  function loadEvents(): CalEvent[] { return load(KEYS.events, EVENTS_DEFAULT.map(e => ({ ...e }))); }

  function _d(iso: string): Date { return new Date(iso + 'T00:00:00Z'); }
  function daysUntil(iso: string): number { return Math.round((_d(iso).getTime() - _d(TT_TODAY).getTime()) / 86400000); }
  function weekdayKo(iso: string): string { return ['일','월','화','수','목','금','토'][_d(iso).getUTCDay()]; }
  function mondayOf(iso: string): string { const d = _d(iso); const g = (d.getUTCDay()+6)%7; d.setUTCDate(d.getUTCDate()-g); return d.toISOString().slice(0,10); }
  function weekFull(mondayISO: string): WeekDay[] { const out: WeekDay[] = []; const d = _d(mondayISO); for(let i=0;i<7;i++){ out.push({ mm:String(d.getUTCMonth()+1).padStart(2,'0'), dd:String(d.getUTCDate()).padStart(2,'0') }); d.setUTCDate(d.getUTCDate()+1); } return out; }

  function activeTerm(terms: Term[]): Term | null { return terms.find(t => TT_TODAY >= t.start && TT_TODAY <= t.end) || null; }
  function upcomingTerms(terms: Term[]): Term[] { return terms.filter(t => t.start > TT_TODAY).sort((a,b) => a.start.localeCompare(b.start)); }

  // 예약 오픈 상태: 운영자가 정한 bookOpenDate/Time 기준
  function bookingState(term: Term | null): BookingState {
    if(!term) return { open:false, hasOpen:false };
    if(!term.bookOpenDate) return { open:true, hasOpen:false };
    const opensAt = term.bookOpenDate + 'T' + (term.bookOpenTime || '00:00');
    return {
      open: NOW_TS >= opensAt, hasOpen:true, opensAt,
      openDate: term.bookOpenDate, openTime: term.bookOpenTime || '00:00',
      openWeekday: weekdayKo(term.bookOpenDate), dLeft: daysUntil(term.bookOpenDate),
    };
  }

  return {
    TT_TODAY, TT_ANCHOR_MON, NOW_TS, KEYS,
    TERMS_DEFAULT, HOURS_DEFAULT, EVENTS_DEFAULT,
    loadTerms, loadHours, loadEvents,
    daysUntil, weekdayKo, mondayOf, weekFull,
    activeTerm, upcomingTerms, bookingState,
  };
})();
