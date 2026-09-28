"use client";

import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type OverlayRenderFn = (props: {
  isOpen: boolean;
  close: () => void;
  exit: () => void;
}) => ReactNode;

interface OverlayContextType {
  mount: (id: string, element: ReactNode) => void;
  unmount: (id: string) => void;
}

const OverlayContext = createContext<OverlayContextType | null>(null);

export function OverlayProvider({ children }: { children: ReactNode }) {
  const [overlayMap, setOverlayMap] = useState<Map<string, ReactNode>>(
    () => new Map(),
  );

  const mount = useCallback((id: string, element: ReactNode) => {
    setOverlayMap((prev) => {
      const cloned = new Map(prev);
      cloned.set(id, element);
      return cloned;
    });
  }, []);

  const unmount = useCallback((id: string) => {
    setOverlayMap((prev) => {
      const cloned = new Map(prev);
      cloned.delete(id);
      return cloned;
    });
  }, []);

  const contextValue = useMemo(() => ({ mount, unmount }), [mount, unmount]);

  return (
    <OverlayContext.Provider value={contextValue}>
      {children}
      {Array.from(overlayMap.entries()).map(([id, element]) => (
        <React.Fragment key={id}>{element}</React.Fragment>
      ))}
    </OverlayContext.Provider>
  );
}

let overlayIdCounter = 0;

/**
 * 선언적 오버레이(모달, 시트, 다이얼로그) 제어 커스텀 훅 (토스 useOverlay 패턴)
 * 뷰 최상단에 [isOpen, setIsOpen] 상태를 둘 필요 없이 호출부에서 즉시 오버레이를 렌더링합니다.
 */
export function useOverlay() {
  const context = useContext(OverlayContext);
  const id = useMemo(() => `overlay-${++overlayIdCounter}`, []);

  if (!context) {
    throw new Error("useOverlay must be used within an OverlayProvider");
  }

  const { mount, unmount } = context;

  const close = useCallback(() => {
    // 닫힘 애니메이션을 위해 unmount를 호출부에서 처리할 수 있도록 분리
  }, []);

  const exit = useCallback(() => {
    unmount(id);
  }, [id, unmount]);

  const open = useCallback(
    (render: OverlayRenderFn) => {
      const handleClose = () => {
        // 닫힘 상태로 재마운트하여 exit 애니메이션 트리거
        mount(
          id,
          render({
            isOpen: false,
            close: handleClose,
            exit: () => unmount(id),
          }),
        );
        // 애니메이션 후 자동 DOM 언마운트 (기본 350ms)
        setTimeout(() => {
          unmount(id);
        }, 350);
      };

      mount(
        id,
        render({
          isOpen: true,
          close: handleClose,
          exit: () => unmount(id),
        }),
      );
    },
    [id, mount, unmount],
  );

  return useMemo(
    () => ({
      open,
      close,
      exit,
    }),
    [open, close, exit],
  );
}
