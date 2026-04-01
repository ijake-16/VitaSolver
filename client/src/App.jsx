import { useState } from 'react';

function App() {
  // [상태 관리] 크롤링 API용
  const [targetUrl, setTargetUrl] = useState('https://www.yakssamall.com/31/?idx=1134'); // 임시 약사몰 주소
  const [crawlResult, setCrawlResult] = useState(null);
  const [isCrawling, setIsCrawling] = useState(false);

  // [상태 관리] AI 조합 분석 API용
  const [solveResult, setSolveResult] = useState(null);
  const [isSolving, setIsSolving] = useState(false);

  // 1. 크롤링 + AI 요약 테스트 함수
  const testCrawlingAPI = async () => {
    setIsCrawling(true);
    setCrawlResult(null);
    try {
      const response = await fetch(`http://localhost:5000/api/recommend-live?url=${encodeURIComponent(targetUrl)}`);
      const data = await response.json();
      setCrawlResult(data);
    } catch (error) {
      setCrawlResult({ success: false, message: "서버 연결 실패" });
    } finally {
      setIsCrawling(false);
    }
  };

  // 2. 비타솔버 메인 조합 추천 테스트 함수 (모의 데이터 전송)
  const testSolveAPI = async () => {
    setIsSolving(true);
    setSolveResult(null);

    // 서버로 보낼 가짜(Mock) 가족 데이터와 영양제 풀
    const mockPayload = {
      mode: 'auto_combination',
      familyProfiles: [
        { role: '엄마', age: 39, gender: 'female' },
        { role: '딸', age: 8, gender: 'female' }
      ],
      supplementsPool: [
        { name: '다이소 종합비타민', vitaminC: '100mg', zinc: '5mg' },
        { name: '종근당 비타민D', vitaminD: '2000IU' },
        { name: '키즈 텐텐 마그네슘', magnesium: '150mg', zinc: '3mg' }
      ]
    };

    try {
      const response = await fetch('http://localhost:5000/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockPayload)
      });
      const data = await response.json();
      setSolveResult(data);
    } catch (error) {
      setSolveResult({ success: false, message: "서버 연결 실패" });
    } finally {
      setIsSolving(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>💊 VitaSolver API 테스트 패널</h1>
      <hr />

      {/* 1. 크롤링 API 테스트 영역 */}
      <section style={{ marginBottom: '40px' }}>
        <h2>1. 실시간 크롤링 & AI 요약 테스트</h2>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input
            type="text"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            style={{ flex: 1, padding: '8px' }}
          />
          <button onClick={testCrawlingAPI} disabled={isCrawling} style={{ padding: '8px 16px' }}>
            {isCrawling ? '분석 중...' : '크롤링 요청'}
          </button>
        </div>

        {/* 결과 출력창 */}
        <div style={{ backgroundColor: '#f4f4f4', padding: '10px', minHeight: '100px', borderRadius: '4px' }}>
          {crawlResult ? (
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {JSON.stringify(crawlResult, null, 2)}
            </pre>
          ) : (
            <p style={{ color: '#888' }}>결과가 여기에 표시됩니다.</p>
          )}
        </div>
      </section>

      {/* 2. 메인 AI 조합 추천 테스트 영역 */}
      <section>
        <h2>2. 가족 영양제 자동 조합 테스트 (Auto Mode)</h2>
        <p style={{ fontSize: '14px', color: '#666' }}>
          * 하드코딩된 엄마(39세), 딸(8세) 프로필과 3개의 영양제 풀 데이터를 POST로 전송합니다.
        </p>
        <button onClick={testSolveAPI} disabled={isSolving} style={{ padding: '8px 16px', marginBottom: '10px' }}>
          {isSolving ? 'AI 추론 중...' : '조합 추천 요청'}
        </button>

        {/* 결과 출력창 */}
        <div style={{ backgroundColor: '#e9f5ff', padding: '10px', minHeight: '150px', borderRadius: '4px' }}>
          {solveResult ? (
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {JSON.stringify(solveResult, null, 2)}
            </pre>
          ) : (
            <p style={{ color: '#888' }}>JSON 결과가 여기에 표시됩니다.</p>
          )}
        </div>
      </section>
    </div>
  );
}

export default App;