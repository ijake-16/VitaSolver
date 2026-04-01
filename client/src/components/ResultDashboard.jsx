import React from 'react';

export default function ResultDashboard({ result, onReset }) {
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
            <div className="result-card-header" style={{flexDirection: 'column', alignItems: 'flex-start', gap: '8px'}}>
              <h3 className="member-name text-gradient" style={{fontSize: '1.2rem', marginBottom: '4px', textAlign: 'left'}}>
                {combo.title}
              </h3>
              <p style={{fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'left', lineHeight: '1.4'}}>{combo.description}</p>
            </div>
            
            <div className="divider" style={{margin: '12px 0'}}></div>
            
            <div className="supplement-tags" style={{marginBottom: '12px'}}>
              {combo.items.map((sup, sIdx) => (
                <span key={sIdx} className="tag">{sup}</span>
              ))}
            </div>
            
            <div className="intake-guide" style={{fontSize: '0.9rem', marginBottom: '8px', textAlign: 'left', lineHeight: '1.5'}}>
              <strong>📝 복용 가이드: </strong> {combo.intakeGuide}
            </div>

            {combo.warnings && combo.warnings.length > 0 && (
              <div className="warning-box mt-3" style={{alignItems: 'flex-start'}}>
                <span className="icon">⚠️</span> 
                <ul style={{marginLeft: '20px', padding: 0, fontSize: '0.85rem', textAlign: 'left', lineHeight: '1.5'}}>
                  {combo.warnings.map((w, wIdx) => <li key={wIdx}>{w}</li>)}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      <button onClick={onReset} className="btn-secondary w-full mt-8">처음부터 다시하기</button>
    </div>
  );
}
