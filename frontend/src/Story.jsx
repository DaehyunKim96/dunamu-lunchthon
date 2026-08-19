import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import './story.css'
// Inlined as a base64 data URI at build time so the deck renders anywhere,
// independent of asset paths on the deployed host.
import heroImage from './assets/jikgwan-hero.jpg?inline'

const LINKEDIN_URL =
  'https://www.linkedin.com/feed/update/urn:li:activity:7479435675675688960/'

/* ══ 낙서 요소 (전부 인라인 SVG 패스) ═══════════════════════════ */

function Squiggle({ w = 220 }) {
  return (
    <svg className="dd-squiggle" viewBox="0 0 220 12" style={{ width: w }} aria-hidden="true">
      <path d="M3 8C28 3 42 10 66 6s38-6 62-1 40 8 62 2" />
    </svg>
  )
}

function ArrowRight() {
  return (
    <svg className="dd-arrow" viewBox="0 0 88 34" aria-hidden="true">
      <path d="M4 18c18-7 40-9 76-6" />
      <path d="M64 4c8 5 13 7 16 8-5 3-9 7-13 14" />
    </svg>
  )
}

function ArrowDown() {
  return (
    <svg className="dd-arrow-down" viewBox="0 0 34 74" aria-hidden="true">
      <path d="M17 4c-4 20-5 40-2 62" />
      <path d="M4 50c5 8 8 13 11 18 3-7 7-12 13-17" />
    </svg>
  )
}

function Circled({ children }) {
  return (
    <span className="dd-circled">
      {children}
      <svg viewBox="0 0 200 64" preserveAspectRatio="none" aria-hidden="true">
        <path d="M104 5C58 2 12 12 8 31c-4 20 46 30 96 28 44-2 92-12 88-31C188 10 146 4 104 5" />
      </svg>
    </span>
  )
}

function Star({ className = '' }) {
  return (
    <svg className={`dd-star ${className}`} viewBox="0 0 32 32" aria-hidden="true">
      <path d="M16 3v26M4 16h24M7 7l18 18M25 7 7 25" />
    </svg>
  )
}

function Cross() {
  return (
    <svg className="dd-cross" viewBox="0 0 26 26" aria-hidden="true">
      <path d="M5 5l16 16M21 5 5 21" />
    </svg>
  )
}

function Check() {
  return (
    <svg className="dd-check" viewBox="0 0 26 26" aria-hidden="true">
      <path d="M4 14l6 7L22 5" />
    </svg>
  )
}

function Baseball() {
  return (
    <svg className="dd-ball" viewBox="0 0 60 60" aria-hidden="true">
      <circle cx="30" cy="30" r="24" />
      <path d="M13 12c7 9 7 27 0 36M47 12c-7 9-7 27 0 36" />
      <path d="M18 17l-4-2M18 26l-5-1M18 35l-5 1M18 44l-4 2" />
      <path d="M42 17l4-2M42 26l5-1M42 35l5 1M42 44l4 2" />
    </svg>
  )
}

/* ══ 레이아웃 컴포넌트 ═════════════════════════════════════════ */

function Slide({ active, tone = '', children }) {
  return <section className={`sl ${tone}${active ? ' is-on' : ''}`}>{children}</section>
}

function Kicker({ children }) {
  return <p className="kicker">{children}</p>
}

function Title({ children, hl }) {
  return (
    <h1 className="sl-title">
      {children}
      {hl ? <Squiggle w={260} /> : null}
    </h1>
  )
}

/** 개조식 목록 — 손그림 불릿 + 선택적 강조 */
function List({ items, size = 'md' }) {
  return (
    <ul className={`bl bl-${size}`}>
      {items.map((it, i) => {
        const item = typeof it === 'string' ? { t: it } : it
        return (
          <li key={i} className={item.mark ? `is-${item.mark}` : ''}>
            <span className="bl-mk" aria-hidden="true">
              {item.mark === 'no' ? <Cross /> : item.mark === 'yes' ? <Check /> : <i />}
            </span>
            <span className="bl-t">{item.t}</span>
            {item.sub ? <span className="bl-s">{item.sub}</span> : null}
          </li>
        )
      })}
    </ul>
  )
}

function Cover({ active, kicker, title, sub, meta }) {
  return (
    <Slide active={active} tone="ly-cover">
      <div className="cover-in">
        <Kicker>{kicker}</Kicker>
        <h1 className="cover-title">{title}</h1>
        <Squiggle w={420} />
        <p className="cover-sub">{sub}</p>
        <p className="cover-meta">{meta}</p>
      </div>
      <Baseball />
    </Slide>
  )
}

function Agenda({ active, title, items }) {
  return (
    <Slide active={active} tone="ly-agenda">
      <Title hl>{title}</Title>
      <ol className="ag">
        {items.map((it, i) => (
          <li key={i} className="sketch">
            <span className="ag-no">{it.no}</span>
            <span className="ag-q">{it.q}</span>
            <span className="ag-d">{it.d}</span>
          </li>
        ))}
      </ol>
    </Slide>
  )
}

function Section({ active, no, question, note }) {
  return (
    <Slide active={active} tone="ly-section">
      <div className="sec-in">
        <span className="sec-no">{no}</span>
        <h1 className="sec-q">{question}</h1>
        <Squiggle w={300} />
        <p className="sec-note">{note}</p>
      </div>
    </Slide>
  )
}

function Bullets({ active, kicker, title, lead, items, aside, size }) {
  return (
    <Slide active={active} tone={`ly-bullets${aside ? ' has-aside' : ''}`}>
      <Kicker>{kicker}</Kicker>
      <Title hl>{title}</Title>
      <div className="bul-body">
        <div className="bul-main">
          {lead ? <p className="lead">{lead}</p> : null}
          <List items={items} size={size} />
        </div>
        {aside ? (
          <aside className="note sketch">
            <span className="note-tag">{aside.tag}</span>
            <p>{aside.body}</p>
          </aside>
        ) : null}
      </div>
    </Slide>
  )
}

function TwoUp({ active, kicker, title, cards, verdict }) {
  return (
    <Slide active={active} tone="ly-twoup">
      <Kicker>{kicker}</Kicker>
      <Title hl>{title}</Title>
      <div className="tu">
        {cards.map((c, i) => (
          <div key={i} className={`tu-card sketch${c.tone ? ` t-${c.tone}` : ''}`}>
            <span className="tu-lb">{c.label}</span>
            <h3>{c.head}</h3>
            <List items={c.items} size="sm" />
          </div>
        ))}
      </div>
      {verdict ? (
        <p className="verdict">
          <ArrowRight />
          <span>{verdict}</span>
        </p>
      ) : null}
    </Slide>
  )
}

function Steps({ active, kicker, title, steps, foot }) {
  return (
    <Slide active={active} tone="ly-steps">
      <Kicker>{kicker}</Kicker>
      <Title hl>{title}</Title>
      <div className="st">
        {steps.map((s, i) => (
          <div className="st-cell" key={i}>
            <div className="st-box sketch">
              <span className="st-no">{i + 1}</span>
              <h3>{s.head}</h3>
              <p>{s.body}</p>
            </div>
            {i < steps.length - 1 ? <ArrowRight /> : null}
          </div>
        ))}
      </div>
      {foot ? <p className="st-foot">{foot}</p> : null}
    </Slide>
  )
}

function Logic({ active, kicker, title, chain, punch }) {
  return (
    <Slide active={active} tone="ly-logic">
      <Kicker>{kicker}</Kicker>
      <Title>{title}</Title>
      <div className="lg">
        {chain.map((c, i) => (
          <div className="lg-row" key={i}>
            <div className="lg-box sketch">{c}</div>
            {i < chain.length - 1 ? <ArrowDown /> : null}
          </div>
        ))}
      </div>
      <p className="lg-punch">
        <Circled>{punch}</Circled>
      </p>
    </Slide>
  )
}

function Hero({ active, kicker, title, caption, tags }) {
  return (
    <Slide active={active} tone="ly-hero">
      <Kicker>{kicker}</Kicker>
      <Title>{title}</Title>
      <figure className="hero-fig">
        <img src={heroImage} alt="직관 JIKGWAN 서비스 화면 — 좌석 예매, Dojang 인증, NFT 티켓 카드" />
      </figure>
      <div className="hero-foot">
        <p className="hero-cap">{caption}</p>
        <ul className="hero-tags">
          {tags.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </div>
    </Slide>
  )
}

function Blockers({ active, kicker, title, rows, foot }) {
  return (
    <Slide active={active} tone="ly-blockers">
      <Kicker>{kicker}</Kicker>
      <Title hl>{title}</Title>
      <div className="bk">
        {rows.map((r, i) => (
          <div className="bk-row" key={i}>
            <div className="bk-prob">
              <span className="bk-no">{r.no}</span>
              <span>{r.problem}</span>
            </div>
            <ArrowRight />
            <div className="bk-fix sketch">
              <Check />
              <span>{r.fix}</span>
            </div>
          </div>
        ))}
      </div>
      {foot ? <p className="st-foot">{foot}</p> : null}
    </Slide>
  )
}

function Closing({ active, title, lines, links }) {
  return (
    <Slide active={active} tone="ly-closing">
      <div className="cl-in">
        <Star className="s1" />
        <Star className="s2" />
        <h1 className="cl-title">{title}</h1>
        <Squiggle w={340} />
        <ul className="cl-lines">
          {lines.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
        <ul className="cl-links">
          {links.map((l, i) => (
            <li key={i}>
              <span className="cl-lb">{l.label}</span>
              {l.href ? (
                <a href={l.href} target="_blank" rel="noreferrer">
                  {l.text}
                </a>
              ) : (
                <em>{l.text}</em>
              )}
            </li>
          ))}
        </ul>
      </div>
    </Slide>
  )
}

/* ══ 슬라이드 ═══════════════════════════════════════════════════ */

const SLIDES = [
  /* 00 — 오프닝 ─────────────────────────────────────────────── */
  (p) => (
    <Cover
      {...p}
      kicker="두아이 런치톤 · 사내 AI 해커톤 회고"
      title={<>직관을 만들기까지</>}
      sub={<>마감 며칠 전에 다시 시작해, 암표 없는 티켓 플랫폼으로 끝난 이야기</>}
      meta="FDI팀 Deaver"
    />
  ),

  (p) => (
    <Agenda
      {...p}
      title="오늘 할 이야기"
      items={[
        { no: '01', q: '어떻게 시작했나', d: '해커톤 참여 계기' },
        { no: '02', q: '왜 블록체인이었나', d: '차별점의 설계' },
        { no: '03', q: '왜 암표였나', d: '좋아하는 것에서 출발' },
        { no: '04', q: '왜 GIWA였나', d: '체인의 강점 읽기' },
        { no: '05', q: '무엇이 나왔나', d: '직관 JIKGWAN' },
        { no: '06', q: '무엇이 남았나', d: '느낀 점과 다음' },
      ]}
    />
  ),

  /* 01 — 어떻게 시작했나 ────────────────────────────────────── */
  (p) => (
    <Section
      {...p}
      no="01"
      question="어떻게 시작했나"
      note="출품작이 아니라, 도우미 역할에서 출발한 해커톤"
    />
  ),

  (p) => (
    <Bullets
      {...p}
      kicker="01 · 시작"
      title="사내 해커톤의 페이스메이커 제안"
      items={[
        { t: '사내 AI 해커톤 「두아이 런치톤」 개최' },
        { t: '페이스메이커 역할 제안 수신' },
        { t: '평소 해커톤에 대한 높은 관심' },
        { t: '평소 AI 도구 활용에 대한 높은 관심' },
        { t: '수락', mark: 'yes' },
      ]}
      aside={{
        tag: '전제',
        body: '관심사 두 개가 겹치는 자리 → 고민할 이유가 없던 제안',
      }}
    />
  ),

  (p) => (
    <Bullets
      {...p}
      kicker="01 · 역할"
      title="페이스메이커란"
      lead="다른 참가 팀원들의 AI 활용 도우미"
      items={[
        { t: '결과물 제작 중 막히는 지점에 대한 질의응답' },
        { t: '도구 선택 · 프롬프트 · 워크플로우 가이드 제시' },
        { t: 'AI 사용법에 어려움을 겪는 팀원 밀착 지원' },
        { t: '단, 본인도 1인 1팀으로 출품 의무 보유', mark: 'key' },
      ]}
      aside={{
        tag: '조건',
        body: '남을 돕는 역할과 내 출품작이 동시에 요구되는 구조',
      }}
    />
  ),

  (p) => (
    <TwoUp
      {...p}
      kicker="01 · 초기 고민"
      title="출품작에 대한 두 갈래"
      cards={[
        {
          label: 'A안',
          head: '역할에 집중',
          items: [
            '페이스메이커 본연의 역할에 충실',
            '출품은 재밌고 간단한 결과물로',
            '리스크 낮음 · 임팩트 낮음',
          ],
        },
        {
          label: 'B안',
          head: '역할을 곧 출품작으로',
          tone: 'sky',
          items: [
            '오픈클로 · 헤르메스 에이전트 활용',
            'AI 사용법 질의응답 + 가이드 제시 에이전트 제작',
            '담당 팀원 지원과 출품을 동시 해결',
          ],
        },
      ]}
      verdict="B안 쪽으로 기울어 있던 상황"
    />
  ),

  (p) => (
    <Bullets
      {...p}
      kicker="01 · 반전"
      title="예상보다 질문이 적었다"
      items={[
        { t: '실제 질문 유입량이 예상 대비 저조' },
        { t: 'B안의 존재 이유 약화', mark: 'no' },
        { t: '제출 마감 며칠 전 도달' },
        { t: '출품작을 원점에서 재고민 시작', mark: 'key' },
      ]}
      aside={{
        tag: '여기서부터',
        body: '남은 시간 며칠. 지금부터가 진짜 해커톤의 시작',
      }}
    />
  ),

  /* 02 — 왜 블록체인이었나 ──────────────────────────────────── */
  (p) => (
    <Section
      {...p}
      no="02"
      question="왜 블록체인이었나"
      note="AI 해커톤에서 AI만으로는 차별점이 없다는 판단"
    />
  ),

  (p) => (
    <TwoUp
      {...p}
      kicker="02 · 판단"
      title="방향을 정한 두 가지 판단"
      cards={[
        {
          label: '판단 1',
          head: 'AI만으로는 변별력 없음',
          tone: 'marker',
          items: [
            'AI 해커톤 → 전원이 AI 활용에 집중',
            '「AI를 잘 쓴다」는 것 자체가 기본값',
            '명확한 컨셉 없는 AI 활용 = 차별점 부재',
          ],
        },
        {
          label: '판단 2',
          head: '나에게는 체인 경험이 있음',
          tone: 'sky',
          items: [
            '작년부터 블록체인 해커톤 참가',
            '올해 솔라나 해커톤 수상',
            '컨트랙트 작성 → 배포 → 트랜잭션 → 시각화 전 과정 경험',
          ],
        },
      ]}
      verdict="컨셉이 기술보다 앞서야 한다는 결론"
    />
  ),

  (p) => (
    <Bullets
      {...p}
      kicker="02 · 근거"
      title="블록체인 해커톤 경험"
      items={[
        { t: '작년 — 블록체인 해커톤 첫 참가' },
        { t: '올해 — 솔라나 해커톤 수상', mark: 'yes' },
        { t: '스마트 컨트랙트 작성 · 배포 경험 보유' },
        { t: '트랜잭션 생성 및 시각화까지 완주 경험' },
        {
          t: '기록',
          sub: (
            <a href={LINKEDIN_URL} target="_blank" rel="noreferrer">
              linkedin.com — 솔라나 해커톤 수상 게시물 ↗
            </a>
          ),
        },
      ]}
    />
  ),

  (p) => (
    <Bullets
      {...p}
      kicker="02 · 인사이트"
      title="허들은 해보기 전이 제일 높다"
      items={[
        { t: '다수가 블록체인 결과물 제작에 부담을 느낌' },
        { t: '실제로는 한 번 해보면 진입 장벽이 낮은 영역' },
        { t: 'AI 도구 활용 시 컨트랙트 작성 · 배포까지 도달 가능' },
        { t: '남들이 어려워하는 지점 = 차별점이 생기는 지점', mark: 'key' },
        { t: '방향 확정 — AI × 블록체인', mark: 'yes' },
      ]}
      aside={{
        tag: '핵심',
        body: '진입 장벽의 대부분은 실제 난이도가 아니라 시도 전의 인식',
      }}
    />
  ),

  /* 03 — 왜 암표였나 ───────────────────────────────────────── */
  (p) => (
    <Section
      {...p}
      no="03"
      question="왜 프로야구 암표였나"
      note="이번엔 정말 좋아하는 것을 소재로 삼고 싶었던 선택"
    />
  ),

  (p) => (
    <Bullets
      {...p}
      kicker="03 · 소재"
      title="이번엔 좋아하는 것으로"
      items={[
        { t: '취미를 메인 콘텐츠로 삼고 싶었던 목표' },
        { t: '오래된 LG 트윈스 팬' },
        { t: '야구를 굉장히 좋아함' },
        { t: '야구와 관련된 결과물 희망', mark: 'key' },
      ]}
      aside={{
        tag: '기준',
        body: '마감까지 끌고 갈 동력 = 소재에 대한 애정',
      }}
    />
  ),

  (p) => (
    <Bullets
      {...p}
      kicker="03 · 과정"
      title="에이전트와의 브레인스토밍"
      items={[
        { t: '연초 Mac mini 구입 → 상시 구동 AI 에이전트 구성' },
        { t: 'Telegram으로 평소에도 에이전트와 대화' },
        { t: 'Hermes 에이전트와 야구 주제 논의 반복' },
        { t: '논의 중 「티켓팅」 키워드 도출', mark: 'key' },
      ]}
      aside={{
        tag: '역할',
        body: '에이전트는 결정을 대신하지 않고, 후보를 넓히는 쪽으로 사용',
      }}
    />
  ),

  (p) => (
    <Bullets
      {...p}
      kicker="03 · 문제의식"
      title="올해, 야구장에 한 번도 못 갔다"
      items={[
        { t: '올해 야구장 방문 0회', mark: 'no' },
        { t: '이유 — 표를 구할 수 없었음' },
        { t: '이전부터 암표 근절에 대한 문제의식 보유' },
        { t: '내가 직접 겪은 문제 = 가장 확실한 주제', mark: 'key' },
        { t: '주제 확정 — 암표상 없는 티켓팅 플랫폼', mark: 'yes' },
      ]}
    />
  ),

  /* 04 — 왜 GIWA였나 ──────────────────────────────────────── */
  (p) => (
    <Section
      {...p}
      no="04"
      question="왜 GIWA였나"
      note="체인 선택이 곧 기획이었던 이유"
    />
  ),

  (p) => (
    <Bullets
      {...p}
      kicker="04 · 안티패턴"
      title="과거 해커톤에서 배운 것"
      lead="web2 프로덕트를 web3에 억지로 끼워 넣는 사례가 많음"
      items={[
        { t: 'DB가 더 편하고 저렴하고 빠른 영역까지 온체인으로 이동', mark: 'no' },
        { t: '실효성 저하 → 낮은 평가로 직결', mark: 'no' },
        { t: '교훈 — 온체인이어야 할 이유가 있는 문제만 온체인으로', mark: 'key' },
      ]}
      aside={{
        tag: '되묻기',
        body: '「이 데이터가 왜 중앙 DB면 안 되는가」에 답하지 못하면 억지 결합',
      }}
    />
  ),

  (p) => (
    <Bullets
      {...p}
      kicker="04 · 기준"
      title="체인이 미는 강점을 먼저 읽는다"
      items={[
        { t: '체인마다 강조하는 강점이 상이' },
        { t: '그 체인이 밀고자 하는 특성 파악이 선행 조건' },
        { t: '사내 해커톤 → GIWA 체인 의도적 선정', mark: 'key' },
        { t: 'GIWA 공식 docs 전량 정독', mark: 'yes' },
      ]}
      aside={{
        tag: '슬로건',
        body: '누구나 쉽고 재밌게 사용할 수 있는 웹3 인프라',
      }}
    />
  ),

  (p) => (
    <TwoUp
      {...p}
      kicker="04 · 생태계"
      title="docs에서 읽어낸 GIWA의 두 축"
      cards={[
        {
          label: 'Dojang',
          head: '온체인 신원 인증',
          tone: 'sky',
          items: [
            '오프체인 정보를 온체인 attestation으로 발급',
            'Ethereum Attestation Service(EAS) 기반',
            'PII 노출 없이 지갑에 identity 부여',
            'Verified Address = 고객확인을 마친 지갑',
          ],
        },
        {
          label: 'up.id',
          head: 'Upbit Web3 Names',
          tone: 'go',
          items: [
            '0x1234… 대신 username.up.id 형태의 이름',
            '지갑을 찾고 · 기억하고 · 송금하는 경험 개선',
            '주소 기반 UX의 불신과 실수 제거',
          ],
        },
      ]}
      verdict="두 서비스의 공통점 = 「온체인 지갑의 신원」"
    />
  ),

  (p) => (
    <Bullets
      {...p}
      kicker="04 · 결론"
      title="GIWA의 강점은 신원 인증이 가능한 지갑"
      items={[
        { t: 'Dojang → 개인정보 노출 없이 온체인 identity 확보', mark: 'yes' },
        { t: 'Verified Address → 거래소 KYC 통과 사실만 온체인 참조', mark: 'yes' },
        { t: 'up.id → 사람이 읽는 이름으로 상대 확인', mark: 'yes' },
        { t: '부각해야 할 지점 — 「신원이 인증된 지갑 간의 거래」', mark: 'key' },
      ]}
      aside={{
        tag: '질문',
        body: '신원 인증이 결정적으로 필요한 영역은 어디인가',
      }}
    />
  ),

  (p) => (
    <Logic
      {...p}
      kicker="04 · 전환점"
      title="연결 고리"
      chain={[
        '신원이 인증된 지갑 = 나 자신',
        '인증된 두 사용자 간 거래 = 신원이 보장된 거래',
        '암표상이 뚫으려면 자신의 지갑(=신원)을 팔아야 함',
      ]}
      punch="암표 문제의 구조적 해결"
    />
  ),

  /* 05 — 무엇이 나왔나 ─────────────────────────────────────── */
  (p) => (
    <Section
      {...p}
      no="05"
      question="그래서, 직관"
      note="검증된 팬만 사고파는 KBO 티켓 플랫폼"
    />
  ),

  (p) => (
    <Hero
      {...p}
      kicker="05 · 결과물"
      title="직관 JIKGWAN"
      caption="암표 걱정 없는 진짜 직관"
      tags={['검증 팬 — Dojang 지갑 인증', '내 티켓 — NFT 카드로 보관', '안심 양도 — 정가 이하만 허용']}
    />
  ),

  (p) => (
    <Bullets
      {...p}
      kicker="05 · 정의"
      title="한 줄 정의"
      lead="검증된 팬만 구단 정가로 사고, 정가 이하로만 팬끼리 양도하며, 현재 소유자만 입장하는 블록체인 기반 직관 티켓 플랫폼"
      items={[
        { t: '1차 시장 — 구단이 정가 발행, 검증된 팬만 구매', mark: 'yes' },
        { t: '2차 시장 — 공식 마켓 경유 + 정가 이하 등록만 허용', mark: 'yes' },
        { t: '입장 — 현재 온체인 소유자에게만 유효 QR 발급', mark: 'yes' },
        { t: '기존 모바일 티켓의 편의성은 그대로 유지', mark: 'key' },
      ]}
      size="sm"
    />
  ),

  (p) => (
    <Blockers
      {...p}
      kicker="05 · 구조"
      title="암표의 4단계, 4개의 차단 지점"
      rows={[
        { no: '①', problem: '봇의 대량 구매', fix: '검증된 지갑만 구매 · 1인 N매 제한을 컨트랙트가 강제' },
        { no: '②', problem: '검증 안 된 채널 재양도', fix: '공식 마켓을 거치지 않은 전송 원천 차단' },
        { no: '③', problem: '시세 위 웃돈 재판매', fix: '티켓에 새겨진 정가 이하로만 등록 가능' },
        { no: '④', problem: '캡처 이미지 입장', fix: '30~60초 수명 동적 QR · 사용 즉시 무효화' },
      ]}
      foot="기존 시스템은 각 단계를 중앙 서버 정책으로만 방어 → 여기서는 코드로 강제"
    />
  ),

  (p) => (
    <Bullets
      {...p}
      kicker="05 · 기술"
      title="만든 방식"
      items={[
        { t: '티켓 = 자유 전송이 잠긴 NFT', sub: '소유권 모델은 쓰되 「누구에게나 전송」 기본 동작은 의도적으로 차단' },
        { t: '컨트랙트 4분리', sub: '티켓 본체 · 1차 발행 · 2차 양도 마켓 · 입장 게이트 → 최소 권한 원칙' },
        { t: '신원은 온체인에서 강제', sub: 'OnchainVerifier로 isVerified(주소, attester) 직접 조회' },
        { t: '입장은 하이브리드', sub: '소유권 판단은 온체인 · 입장 순간 검증은 EIP-712 오프체인 서명' },
        { t: '개인정보 미저장', sub: '실명·연락처 없이 「검증 여부」 참/거짓 하나만 참조' },
      ]}
      size="sm"
    />
  ),

  (p) => (
    <Bullets
      {...p}
      kicker="05 · 현재"
      title="실제로 돌아가는 상태"
      items={[
        { t: 'GIWA Sepolia 테스트넷에 컨트랙트 실배포 완료', mark: 'yes' },
        { t: 'React 웹앱에서 실제 지갑으로 온체인 예매 · 양도 · 검증 수행', mark: 'yes' },
        { t: 'Flashblocks preconfirmation으로 결과 즉시 UI 반영' },
        { t: '데모 3종 — 예매 / 양도 / 입장' },
        { t: '동작하는 프로토타입 단계까지 도달', mark: 'key' },
      ]}
      aside={{
        tag: '기간',
        body: '마감 며칠 전 재시작 → 온체인 동작 프로토타입까지',
      }}
    />
  ),

  /* 06 — 무엇이 남았나 ─────────────────────────────────────── */
  (p) => (
    <Section
      {...p}
      no="06"
      question="무엇이 남았나"
      note="해커톤이 끝나고 남은 것들"
    />
  ),

  (p) => (
    <Bullets
      {...p}
      kicker="06 · 느낀 점"
      title="이번 해커톤에서 느낀 것"
      items={[
        { t: 'AI 시대의 차별점은 도구 숙련도가 아니라 문제 선택', mark: 'key' },
        { t: '컨셉이 먼저, 기술은 그 다음 — 역순이면 억지 결합' },
        { t: '체인의 강점을 읽는 일이 곧 기획의 출발점' },
        { t: '좋아하는 소재일수록 마감까지 끌고 갈 동력이 생김' },
        { t: '에이전트는 결정을 대신하지 않고 사고의 폭을 넓혀줌' },
        { t: '진입 장벽의 대부분은 시도 전에만 존재' },
      ]}
      size="sm"
    />
  ),

  (p) => (
    <Steps
      {...p}
      kicker="06 · 다음"
      title="앞으로 해보고 싶은 것"
      steps={[
        { head: '완성도', body: '게이트 QR 서명 서버 PoC · 컨트랙트 감사' },
        { head: '검증', body: '구단 1곳 파일럿 수준으로 실사용 검증' },
        { head: '공유', body: '해커톤에서 쌓인 질의응답을 사내 AI 가이드로 정리' },
        { head: '확장', body: 'AI × 블록체인 조합 실험' },
      ]}
      foot="다음 해커톤도 「내가 좋아하는 것」과 「내가 겪은 문제」에서 출발"
    />
  ),

  (p) => (
    <Closing
      {...p}
      title="감사합니다"
      lines={[
        '좋아하는 것에서 출발한 주제',
        '체인의 강점에서 도출한 해법',
        '며칠 만에 온체인에서 돌아간 프로토타입',
      ]}
      links={[
        { label: '제품 덱', text: '/presentation' },
        { label: 'GIWA Dojang', text: 'docs.giwa.io/giwa-ecosystem/dojang', href: 'https://docs.giwa.io/giwa-ecosystem/dojang' },
        { label: '해커톤 기록', text: 'linkedin.com — 솔라나 해커톤 수상', href: LINKEDIN_URL },
      ]}
    />
  ),
]

/* ══ 덱 셸 ═══════════════════════════════════════════════════ */

export default function Story() {
  const [index, setIndex] = useState(() => {
    const requested = Number(new URLSearchParams(window.location.search).get('slide'))
    return Number.isInteger(requested) && requested > 0
      ? Math.min(requested - 1, SLIDES.length - 1)
      : 0
  })
  const [scale, setScale] = useState(1)
  const total = SLIDES.length

  const go = useCallback(
    (next) => {
      setIndex((cur) =>
        Math.max(0, Math.min(total - 1, typeof next === 'function' ? next(cur) : next)),
      )
    },
    [total],
  )

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault()
        go((c) => c + 1)
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault()
        go((c) => c - 1)
      } else if (e.key === 'Home') {
        go(0)
      } else if (e.key === 'End') {
        go(total - 1)
      } else if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen?.()
        else document.exitFullscreen?.()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, total])

  useLayoutEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / 1280, window.innerHeight / 720))
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  // Handwriting webfonts load only on this route, so the main app is unaffected.
  useEffect(() => {
    document.title = '직관을 만들기까지 · 두아이 런치톤 회고'
    const pre = document.createElement('link')
    pre.rel = 'preconnect'
    pre.href = 'https://fonts.gstatic.com'
    pre.crossOrigin = ''
    const font = document.createElement('link')
    font.rel = 'stylesheet'
    font.href =
      'https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&family=Gaegu:wght@300;400;700&display=swap'
    document.head.append(pre, font)
    return () => {
      pre.remove()
      font.remove()
    }
  }, [])

  return (
    <div className="story-root">
      <div className="story-stage" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
        {SLIDES.map((SlideComp, i) => (
          <SlideComp key={i} active={i === index} />
        ))}

        <div className="story-chrome">
          <span className="sc-brand">
            직관을 만들기까지 <em>JIKGWAN</em>
          </span>
          <span className="sc-count">
            <b>{String(index + 1).padStart(2, '0')}</b> / {String(total).padStart(2, '0')}
          </span>
          <span className="sc-hint">
            <kbd>←</kbd> <kbd>→</kbd> 이동 · <kbd>F</kbd> 전체화면
          </span>
        </div>

        <div className="story-progress" style={{ width: `${((index + 1) / total) * 100}%` }} />
      </div>

      <button className="story-nav prev" onClick={() => go((c) => c - 1)} aria-label="이전 슬라이드" />
      <button className="story-nav next" onClick={() => go((c) => c + 1)} aria-label="다음 슬라이드" />
    </div>
  )
}
