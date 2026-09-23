# Frontend Feature: Music (배경음악 플레이어)

독서 분위기를 위한 전역 배경음악 플레이어입니다. 페이지를 이동해도 재생이 끊기지 않도록 레이아웃 레벨에 호스트를 두고, 상태는 Zustand 스토어 한 곳에서 관리합니다.

## 폴더 구조

```
music/
├── index.ts
├── stores/use-music-store.ts        # 재생 상태, 재생목록, 반복 모드
└── components/
    ├── global-music-host.tsx        # 레이아웃에 상주하는 실제 재생 호스트
    ├── header-music-button.tsx      # 헤더 진입점 (전체/compact 변형)
    ├── floating-music-pill.tsx      # 재생 중 표시되는 플로팅 위젯
    └── music-player-modal.tsx       # 재생목록 · 컨트롤 모달
```

## 구조

```
<GlobalMusicHost />   ← 레이아웃에 1회 마운트, 라우트 변경과 무관하게 유지
        ▲
        │ useMusicStore (Zustand)
        │   isPlaying · currentTrack · playlist · repeatMode · volume
        ▼
HeaderMusicButton  ·  FloatingMusicPill  ·  MusicPlayerModal
```

플레이어 인스턴스는 `GlobalMusicHost` **하나뿐**입니다. 다른 컴포넌트는 스토어를 통해 명령만 보냅니다. 여러 곳에서 각자 재생하면 소리가 겹치기 때문입니다.

`HeaderMusicButton`은 헤더가 좁을 때 음반 아이콘만 보이는 `compact` 변형을 지원합니다. 기본 헤더에서는 비확장 상태와 `lg` 구간에 compact 버튼을 유지하고, 300px 스크롤 뒤 헤더가 넓어진 `xl` 이상에서만 BGM 라벨과 빠른 재생 버튼을 함께 표시합니다. 모바일 헤더에서는 버튼을 숨기고 내비게이션 시트가 진입점을 제공합니다.

## 스토어

```typescript
interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  src: string;
  coverArt: string;
}

type RepeatMode = "all" | "one" | "off";
```

기본 재생목록은 `DEFAULT_PLAYLIST` 상수로 정의되어 있습니다.

## 주의

- 브라우저 자동재생 정책상 **사용자 상호작용 이전에는 재생이 시작되지 않습니다.** 첫 재생은 반드시 클릭에서 출발해야 합니다.
- YouTube iframe은 **모달을 열거나 재생을 시작한 뒤에야 마운트됩니다.** 임베드 플레이어 JS가 약 1.6MB(압축 약 480KB)라 음악을 쓰지 않는 방문자에게까지 미리 띄우지 않습니다. iframe `src`는 처음 마운트할 때의 곡으로 고정되고 이후 곡 전환은 postMessage로 처리합니다.
- 재생목록의 `src`는 외부 링크입니다. 트랙을 추가·교체할 때는 해당 콘텐츠의 이용 조건을 먼저 확인하세요.
