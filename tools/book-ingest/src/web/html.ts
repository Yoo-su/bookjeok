import { type DefaultTreeAdapterTypes as Tree, parse } from "parse5";

export type HtmlNode = Tree.Node;
export type HtmlElement = Tree.Element;

export const documentOf = (html: string) => parse(html);
export const attr = (node: HtmlElement, name: string) =>
  node.attrs.find((a) => a.name === name)?.value ?? "";
export const hasClass = (node: HtmlElement, name: string) =>
  attr(node, "class").split(/\s+/).includes(name);

export function elements(
  node: HtmlNode,
  matches: (element: HtmlElement) => boolean,
): HtmlElement[] {
  const found: HtmlElement[] = [];
  const visit = (current: HtmlNode) => {
    if ("tagName" in current && matches(current)) found.push(current);
    if ("childNodes" in current) current.childNodes.forEach(visit);
  };
  visit(node);
  return found;
}

/** HTML parser decodes entities. Keep paragraph breaks; omit controls/scripts. */
export function textOf(node: HtmlNode | undefined): string {
  if (!node) return "";
  if ("value" in node) return node.value;
  if ("tagName" in node) {
    if (["script", "style", "button"].includes(node.tagName)) return "";
    if (
      node.tagName === "a" &&
      hasClass(node, "Ere_sub_gray8") &&
      /fn_(?:hide|show)_introduce/.test(attr(node, "href"))
    )
      return "";
    if (node.tagName === "br") return "\n";
  }
  const content =
    "childNodes" in node ? node.childNodes.map(textOf).join("") : "";
  return "tagName" in node && ["p", "li", "tr"].includes(node.tagName)
    ? `${content}\n`
    : content;
}

export const compactText = (node: HtmlNode | undefined) =>
  textOf(node).replace(/\s+/g, " ").trim();

export function meta(root: HtmlNode, property: string): string {
  const node = elements(
    root,
    (e) =>
      e.tagName === "meta" &&
      (attr(e, "property") === property || attr(e, "name") === property),
  )[0];
  return node ? attr(node, "content") : "";
}
