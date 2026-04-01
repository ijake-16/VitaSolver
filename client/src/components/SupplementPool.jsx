import React, { useState } from 'react';

export default function SupplementPool({ pool, setPool }) {
  const [url, setUrl] = useState('https://www.yakssamall.com/31/?idx=1134');
  const [isLoading, setIsLoading] = useState(false);

  // Mock preset addition
  const addPreset = (preset) => {
    if (!pool.find(p => p.id === preset.id)) {
      setPool([...pool, preset]);
    }
  };

  const removeSupplement = (id) => {
    setPool(pool.filter(p => p.id !== id));
  };

  const mockCrawl = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate network request
    await new Promise(res => setTimeout(res, 1000));
    setPool([...pool, { 
      id: Date.now(), 
      name: '새로 크롤링된 비타민', 
      detail: 'Vitamin C 500mg, Zinc 10mg' 
    }]);
    setIsLoading(false);
  };

  const presets = [
    { id: 'p1', name: '다이소 종합비타민', detail: '비타민C, 아연' },
    { id: 'p2', name: '종근당 비타민D', detail: '비타민D 2000IU' },
    { id: 'p3', name: '키즈 텐텐 마그네슘', detail: '마그네슘, 아연' },
  ];

  return (
    <div className="step-container slide-in">
      <h2 className="step-title">Step 2. 영양제 담기</h2>
      <p className="step-desc">분석할 영양제를 링크로 추가하거나 직접 등록하세요.</p>

      <form onSubmit={mockCrawl} className="glass-form row-form">
        <input 
          type="text" 
          placeholder="온라인 쇼핑몰 링크 입력..." 
          value={url} 
          onChange={(e) => setUrl(e.target.value)} 
          className="flex-1"
        />
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? <span className="spinner"></span> : '가져오기'}
        </button>
      </form>

      <div className="presets mt-4">
        <h4>추천 프리셋</h4>
        <div className="preset-chips">
          {presets.map(preset => (
            <button 
              key={preset.id} 
              type="button" 
              className="chip" 
              onClick={() => addPreset(preset)}
            >
              + {preset.name}
            </button>
          ))}
        </div>
      </div>

      <div className="pool-list mt-6">
        <h3>선택된 영양제 ({pool.length}개)</h3>
        {pool.length === 0 ? (
          <p className="empty-state">선택된 영양제가 없습니다.</p>
        ) : (
          <ul className="card-list">
            {pool.map((p, idx) => (
              <li key={p.id || idx} className="card-item glass-card slide-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className="card-info">
                  <div className="icon-box">💊</div>
                  <div>
                    <strong>{p.name}</strong>
                    <span className="badge muted">{p.detail}</span>
                  </div>
                </div>
                <button type="button" className="btn-icon text-red" onClick={() => removeSupplement(p.id)}>×</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
