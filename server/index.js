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
                    content: "너는 35~50세 여성을 위한 가족 영양제 AI 컨설턴트 '비타솔버'야."
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
        너는 가족 영양제 조합 최적화 AI '비타솔버'야.
        제공된 가족 프로필과 영양제 풀을 바탕으로, 보건복지부 상한 섭취량(UL)을 절대 넘지 않으면서 권장량(RDA)에 근접하는 최적의 개인 맞춤형 영양제 콤비네이션 2가지를 제안해.
        단, 가족이 특정 제품을 '함께 공유'한다는 내용이나 영양제 제품이 겹친다는 점은 강조하지 마. 클라이언트 처리 간결성을 위해 철저히 각 개인 1명(대상자)의 건강 상태와 상황에만 집중해서 작성해.
        이너뷰티, 저속노화, 다이어트 관련 보조제는 배제하고 오랫동안 정보가 축적된 기초영양제인 비타민(A, B, C, D, E, K 군), 무기질(마그네슘, 아연, 철분, 칼슘), 프로바이오틱스에만 한정해.
        각 조합이 어떤 사람을 위한 것인지, 장단점(가성비, 특정 상황 맞춤 등 트레이드오프)이 무엇인지 반드시 설명해야 해.
        또한, 제안한 영양제들을 언제, 어떻게 복용하는 것이 체내 흡수에 가장 좋은지(식전/식후, 아침/저녁 등) 알려주는 '복용법 가이드'를 "intakeGuide" 속성에 반드시 포함해.
        응답은 반드시 아래 JSON 포맷으로 해줘:
        {
          "combinations": [
            {
              "title": "엄마를 위한 피로 회복 조합",
              "description": "잦은 야근과 육아로 지친 일상을 고려해 활력 증진에 초점을 맞춘...",
              "items": ["영양제A", "영양제C"],
              "intakeGuide": "영양제A는 활력 증진을 위해 아침 식후에, 영양제C는 수면 안정화를 위해 저녁 식후에 복용하는 것을 권장합니다.",
              "warnings": []
            },
            {
              "title": "아빠를 위한 야외활동 부족 맞춤 조합",
              "description": "야외활동이 적은 생활 패턴을 고려해 광합성으로 얻기 힘든 비타민D를 충분히 보충해주는...",
              "items": ["영양제B", "영양제D"],
              "intakeGuide": "비타민D가 포함되어 지용성이므로 흡수를 높이기 위해 식사량이 가장 많은 점심 또는 저녁 식사 직후에 함께 복용하세요.",
              "warnings": ["해당 비타민D 제품은 지용성이므로 흡수율을 높이기 위해 식후 복용을 권장합니다."]
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