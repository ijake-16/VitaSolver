import React from 'react';

export default function ResultDashboard({ result, onReset }) {
  // 모의 결과 데이터 (실제 result 객체가 없을 때 보여줄 기본값)
  const mockResult = result || {
    summary: "전반적으로 훌륭한 조합이지만, 마그네슘이 약간 부족합니다. 추가 복용을 권장합니다.",
    matches: [
      {
        member: '엄마',
        supplements: ['종근당 비타민D', '다이소 종합비타민'],
        status: 'good',
        score: 95
      },
      {
        member: '딸',
        supplements: ['키즈 텐텐 마그네슘'],
        status: 'warning',
        score: 70
      }
    ]
  };

  return (
    <div className="step-container slide-in">
      <div className="result-header text-center mb-6">
        <div className="sparkle-icon glass-icon mx-auto mb-4">✨</div>
        <h2 className="step-title text-gradient">AI 맞춤 컨설팅 결과</h2>
        <p className="step-desc mt-2">{mockResult.summary}</p>
      </div>

      <div className="result-cards">
        {mockResult.matches.map((match, idx) => (
          <div key={idx} className={`glass-card result-card slide-up delay-${idx + 1}`}>
            <div className="result-card-header">
              <h3 className="member-name">
                <span className="avatar-sm">{match.member[0] || '👤'}</span> 
                {match.member}
              </h3>
              <div className={`score-badge ${match.status}`}>
                {match.score}점
              </div>
            </div>
            
            <div className="divider"></div>
            
            <div className="supplement-tags">
              {match.supplements.map((sup, sIdx) => (
                <span key={sIdx} className="tag">{sup}</span>
              ))}
            </div>
            {match.status === 'warning' && (
              <div className="warning-box mt-3">
                <span className="icon">⚠️</span> 용량 조절이 필요할 수 있습니다.
              </div>
            )}
          </div>
        ))}
      </div>

      <button onClick={onReset} className="btn-secondary w-full mt-8">처음부터 다시하기</button>
    </div>
  );
}
