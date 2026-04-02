// server/index.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// OpenAI 인스턴스 초기화 (.env 파일에 OPENAI_API_KEY 설정 필수)
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// ==========================================
// [기본 라우트] 서버 헬스 체크
// ==========================================
app.get('/', (req, res) => {
    res.send('VitaSolver API Server is running!');
});

// ==========================================
// [API 1] 동적 크롤링 + AI 1줄 요약 (약사몰 타겟팅)
// ==========================================
app.get('/api/recommend-live', async (req, res) => {
    const targetUrl = req.query.url;

    // 프론트엔드에서 URL 파라미터를 넘기지 않았을 경우의 예외 처리
    if (!targetUrl) {
        return res.status(400).json({ success: false, message: "크롤링할 URL 주소가 필요합니다." });
    }

    try {
        // 1. 타겟 웹사이트 크롤링 (차단 방지를 위해 User-Agent 헤더 추가)
        const { data: html } = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const $ = cheerio.load(html);

        // 2. 약사몰 및 일반 쇼핑몰 대응 범용 셀렉터
        // (meta 태그의 og:title, og:description을 우선적으로 찾고 없으면 타이틀이나 본문을 긁어옴)
        const productName = $('meta[property="og:title"]').attr('content')
            || $('h2.goods_name').text().trim()
            || $('title').text().trim();

        const productDesc = $('meta[property="og:description"]').attr('content')
            || $('.goods_description').text().trim()
            || $('.goods_detail_content').text().trim()
            || '상세 설명 정보가 부족합니다.';

        // 3. AI에게 크롤링된 텍스트 전달 및 분석 요청
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini", // 요약 작업이므로 빠르고 저렴한 모델 사용
            messages: [
                {
                    role: "system",
                    content: "너는가족 영양제 AI 컨설턴트 '비타솔버'야."
                },
                {
                    role: "user",
                    content: `방금 웹에서 크롤링한 영양제 정보야.\n[상품명: ${productName}]\n[설명: ${productDesc.substring(0, 800)}]\n이 데이터를 바탕으로 육아와 업무로 지친 39세 워킹맘에게 이 제품이 왜 좋은지 핵심만 1~2문장으로 매력적으로 요약해줘.`
                }
            ],
        });

        res.json({
            success: true,
            data: {
                name: productName,
                analysis: completion.choices[0].message.content,
                sourceUrl: targetUrl
            }
        });

    } catch (error) {
        console.error("Crawling/AI Error:", error.message);
        // 보안이 강력한 사이트(올리브영 등)에서 막혔을 때의 우아한 에러 핸들링
        res.status(500).json({
            success: false,
            message: '해당 사이트는 보안 정책으로 인해 실시간 수집이 제한되었습니다. (약사몰 등 오픈된 상세 페이지만 지원합니다.)'
        });
    }
});

// ==========================================
// [API 2] 비타솔버 메인 로직 (자동 조합 추천 & 수동 선택 컨설팅)
// ==========================================
app.post('/api/solve', async (req, res) => {
    try {
        const { mode, familyProfiles, supplementsPool, manualData } = req.body;

        let systemPrompt = "";
        let userPrompt = "";

        // [모드 A] 프론트엔드에서 수동 선택 중 초과/결핍 경고가 떴을 때 해결책 요청
        if (mode === 'manual_check') {
            systemPrompt = `
        너는 영양학 전문 AI 컨설턴트 '비타솔버'야. 
        사용자가 선택한 영양제 조합에서 영양소(비타민, 무기질 등) 상한선 초과 또는 부족 문제가 발생했어.
        문제 상황을 분석하고, 사용자가 입력한 영양제 풀(Pool) 내에 있는 다른 제품으로 교체하거나 빼는 방식의 명확한 해결책을 1~2문장으로 제안해줘.
        응답은 반드시 아래 JSON 포맷으로 해줘:
        { "advice": "컨설팅 내용" }
      `;
            userPrompt = `
        대상자: ${JSON.stringify(manualData.member)}
        현재 선택한 영양제: ${JSON.stringify(manualData.selectedItems)}
        발생한 문제(프론트엔드 계산 결과): ${manualData.issue}
        대체 가능한 영양제 풀: ${JSON.stringify(supplementsPool)}
      `;
        }
        // [모드 B] 처음부터 가족 전체의 최적 조합을 알아서 짜달라고 요청할 때 (Auto)
        else {
            systemPrompt = `
  너는 개인 맞춤형 영양제 조합 최적화 AI '비타솔버'야.
  제공된 대상자 프로필(연령, 성별, 체중 등)과 영양제 풀을 바탕으로, 최적의 영양제 콤비네이션 2가지를 제안해.

  [핵심 지시사항]
  0. Title 규칙: 반드시 닉네임을 포함하여 제공하도록 해.
  1. 성분 합산 및 정량화: 제안하는 조합 내 영양제들의 동일 성분을 정확히 합산하여 총 섭취량(current)을 계산해. 각 영양제당 성분 또한 개별 명시 해야해.
  2. 기준치 산출: 대상자의 연령, 성별 등을 감안하여 보건복지부 등 공신력 있는 기관의 기준에 따른 해당 영양소의 권장 섭취량(rda)과 상한 섭취량(max)을 산출해.
  3. 안전 최우선: 총 섭취량(current)은 가급적 권장량(rda)을 충족하되, 절대로 상한 섭취량(max)을 초과해서는 안 돼.\
  3-1. 성분은 상한을 넘지 않는다면 2개 이상 조합해도 돼. 필요한 종류는 알아서 유연하게 도르되, 결과를 출력하기 전에 스스로 다시 Chain of Thought를 시행해.
  4. 개별화 원칙: 가족 간 제품을 '함께 공유'한다는 내용은 배제하고, 철저히 해당 조합을 섭취할 개인 1명의 상황과 건강 상태에만 집중해. 
  4-1. 누락 제한: 등록된 가족 구성원 1인당 최소 1개의 조합을 추천해줘야해.
  5. 범위 제한: 이너뷰티, 저속노화, 다이어트 보조제 등은 배제하고 기초영양제(Vit A, Vit B, Vit C, Vit D, Vit E, Vit K, Mg, Ca, Zn, Fe) 10가지에 한정하여 분석해.
  6. 가이드 제공: 각 조합의 장단점(트레이드오프)을 설명하고, 체내 흡수율을 극대화할 수 있는 '복용법 가이드(식전/식후, 시간대 등)'를 작성해.
  7. 상대적으로 부족한 영양소를 명확히 짚어줘야해.

  응답은 반드시 아래 JSON 포맷으로만 해줘: (일반적으로 개수 등의 제한은 없으니 유연하게 조합하기를 바라. 그대신 10가지 영양소는 모두 포함하도록 해.)
  {
    "combinations": [
      {
        "title": "39세 워킹맘을 위한 활력 및 뼈 건강 조합",
        "description": "잦은 야근과 육아로 지친 일상을 고려해 활력 증진과 칼슘 보충에 초점을 맞춘 조합입니다.",
        "items": [
          { "name": "영양제A", "provides": "Vit A 500µg, Vit C 500mg" },
          { "name": "영양제C", "provides": "Mg 150mg, Ca 300mg" }
        ],
        "nutrients": [
          { "name": "Vit A", "current": 800, "rda": 700, "max": 3000, "unit": "µg" },
          { "name": "Vit B", "current": 20, "rda": 15, "max": 100, "unit": "mg" },
          { "name": "Vit C", "current": 1500, "rda": 100, "max": 2000, "unit": "mg" },
          { "name": "Vit D", "current": 2500, "rda": 400, "max": 4000, "unit": "IU" },
          { "name": "Vit E", "current": 15, "rda": 12, "max": 540, "unit": "mg" },
          { "name": "Vit K", "current": 70, "rda": 65, "max": 1000, "unit": "µg" },
          { "name": "Mg", "current": 350, "rda": 320, "max": 350, "unit": "mg" },
          { "name": "Ca", "current": 800, "rda": 1000, "max": 2500, "unit": "mg" },
          { "name": "Zn", "current": 12, "rda": 8, "max": 35, "unit": "mg" },
          { "name": "Fe", "current": 18, "rda": 14, "max": 45, "unit": "mg" }
        ],
        "lackingNutrients": "현재 조합에서는 칼슘이 권장량 대비 200mg 부족하며, 평소 식단으로 보충이 어렵다면 철분 보충이 추가로 필요할 수 있습니다.",
        "intakeGuide": "영양제A는 활력 증진을 위해 아침 식후에, 영양제C는 수면 안정화를 위해 저녁 식후에 복용하는 것을 권장합니다.",
        "warnings": ["Vit C 함량이 높아 공복 섭취 시 위장 장애가 있을 수 있으니 반드시 식후에 드세요."]
      }
    ]
  }
`;
            userPrompt = `가족 프로필: ${JSON.stringify(familyProfiles)}\n영양제 풀: ${JSON.stringify(supplementsPool)}`;
        }

        // AI 추론 실행 (JSON 응답 강제)
        const completion = await openai.chat.completions.create({
            model: "gpt-4o", // 복잡한 제약조건 추론 및 조합 생성을 위해 4o 모델 사용
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
        });

        const result = JSON.parse(completion.choices[0].message.content);
        res.json({ success: true, data: result });

    } catch (error) {
        console.error("VitaSolver Agent Error:", error);
        res.status(500).json({ success: false, message: "AI 컨설팅 중 오류가 발생했습니다." });
    }
});

// 서버 실행
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});