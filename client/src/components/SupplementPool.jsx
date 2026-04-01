import React, { useState } from 'react';

export default function SupplementPool({ pool, setPool }) {
  const [url, setUrl] = useState('https://www.yakssamall.com/31/?idx=1134');
  const [isLoading, setIsLoading] = useState(false);



  const removeSupplement = (id) => {
    setPool(pool.filter(p => p.id !== id));
  };

  const mockCrawl = async (e) => {
    e.preventDefault();
    if (!url) return;
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/recommend-live?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      if (data.success && data.data) {
        setPool([...pool, {
          id: Date.now(),
          name: data.data.name,
          detail: data.data.analysis
        }]);
        setUrl(''); // url 비워주기
      } else {
        alert(data.message || '크롤링 실패');
      }
    } catch (error) {
      console.error(error);
      alert('서버 오류 발생');
    } finally {
      setIsLoading(false);
    }
  };

  const presets = [
    { id: 'p1', name: 'Vitamin D (1)', url: 'https://www.yakssamall.com/31/?idx=1134' },
    { id: 'p2', name: 'Vitamin D (2)', url: 'https://www.yakssamall.com/31/?idx=1130' },
    { id: 'p3', name: 'Multivitamin (1)', url: 'https://www.yakssamall.com/291/?idx=1207' },
    { id: 'p4', name: 'Magnesium (1)', url: 'https://www.yakssamall.com/37/?idx=1228' },
    { id: 'p5', name: 'Magnesium (2)', url: 'https://www.yakssamall.com/37/?idx=1197' },
  ];

  return (
    <div className="step-container slide-in">
      <h2 className="step-title">Step 2. 영양제 담기</h2>
      <p className="step-desc">분석할 영양제를 링크로 추가하거나 직접 등록하세요.</p>

      <form onSubmit={mockCrawl} className="glass-form row-form" style={{ padding: '8px', gap: '6px' }}>
        <input
          type="text"
          placeholder="온라인 쇼핑몰 링크 입력..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1"
          style={{ fontSize: '0.8rem', padding: '10px 8px' }}
        />
        <button type="submit" className="btn-primary" style={{ padding: '10px 14px' }} disabled={isLoading} title="영양제 정보 가져오기">
          {isLoading ? <span className="spinner" style={{ width: '16px', height: '16px' }}></span> : '🔍'}
        </button>
      </form>

      <div className="presets mt-4">
        <h4>예시 링크 (심사 편리용)</h4>
        <div className="preset-chips">
          {presets.map(preset => (
            <button
              key={preset.id}
              type="button"
              className="chip"
              onClick={() => setUrl(preset.url)}
            >
              🔗 {preset.name}
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
