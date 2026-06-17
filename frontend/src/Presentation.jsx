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

/* ── 슬라이드 1 — 타이틀 / 직관 더블 미닝 ─────────────────────── */
function SlideTitle({ active }) {
  return (
    <Slide active={active} className="s-title">
      <div className="wordmark">
        직관
        <span className="hanja">直觀</span>
      </div>
      <div className="latin">JIKGWAN</div>

      <div className="dual">
        <div className="cell">
          <span className="ko">직접 관람 <small>直觀</small></span>
          <span className="en">경기장에서 직접 보는 일</span>
        </div>
        <div className="cell">
          <span className="ko">직관 <small>直觀</small></span>
          <span className="en">Intuition · 본질을 꿰뚫는 통찰</span>
        </div>
      </div>

      <p className="tagline"><b>검증된 팬만, 정가 그대로.</b> &nbsp;GIWA 블록체인 기반 KBO 검증 티켓</p>
    </Slide>
  )
}

/* ── 슬라이드 2 — 문제 (암표) ─────────────────────────────────── */
function SlideProblem({ active }) {
  return (
    <Slide active={active}>
      <span className="d-kicker"><Seam /> 우리가 풀려는 <b>현실의 문제</b></span>
      <div className="s-grid">
        <div className="s-head">
          <h1 className="d-h1">프로야구는 뜨거워졌고,<br /><span className="d-hl">암표상</span>은 더 기승을 부립니다.</h1>
          <div className="stat-row">
            <div className="stat-card">
              <div className="num">11<span>배</span></div>
              <div className="cap">프로스포츠 암표 신고<br />2020 → 2025</div>
            </div>
            <div className="stat-card gold">
              <div className="num">2.56<span>배</span></div>
              <div className="cap">프로스포츠 티켓<br />정가 대비 거래가</div>
            </div>
            <div className="stat-card blue">
              <div className="num">6.3<span>%</span></div>
              <div className="cap">신고 중 실제<br />단속으로 이어진 비율</div>
            </div>
          </div>
          <p className="source-tag">
            출처 · 국회도서관 「Data &amp; Law」, 문체부 추산 — <a>청년일보 보도(2025)</a>
          </p>
        </div>

        <div className="price-viz">
          <div className="pv-title">⚾ 정가 vs 암표가</div>
          <div className="bar-block">
            <div className="bar-row">
              <span className="bar-label">정가</span>
              <div className="bar-track"><div className="bar-fill face">100%</div></div>
            </div>
            <div className="bar-row">
              <span className="bar-label">암표가</span>
              <div className="bar-track"><div className="bar-fill scalp">256%</div></div>
            </div>
          </div>
          <p className="pv-foot">경찰 적발 의심 거래 <b>262,381건</b> — 그러나 막을 방법은 없었습니다.</p>
        </div>
      </div>
      <p className="punch">기술적으로 막을 수 있는데, <span className="d-hl">아무도 시도하지 않았습니다.</span></p>
    </Slide>
  )
}

/* ── 슬라이드 3 — 의도 (Intention) ───────────────────────────── */
function SlideIntent({ active }) {
  return (
    <Slide active={active} className="s-center">
      <span className="d-kicker"><Seam /> 만드는 출발점</span>
      <p className="intent-quote" style={{ marginTop: 26 }}>
        AI가 모든 걸 실행해 주는 시대,<br />
        인간에게 남는 건 <span className="mark">의도(Intention)</span> 입니다.
      </p>

      <div className="intent-flow">
        <div className="intent-node gold">
          <span className="ic">🎯</span>
          <span className="tt">의도</span>
          <span className="ds">진짜 팬에게만 표를</span>
        </div>
        <span className="intent-arrow">→</span>
        <div className="intent-node">
          <span className="ic">🤖</span>
          <span className="tt">AI 실행</span>
          <span className="ds">설계 · 코드 · 컨트랙트</span>
        </div>
        <span className="intent-arrow">→</span>
        <div className="intent-node accent">
          <span className="ic">⚾</span>
          <span className="tt">직관 JIKGWAN</span>
          <span className="ds">동작하는 프로토타입</span>
        </div>
      </div>

      <p className="intent-sub">
        저는 <b>풀고 싶은 문제와 의도</b> 하나만 들고, 나머지는 전적으로 AI에 맡겼습니다.<br />
        그 과정에서 <b>블록체인으로 서비스를 만드는 법</b>, 그리고 PII 노출 없이 온체인 신원을 갖는
        <b> GIWA Dojang</b>까지 — 빠르게 만들며 빠르게 배웠습니다.
      </p>
    </Slide>
  )
}

/* ── 슬라이드 4 — 솔루션 / 4기둥 ─────────────────────────────── */
function SlideSolution({ active }) {
  const pillars = [
    { no: '01', accent: '#ff5a4e', icon: <IconShield />, tt: '검증된 팬', ds: 'GIWA Dojang으로 인증된 지갑만 예매·양도. PII는 체인에 올리지 않습니다.', tag: 'OnchainVerifier' },
    { no: '02', accent: '#4f9bff', icon: <IconNFT />, tt: '온체인 NFT 티켓', ds: '좌석은 NFT로 발급. 소유권·사용 상태가 투명하게 기록됩니다.', tag: 'BaseballTicketNFT' },
    { no: '03', accent: '#e9b949', icon: <IconTag />, tt: '정가 이하 양도', ds: '정가를 넘는 가격은 컨트랙트가 거부. 암표와 부정 거래를 차단합니다.', tag: 'TransferMarket' },
    { no: '04', accent: '#36d27a', icon: <IconQR />, tt: 'Live QR 입장', ds: '현재 소유자에게만 실시간 QR. 캡처·재사용 입장까지 막습니다.', tag: 'GateVerifier' },
  ]
  return (
    <Slide active={active}>
      <span className="d-kicker"><Seam /> 해결책 — <b>직관 JIKGWAN</b></span>
      <h1 className="d-h1" style={{ marginTop: 14 }}>검증된 팬을 위한 <span className="d-hl">안전한 직관 경험</span></h1>
      <p className="solu-def">
        <b>GIWA Dojang으로 검증된 팬</b>만 KBO 티켓을 예매·양도하고,
        모든 좌석은 <b>온체인 NFT 티켓</b>으로 발급되는 블록체인 티켓 플랫폼.
      </p>
      <div className="pillars">
        {pillars.map((p) => (
          <div className="pillar" key={p.no} style={{ '--accent': p.accent }}>
            <span className="p-no">{p.no}</span>
            <span className="p-ic">{p.icon}</span>
            <span className="p-tt">{p.tt}</span>
            <span className="p-ds">{p.ds}</span>
            <span className="p-tag">{p.tag}</span>
          </div>
        ))}
      </div>
    </Slide>
  )
}

/* ── 슬라이드 5 — 작동 원리 / 플로우 + Dojang ────────────────── */
function SlideHow({ active }) {
  const steps = [
    { no: '1', tt: 'Dojang 인증', ds: '지갑이 검증된 팬인지 온체인 조회', code: 'isVerified()' },
    { no: '2', tt: '예매 · 발권', ds: '정가 결제 → NFT 티켓 민팅', code: 'purchase()' },
    { no: '3', tt: '정가 이하 양도', ds: '검증 지갑 + 정가 이하만 통과', code: 'list / buy()' },
    { no: '4', tt: '현장 입장', ds: '소유자 전용 Live QR 검증', code: 'redeem()' },
  ]
  return (
    <Slide active={active}>
      <span className="d-kicker"><Seam /> 어떻게 동작하나</span>
      <h1 className="d-h1" style={{ marginTop: 14 }}>예매부터 입장까지, <span className="d-hl-blue">전 과정 온체인</span></h1>
      <div className="flow-wrap">
        <div className="flow-line">
          {steps.map((s, i) => (
            <div key={s.no}>
              <div className="flow-step">
                <span className="fs-no">{s.no}</span>
                <span className="fs-body">
                  <span className="fs-tt">{s.tt}</span>
                  <span className="fs-ds">{s.ds}</span>
                </span>
                <span className="fs-code">{s.code}</span>
              </div>
              {i < steps.length - 1 && <div className="flow-connector" />}
            </div>
          ))}
        </div>

        <div className="dojang-card">
          <span className="dc-badge">◆ GIWA Dojang</span>
          <span className="dc-tt">PII 없이, 온체인 신원</span>
          <span className="dc-ds">
            주민번호·실명 같은 <b>개인 식별 정보를 지갑에 노출하지 않고도</b>
            “검증된 사람”임을 온체인에서 증명하는 GIWA 생태계의 신원 서비스.
          </span>
          <div className="dc-list">
            <span className="dc-item"><span className="ck"><IconCheck size={16} /></span> 검증은 온체인, 개인정보는 오프체인</span>
            <span className="dc-item"><span className="ck"><IconCheck size={16} /></span> 1인 = 1 검증 지갑 → 대량 매집 차단</span>
          </div>
          <div className="dc-pii">🔒 개인정보 노출 0 · 신뢰는 그대로</div>
        </div>
      </div>
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
          무언가를 <span className="d-hl">만드는 비용</span>은 0에 수렴합니다.<br />
          그래서 사람은 <span className="d-hl-gold">경험</span>해야 합니다.
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
        많은 경험이 뭉쳐 <span className="d-hl">창발</span>이 일어나고,
        그 끝에서 <span className="d-hl">직관</span>이 궁극의 문제를 풉니다.
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
        AI가 실행하는 시대, <b>인간에게 남는 건 의도(Intention)</b>.<br />
        그리고 <b>축적된 경험이 직관</b>이 되고, 그 직관이 현실의 문제를 풉니다.<br />
        기술 자체에 머무르지 않고, <b>현실의 문제를 푸는 유저 친화적 서비스</b>로<br />
        확산되는 데 기여하고 싶습니다.
      </p>

      <div className="close-cta">
        검증된 팬만, 정가 그대로 — 직관<em> JIKGWAN</em>
      </div>
      <p className="close-foot">GIWA Sepolia · Dojang · On-chain Ticketing</p>
    </Slide>
  )
}

const SLIDES = [SlideTitle, SlideProblem, SlideIntent, SlideSolution, SlideHow, SlideThesis, SlideClose]

/* ── 덱 셸: 스케일링 + 네비게이션 ───────────────────────────── */
export default function Presentation() {
  const [index, setIndex] = useState(0)
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
