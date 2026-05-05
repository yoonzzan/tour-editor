# 📽️ Tour Editor Presentation

이 폴더는 **Remotion**을 사용하여 제작된 Tour Editor 프로젝트 안내 및 데모용 애니메이션 슬라이드 소스 코드입니다.

## 🚀 시작하기

슬라이드를 브라우저에서 실시간으로 확인하고 편집하려면 아래 단계를 따르세요.

### 1. 패키지 설치
최초 실행 시, 필요한 라이브러리를 먼저 설치해야 합니다.
```bash
npm install
```

### 2. 슬라이드 스튜디오 실행
아래 명령어를 입력하면 Remotion Studio가 실행됩니다.
```bash
npm start
```
실행 후 터미널에 표시되는 주소(보통 [http://localhost:3000](http://localhost:3000))를 브라우저에서 열어주세요.

## 🛠️ 주요 명령어

| 명령어 | 설명 |
| :--- | :--- |
| `npm start` | **Remotion Studio** 실행 (실시간 미리보기 및 슬라이드 탐색) |
| `npm run build` | 슬라이드를 MP4 영상 파일로 렌더링 (결과물: `out/presentation.mp4`) |
| `npm run render` | 고화질(H.264) 영상으로 렌더링 |

## 📂 폴더 구조
- `src/slides/`: 각 슬라이드의 내용과 애니메이션이 담긴 컴포넌트들
- `src/components/`: 슬라이드에서 공통으로 사용되는 UI 요소 (레이아웃, 브라우저 목업 등)
- `src/Presentation.tsx`: 슬라이드의 전체 시퀀스 및 전환(Transition) 설정

## 💡 참고사항
- 이 프레젠테이션은 코드 기반으로 작동하므로, 내용을 수정하려면 `src/slides` 폴더 내의 각 슬라이드 파일을 직접 수정하면 됩니다.
- 수정 사항은 브라우저(Studio)에 즉시 반영됩니다.
