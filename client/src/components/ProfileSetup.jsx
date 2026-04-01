import React, { useState } from 'react';

export default function ProfileSetup({ profiles, setProfiles }) {
  const [role, setRole] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [gender, setGender] = useState('female');

  const addProfile = (e) => {
    e.preventDefault();
    if (!role || !age) return;
    setProfiles([...profiles, { id: Date.now(), role, age: Number(age), weight: weight ? Number(weight) : null, gender }]);
    setRole('');
    setAge('');
    setWeight('');
  };

  const removeProfile = (id) => {
    setProfiles(profiles.filter(p => p.id !== id));
  };

  return (
    <div className="step-container slide-in">
      <h2 className="step-title">Step 1. 가족 프로필</h2>
      <p className="step-desc">비타민을 추천받을 가족 구성원을 등록해주세요.</p>

      <form onSubmit={addProfile} className="glass-form">
        <div className="input-group">
          <label>닉네임</label>
          <input
            type="text"
            placeholder="닉네임 입력"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
        </div>
        <div className="input-row">
          <div className="input-group">
            <label>나이</label>
            <input
              type="number"
              placeholder="나이"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label>체중(kg)</label>
            <input
              type="number"
              placeholder="체중"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label>성별</label>
            <select value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="female">여성</option>
              <option value="male">남성</option>
            </select>
          </div>
        </div>
        <button type="submit" className="btn-primary w-full mt-3">추가하기</button>
      </form>

      <div className="profile-list mt-6">
        <h3>등록된 가족 (총 {profiles.length}명)</h3>
        {profiles.length === 0 ? (
          <p className="empty-state">아직 등록된 구성원이 없습니다.</p>
        ) : (
          <ul className="card-list">
            {profiles.map(p => (
              <li key={p.id} className="card-item glass-card slide-in">
                <div className="card-info">
                  <span className="avatar">{p.role[0] || '👨‍👩‍👧'}</span>
                  <div>
                    <strong>{p.role}</strong>
                    <span className="badge">{p.age}세, {p.weight ? `${p.weight}kg, ` : ''}{p.gender === 'female' ? '여성' : '남성'}</span>
                  </div>
                </div>
                <button type="button" className="btn-icon text-red" onClick={() => removeProfile(p.id)}>×</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
