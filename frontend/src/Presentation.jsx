import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import './presentation.css'

/* ── 공통 슬라이드 셸 ──────────────────────────────────────── */
function Slide({ active, className = '', children }) {
  return <div className={`deck-slide ${className}${active ? ' is-active' : ''}`}>{children}</div>
}

/* ── 작은 아이콘들 (앱과 동일한 결의 라인/실드 아이콘) ───────────── */
function Seam({ className = 'seam' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 5 Q9 12 6 19 M18 5 Q15 12 18 19" stroke="#ff5a4e" strokeWidth="1.7"
        fill="none" strokeDasharray="1.3 3.2" strokeLinecap="round" />
    </svg>
  )
}
function BrandMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="#0a1626" />
      <path d="M6 6 Q9 12 6 18 M18 6 Q15 12 18 18" stroke="#e8131d" strokeWidth="1.6"
        fill="none" strokeDasharray="1.2 3" strokeLinecap="round" />
    </svg>
  )
}
function IconCheck({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12.5 10 17 19 7" fill="none" stroke="currentColor" strokeWidth="2.6"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function IconShield() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.5 4.5 5.6v5.4c0 4.7 3.2 8.8 7.5 10.2 4.3-1.4 7.5-5.5 7.5-10.2V5.6L12 2.5Z"
        fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8.4 12.2 11 14.8l4.6-5" fill="none" stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function IconNFT() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="14" rx="2.4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.5 9.5h17" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="7" cy="7.2" r="0.9" fill="currentColor" />
      <path d="M8 16l3-3 2 2 2.5-2.5L18 15" fill="none" stroke="currentColor" strokeWidth="1.6"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function IconTag() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3.5 11.5 11.5 3.5h7v7l-8 8-7-7Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="15" cy="8" r="1.4" fill="currentColor" />
      <path d="M7 14l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
function IconQR() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <rect x="14" y="3.5" width="6.5" height="6.5" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <rect x="3.5" y="14" width="6.5" height="6.5" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M14 14h3v3M20.5 14v6.5M14 20.5h3" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

/* ── 슬라이드 3 — 타이틀 / 직관 더블 미닝 ─────────────────────── */
function SlideTitle({ active }) {
  return (
    <Slide active={active} className="s-title">
      <span className="d-kicker"><Seam /> 이 문제를 해결하기 위해 만든 플랫폼</span>
      <div className="wordmark">
        직관
        <span className="hanja">直觀</span>
      </div>
      <div className="latin">JIKGWAN</div>

      <div className="dual">
        <div className="cell">
          <span className="ko">직접 관람 <small>直觀</small></span>
          <span className="en">야구를 사랑하는 사람이 경기장의 열기를 직접 느끼는 일</span>
        </div>
        <div className="cell">
          <span className="ko">직관 <small>直觀</small></span>
          <span className="en">본질을 꿰뚫는 하나의 통찰 · Intuition</span>
        </div>
      </div>

      <p className="tagline">
        AI는 도구일 뿐입니다. 현실의 문제를 해결하는 가장 큰 힘은<br />
        본질을 꿰뚫는 <b>인간의 직관</b>입니다.
      </p>
    </Slide>
  )
}

/* ── 슬라이드 2 — 문제 (암표) ─────────────────────────────────── */
function SlideProblem({ active }) {
  return (
    <Slide active={active} className="s-problem">
      <span className="d-kicker"><Seam /> 우리가 풀려는 <b>현실의 문제</b></span>
      <div className="problem-grid">
        <div className="problem-copy">
          <h1 className="d-h1">
            프로야구의 열기가 뜨거워질수록,<br />
            <span className="d-hl">암표상</span>은 더 기승을 부립니다.
          </h1>
          <p className="problem-lead">
            1만원짜리 티켓이 <b>15만원</b>에 거래되고,<br />
            개막과 동시에 의심 게시물 <b>186건</b>이 수사 의뢰됐습니다.
          </p>
          <blockquote className="fan-quote">
            “야구에 진심인 팬으로서 꼭 풀고 싶었습니다.<br />
            그리고 이 문제는 충분히 기술로 막을 수 있다고 판단했습니다.”
          </blockquote>
        </div>

        <figure className="article-card">
          <div className="article-image">
            <img
              src="/assets/kbo-scalping-hankookilbo-2026.png"
              alt="한국일보 프로야구 암표 전쟁 기사 화면"
            />
            <span className="article-stat"><b>15배</b><small>정가 대비 암표가</small></span>
          </div>
          <figcaption>
            한국일보 · 2026.04.01
            <span>“1만원 티켓을 15만원에 판매… 프로야구 개막과 시작된 ‘암표 전쟁’”</span>
          </figcaption>
        </figure>
      </div>
    </Slide>
  )
}

/* ── 슬라이드 1 — 의도 (Intention) ───────────────────────────── */
function SlideIntent({ active }) {
  return (
    <Slide active={active} className="s-center">
      <span className="d-kicker"><Seam /> 나의 해커톤 출발점</span>
      <p className="intent-quote" style={{ marginTop: 26 }}>
        AI를 활용해<br />
        <span className="mark">현실의 문제</span>를 풀고 싶었습니다.
      </p>

      <div className="intent-flow">
        <div className="intent-node gold">
          <span className="intent-symbol">01</span>
          <span className="tt">현실에서 발견한 문제</span>
          <span className="ds">팬이 표를 구하지 못하는 암표 시장</span>
        </div>
        <span className="intent-arrow">→</span>
        <div className="intent-node">
          <span className="intent-symbol">02</span>
          <span className="tt">사람의 의도</span>
          <span className="ds">진짜 팬에게 정가로 표를 돌려주자</span>
        </div>
        <span className="intent-arrow">→</span>
        <div className="intent-node accent">
          <span className="intent-symbol">AI</span>
          <span className="tt">AI의 실행</span>
          <span className="ds">리서치 · 설계 · 코드 · 컨트랙트</span>
        </div>
      </div>

      <p className="intent-sub">
        저는 <b>풀고 싶은 문제와 의도 하나</b>만 들고,<br />
        조사부터 서비스 설계와 구현까지 나머지는 전적으로 AI에 맡겼습니다.
      </p>
    </Slide>
  )
}

/* ── 슬라이드 4 — 솔루션 / Dojang의 차별점 ───────────────────── */
function SlideSolution({ active }) {
  return (
    <Slide active={active} className="s-solution">
      <span className="d-kicker"><Seam /> 이 문제를 해결하는 핵심 기술</span>
      <div className="giwa-brand" aria-label="GIWA Chain">
        <span>BUILT ON</span>
        <img src="/assets/giwa-chain-logo.png" alt="GIWA" />
      </div>
      <h1 className="solution-title">
        신뢰할 수 있는 <span className="d-hl-gold">고객확인</span>을,<br />
        암표를 막는 <span className="d-hl">블록체인 신원 인증</span>으로.
      </h1>

      <div className="dojang-flow">
        <div className="dojang-step">
          <span className="dojang-no">1</span>
          <b>신뢰할 수 있는 고객확인</b>
          <small>Upbit 같은 신뢰할 수 있는 발행자가 사용자를 확인</small>
        </div>
        <span className="dojang-arrow">→</span>
        <div className="dojang-step privacy">
          <span className="dojang-no">2</span>
          <b>Dojang 인증 자격 발급</b>
          <small>확인 결과를 블록체인에서 검증 가능한 자격으로 연결</small>
        </div>
        <span className="dojang-arrow">→</span>
        <div className="dojang-step verify">
          <span className="dojang-no">3</span>
          <b>티켓 거래 규칙 적용</b>
          <small>인증된 지갑만 예매하고 정가 이하로 양도</small>
        </div>
      </div>

      <div className="policy-band">
        <span className="policy-icon"><IconShield /></span>
        <div>
          <strong>GIWA Chain × Dojang으로 신원이 보장된 티켓 시장을 만듭니다.</strong>
          <p>인증 자격에 구매 제한과 정가 상한을 결합해 암표 거래를 구조적으로 막습니다.</p>
        </div>
        <span className="policy-result">암표상과 진짜 팬을 구분하는 기반<br /><b>신뢰할 수 있는 팬 거래</b></span>
      </div>
    </Slide>
  )
}

function DemoPreview({ src, index, icon, title, description }) {
  return (
    <article className="demo-preview">
      <div className="demo-media">
        <div className="demo-fallback">
          <span className="demo-fallback-index">GIF {index}</span>
          <span className="demo-fallback-icon">{icon}</span>
          <small>{title}</small>
        </div>
        <img src={src} alt={`${title} 기능 시연`} onError={(event) => { event.currentTarget.hidden = true }} />
      </div>
      <div className="demo-copy">
        <span className="demo-icon">{icon}</span>
        <div><strong>{title}</strong><p>{description}</p></div>
      </div>
    </article>
  )
}

/* ── 슬라이드 5 — 제품 데모 ───────────────────────────────────── */
function SlideDemo({ active }) {
  return (
    <Slide active={active} className="s-demo">
      <span className="d-kicker"><Seam /> 그래서 직관은 이렇게 동작합니다</span>
      <h1 className="demo-title">팬에게는 익숙한 예매 경험,<br /><span className="d-hl">규칙은 보이지 않게 온체인으로.</span></h1>
      <div className="demo-grid">
        <DemoPreview
          index="01"
          src="/assets/demo-booking.gif"
          icon={<IconShield />}
          title="티켓 NFT 구매"
          description="구단이 발행한 티켓을 인증된 사용자가 구매"
        />
        <DemoPreview
          index="02"
          src="/assets/demo-transfer.gif"
          icon={<IconTag />}
          title="정가 이하 양도"
          description="인증된 사용자끼리 NFT 티켓을 안전하게 거래"
        />
        <DemoPreview
          index="03"
          src="/assets/demo-entry.gif"
          icon={<IconQR />}
          title="QR로 입장"
          description="NFT로 보관된 티켓의 QR로 경기장 입장"
        />
      </div>
      <p className="demo-foot">
        모든 기능은 GIWA 테스트넷에 배포되어 있습니다. <b>직관 홈페이지에서 지갑을 연결해 직접 경험해보세요.</b>
      </p>
    </Slide>
  )
}

/* ── 슬라이드 6 — 경험 → 창발 → 직관 ─────────────────────────── */
function SlideThesis({ active }) {
  const scatter = [
    { top: 8, left: 20 }, { top: 70, left: 6 }, { top: 30, left: 60 }, { top: 95, left: 44 },
    { top: 50, left: 30 }, { top: 14, left: 92 }, { top: 78, left: 78 }, { top: 105, left: 14 },
    { top: 44, left: 100 }, { top: 90, left: 110 },
  ]
  const merge = [
    { top: 40, left: 52 }, { top: 55, left: 70 }, { top: 70, left: 50 }, { top: 52, left: 38 },
    { top: 35, left: 66 }, { top: 72, left: 70 }, { top: 58, left: 56 },
  ]
  return (
    <Slide active={active} className="s-thesis">
      <div className="thesis-top">
        <span className="d-kicker"><Seam /> 이 해커톤이 남긴 진짜 이야기</span>
        <h2 className="d-h2">
          이 문제를 풀게 한 것은 <span className="d-hl">AI 지식</span>보다,<br />
          현실에서 <span className="d-hl-gold">보고 듣고 경험한 것</span>이었습니다.
        </h2>
      </div>

      <div className="arc">
        <div className="arc-stage">
          <div className="arc-visual">
            <div className="dots-scatter">
              {scatter.map((d, i) => <i key={i} style={{ top: d.top, left: d.left }} />)}
            </div>
          </div>
          <div className="arc-tt">경험<small>흩어진 시도들</small></div>
        </div>

        <span className="arc-arrow">→</span>

        <div className="arc-stage">
          <div className="arc-visual">
            <div className="dots-merge">
              <span className="ring" />
              {merge.map((d, i) => <i key={i} style={{ top: d.top, left: d.left }} />)}
            </div>
          </div>
          <div className="arc-tt">창발<small>Emergence · 뭉쳐 솟다</small></div>
        </div>

        <span className="arc-arrow">→</span>

        <div className="arc-stage">
          <div className="arc-visual">
            <div className="intuition-core">直觀</div>
          </div>
          <div className="arc-tt">직관<small>Intuition · 문제를 꿰뚫다</small></div>
        </div>
      </div>

      <p className="thesis-foot">
        경험이 연결되며 창발한 직관으로 문제를 발견하고,<br />
        <span className="d-hl">분명한 의도</span>로 AI가 나아갈 방향을 제시했습니다.
      </p>
    </Slide>
  )
}

/* ── 슬라이드 7 — 클로징 / 폐곡선 ────────────────────────────── */
function SlideClose({ active }) {
  return (
    <Slide active={active} className="s-close">
      <div className="close-loop">
        <span className="grp">
          <span className="step on">의도</span>
          <span className="grp-tag">Intention</span>
        </span>
        <span className="sep">／</span>
        <span className="grp">
          <span className="step">경험</span>
          <span className="ar">→</span>
          <span className="step">창발</span>
          <span className="ar">→</span>
          <span className="step on">직관</span>
        </span>
      </div>

      <h1 className="close-h">
        <span className="d-hl-gold">직관</span>(直觀, intuition)으로 만든<br />
        <span className="big"><span className="d-hl">직관</span>(直觀, JIKGWAN)</span>
      </h1>

      <p className="close-sub">
        <b>Web3는 아직 많은 사람에게 낯섭니다.</b><br />
        그래서 Web3가 나아갈 길은 기술을 설명하는 것이 아니라,<br />
        <b>현실의 문제를 해결하는 유저 친화적 서비스</b>를 만드는 것이라 생각합니다.
      </p>

      <div className="close-cta">
        검증된 팬만, 정가 그대로 — 직관<em> JIKGWAN</em>
      </div>
      <p className="close-foot">GIWA Sepolia · Dojang · On-chain Ticketing</p>
    </Slide>
  )
}

const SLIDES = [SlideIntent, SlideProblem, SlideTitle, SlideSolution, SlideDemo, SlideThesis, SlideClose]

/* ── 덱 셸: 스케일링 + 네비게이션 ───────────────────────────── */
export default function Presentation() {
  const [index, setIndex] = useState(() => {
    const requested = Number(new URLSearchParams(window.location.search).get('slide'))
    return Number.isInteger(requested) && requested > 0
      ? Math.min(requested - 1, SLIDES.length - 1)
      : 0
  })
  const [scale, setScale] = useState(1)
  const total = SLIDES.length

  const go = useCallback((next) => {
    setIndex((cur) => Math.max(0, Math.min(total - 1, typeof next === 'function' ? next(cur) : next)))
  }, [total])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault(); go((c) => c + 1)
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault(); go((c) => c - 1)
      } else if (e.key === 'Home') { go(0) }
      else if (e.key === 'End') { go(total - 1) }
      else if (e.key === 'f' || e.key === 'F') {
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

  useEffect(() => { document.title = '직관 JIKGWAN · 발표' }, [])

  return (
    <div className="deck-root">
      <div className="deck-stage" style={{ transform: `scale(${scale})` }}>
        {SLIDES.map((SlideComp, i) => <SlideComp key={i} active={i === index} />)}

        {/* 상단/하단 크롬 */}
        <div className="deck-chrome">
          <div className="deck-brand">
            <span className="bm"><BrandMark /></span>
            <span className="bw">직관<em>JIKGWAN</em></span>
          </div>
          <div className="deck-dots">
            {SLIDES.map((_, i) => (
              <i key={i} className={i === index ? 'on' : ''} onClick={() => go(i)} role="button" aria-label={`슬라이드 ${i + 1}`} />
            ))}
          </div>
          <div className="deck-count"><b>{String(index + 1).padStart(2, '0')}</b> / {String(total).padStart(2, '0')}</div>
          <div className="deck-hint"><kbd>←</kbd><kbd>→</kbd> 이동 · <kbd>F</kbd> 전체화면</div>
        </div>

        <div className="deck-progress" style={{ width: `${((index + 1) / total) * 100}%` }} />
      </div>

      {/* 클릭 네비 (양옆 가장자리) */}
      <div className="deck-nav-zone prev" onClick={() => go((c) => c - 1)} />
      <div className="deck-nav-zone next" onClick={() => go((c) => c + 1)} />
    </div>
  )
}
