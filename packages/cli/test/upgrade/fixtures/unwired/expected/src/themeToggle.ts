export function applyScheme(dark: boolean) {
  document.documentElement.dataset.theme = dark ? "orange-dark" : "orange-light";
}

export function applyMode(dark: boolean) {
  // Already a 0.2 mode value: nothing to report.
  document.documentElement.setAttribute("data-theme", "dark");
  if (!dark) document.documentElement.setAttribute("data-theme", "light");
}
