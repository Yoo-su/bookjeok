import type { EditorView } from "@tiptap/pm/view";

export function getCaretScrollDelta(
  caret: { top: number; bottom: number },
  viewport: { top: number; bottom: number },
) {
  if (caret.top < viewport.top) return caret.top - viewport.top;
  if (caret.bottom > viewport.bottom) return caret.bottom - viewport.bottom;
  return 0;
}

/** Scroll the active line, not the editor's beginning; never change selection/IME. */
export function keepEditorCaretVisible(view: EditorView) {
  if (!view.hasFocus() || !view.dom.isConnected) return true;
  const toolbar = view.dom
    .closest("[data-review-editor]")
    ?.querySelector<HTMLElement>("[data-reading-surface]");
  const toolbarBottom = toolbar
    ? (Number.parseFloat(getComputedStyle(toolbar).top) || 0) +
      toolbar.getBoundingClientRect().height
    : 0;
  const viewport = window.visualViewport;
  const viewportTop = viewport?.offsetTop ?? 0;
  const top = Math.max(viewportTop, toolbarBottom) + 24;
  const bottom = Math.max(
    top + 24,
    viewportTop + (viewport?.height ?? window.innerHeight) - 24,
  );
  const delta = getCaretScrollDelta(
    view.coordsAtPos(view.state.selection.head),
    { top, bottom },
  );
  // An animation on every keystroke would lag behind typing and IME composition.
  if (Math.abs(delta) > 1) window.scrollBy({ top: delta, behavior: "instant" });
  return true;
}
