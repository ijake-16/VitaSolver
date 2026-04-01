import { useState } from 'react';
import ProfileSetup from './components/ProfileSetup';
import SupplementPool from './components/SupplementPool';
import ResultDashboard from './components/ResultDashboard';
import './App.css';

function App() {
  // 1. 글로벌 상태 관리
  const [step, setStep] = useState(1);
  const [familyProfiles, setFamilyProfiles] = useState([]);
  const [supplementsPool, setSupplementsPool] = useState([]);
  const [aiResult, setAiResult] = useState(null);
  const [isSolving, setIsSolving] = useState(false);

  // 2. 스텝 이동 핸들러
  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);
  const resetApp = () => {
    setStep(1);
    setFamilyProfiles([]);
    setSupplementsPool([]);
    setAiResult(null);
  };

  const startAnalysis = async () => {
    setIsSolving(true);
    // Mock network request delay
    await new Promise(res => setTimeout(res, 1500));
    setAiResult({ success: true, dummy: true }); // Real implementation will fetch from backend
    setIsSolving(false);
    nextStep();
  };

  // 3. 렌더링 함수
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <ProfileSetup profiles={familyProfiles} setProfiles={setFamilyProfiles} />
            <div className="btn-group">
              <button 
                onClick={nextStep} 
                className="btn-primary w-full"
                disabled={familyProfiles.length === 0}
              >
                다음: 영양제 선택하기 {familyProfiles.length > 0 && `(${familyProfiles.length}명)`}
              </button>
            </div>
          </>
        );
      case 2:
        return (
          <>
            <SupplementPool pool={supplementsPool} setPool={setSupplementsPool} />
            <div className="btn-group">
              <button onClick={prevStep} className="btn-secondary w-full">뒤로</button>
              <button 
                onClick={startAnalysis} 
                className="btn-primary w-full"
                disabled={isSolving || supplementsPool.length === 0}
              >
                {isSolving ? <span className="spinner"></span> : 'AI 맞춤 분석 시작'}
              </button>
            </div>
          </>
        );
      case 3:
        return (
          <ResultDashboard result={aiResult} onReset={resetApp} />
        );
      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      <header className="app-header slide-in">
        <h1 className="app-title text-gradient">VitaSolver</h1>
        <p className="app-subtitle">가족을 위한 AI 맞춤 영양제 큐레이션</p>
      </header>

      <div className="progress-container slide-in delay-1">
        <div className={`progress-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>1</div>
        <div className={`progress-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>2</div>
        <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>3</div>
      </div>

      <main className="main-content slide-in delay-2">
        {renderStep()}
      </main>
    </div>
  );
}

export default App;