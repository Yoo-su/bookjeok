import { useEffect, useState } from "react";

/**
 * 스프라이트를 미리 풀어 두고 다 되면 true.
 * 캐시된 그림은 <image>가 화면에 붙기 전에 load가 끝나 onLoad를 놓친다
 */
export function useSpriteReady(src: string, onError: () => void) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let live = true;
    const img = new Image();
    img.onload = () => live && setReady(true);
    img.onerror = () => live && onError();
    img.src = src;
    return () => {
      live = false;
    };
  }, [src, onError]);
  return ready;
}
