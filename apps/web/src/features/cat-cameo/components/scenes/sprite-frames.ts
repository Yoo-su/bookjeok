export function spriteFrame(
  frame: { x: number; y: number },
  offset: number,
): Keyframe {
  return {
    offset,
    transform: `translate(${-frame.x}px, ${-frame.y}px)`,
    easing: "steps(1, end)",
  };
}
