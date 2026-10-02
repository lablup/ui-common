export function isInsideDrawer(node: HTMLElement) {
  return node.closest(".drawer") !== null;
}
