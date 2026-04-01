import React from 'react';

// 향후 API 연동 시 사용할 임시 게이지 데이터 포맷
const mockNutrients = [
  { name: 'Vit A', current: 800, rda: 700, max: 3000, unit: 'µg' },
  { name: 'Vit B', current: 20, rda: 15, max: 100, unit: 'mg' },
  { name: 'Vit C', current: 1500, rda: 100, max: 2000, unit: 'mg' },
  { name: 'Vit D', current: 2500, rda: 400, max: 4000, unit: 'IU' },
  { name: 'Vit E', current: 15, rda: 12, max: 540, unit: 'mg' },
  { name: 'Vit K', current: 70, rda: 65, max: 1000, unit: 'µg' },
  { name: 'Mg', current: 350, rda: 320, max: 350, unit: 'mg' },
  { name: 'Ca', current: 800, rda: 1000, max: 2500, unit: 'mg' },
  { name: 'Zn', current: 12, rda: 8, max: 35, unit: 'mg' },
  { name: 'Fe', current: 18, rda: 14, max: 45, unit: 'mg' },
];

const NutrientGauge = ({ data }) => {
  if (!data || !data.max || !data.rda) return null;

  // 상대적 위치 지정: RDA = 20%, MAX = 80%
  let currentPercent = 0;
  if (data.current <= data.rda) {
    currentPercent = (data.current / data.rda) * 20;
  } else if (data.current <= data.max) {
    currentPercent = 20 + ((data.current - data.rda) / (data.max - data.rda)) * 60;
  } else {
    // MAX 초과분은 80~100% 사이에 매핑 (MAX의 50% 초과시 100%로 취급)
    const excessRatio = (data.current - data.max) / (data.max * 0.5);
    currentPercent = 80 + Math.min(excessRatio, 1) * 20;
  }

  // 상태별 색상 (권장량 미만: 경고, 상한치 초과: 위험, 적정: 초록)
  let fillColor = 'var(--success)';
  if (data.current > data.max) fillColor = 'var(--danger)';
  else if (data.current < data.rda) fillColor = 'var(--warning)';

  return (
    <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem', marginBottom: '8px', position: 'relative', zIndex: 2 }}>
      <div style={{ width: '45px', fontWeight: '600', color: 'var(--primary)' }}>{data.name}</div>

      <div style={{ flex: 1, height: '10px', background: 'rgba(255,255,255,0.4)', borderRadius: '5px', position: 'relative', margin: '0 10px', border: '1px solid rgba(0,0,0,0.05)' }}>
        {/* 현재 섭취량 채우기 */}
        <div
          style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${currentPercent}%`, background: fillColor, borderRadius: '4px', transition: 'width 1s ease-out' }}
        />
      </div>

      <div style={{ width: '65px', textAlign: 'right', color: 'var(--text-muted)' }}>
        <strong style={{ color: 'var(--text-main)' }}>{data.current}</strong> <span style={{ fontSize: '0.65rem' }}>{data.unit}</span>
      </div>
    </div>
  );
};

export default function ResultDashboard({ result, onReset, onBack }) {
  if (!result || !result.combinations) {
    return (
      <div className="step-container slide-in text-center">
        <h2 className="step-title">결과를 불러올 수 없습니다.</h2>
        <button onClick={onReset} className="btn-secondary mt-4">처음부터 다시하기</button>
      </div>
    );
  }

  return (
    <div className="step-container slide-in">
      <div className="result-header text-center mb-6">
        <div className="sparkle-icon glass-icon mx-auto mb-4">✨</div>
        <h2 className="step-title text-gradient">AI 맞춤 컨설팅 결과</h2>
        <p className="step-desc mt-2">입력하신 프로필과 영양제 풀을 기반으로 분석한 최적의 조합입니다.</p>
      </div>

      <div className="result-cards">
        {result.combinations.map((combo, idx) => (
          <div key={idx} className={`glass-card result-card slide-up delay-${idx + 1}`}>
            <div className="result-card-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
              <h3 className="member-name text-gradient" style={{ fontSize: '1.2rem', marginBottom: '4px', textAlign: 'left' }}>
                {combo.title}
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'left', lineHeight: '1.4' }}>{combo.description}</p>
            </div>

            <div className="divider" style={{ margin: '12px 0' }}></div>

            <div className="supplement-tags" style={{ marginBottom: '12px' }}>
              {combo.items.map((sup, sIdx) => {
                const name = typeof sup === 'string' ? sup : sup.name;
                const provides = typeof sup === 'string' ? '' : sup.provides;
                return (
                  <span 
                    key={sIdx} 
                    className="tag" 
                    title={provides || "상세 성분 정보 없음"}
                    style={{ cursor: provides ? 'help' : 'default' }}
                  >
                    {name}
                  </span>
                );
              })}
            </div>

            {/* 영양소 섭취 게이지 UI */}
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '15px 15px', borderRadius: '12px', marginBottom: '16px', border: '1px solid var(--glass-border)' }}>
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {/* 인덱스 헤더 (상단 라벨) */}
                <div style={{ display: 'flex', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '8px', textAlign: 'center', fontWeight: 'bold' }}>
                  <div style={{ width: '45px', textAlign: 'left' }}>영양소</div>
                  <div style={{ flex: 1, position: 'relative', margin: '0 10px', height: '12px' }}>
                    <span style={{ position: 'absolute', left: '20%', transform: 'translateX(-50%)', color: 'var(--warning)' }}>권장</span>

                    <span style={{ position: 'absolute', left: '80%', transform: 'translateX(-50%)', color: 'rgba(239, 68, 68, 0.8)' }}>상한</span>
                  </div>
                  <div style={{ width: '65px', textAlign: 'right' }}>수치</div>
                </div>

                {/* 전체 높이를 가로지르는 수직 가이드 라인들 (20, 40, 60, 80, 100) */}
                <div style={{ position: 'absolute', top: '15px', bottom: 0, left: '55px', right: '75px', pointerEvents: 'none', zIndex: 1 }}>
                  {[20, 40, 60, 80, 100].map(pct => {
                    // 20%와 80% 선은 더 뚜렷하고 약간의 점선 처리, 나머지는 옅은 실선
                    const isAnchor = pct === 20 || pct === 80;
                    return (
                      <div key={pct} style={{
                        position: 'absolute',
                        left: `${pct}%`,
                        top: 0, bottom: 0,
                        width: '1px',
                        background: isAnchor ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.06)',
                        borderLeft: isAnchor ? (pct === 20 ? '1px dashed rgba(245,158,11,0.5)' : '1px dashed rgba(239,68,68,0.5)') : 'none',
                      }} />
                    )
                  })}
                </div>

                {/* 개별 게이지 바들 (zIndex 2로 선 위에 그려짐) */}
                {(combo.nutrients || mockNutrients).map((nutrient, nIdx) => (
                  <NutrientGauge key={nIdx} data={nutrient} />
                ))}
              </div>
            </div>

            <div className="intake-guide" style={{ fontSize: '0.9rem', marginBottom: '8px', textAlign: 'left', lineHeight: '1.5' }}>
              <strong>📝 복용 가이드: </strong> {combo.intakeGuide}
            </div>

            {combo.warnings && combo.warnings.length > 0 && (
              <div className="warning-box mt-3" style={{ alignItems: 'flex-start' }}>
                <span className="icon">⚠️</span>
                <ul style={{ marginLeft: '20px', padding: 0, fontSize: '0.85rem', textAlign: 'left', lineHeight: '1.5' }}>
                  {combo.warnings.map((w, wIdx) => <li key={wIdx}>{w}</li>)}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="btn-group mt-8">
        <button onClick={onBack} className="btn-primary w-full">영양제 추가/변경하기</button>
        <button onClick={onReset} className="btn-secondary w-full">처음부터 다시하기</button>
      </div>
    </div>
  );
}
