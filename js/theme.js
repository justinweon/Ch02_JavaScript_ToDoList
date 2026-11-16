const THEME_KEY = "departures-theme";
const root = document.documentElement;
const themeToggle = document.querySelector("#theme-toggle");

function applyTheme(theme) {
  root.dataset.theme = theme;
  if (themeToggle) {
    themeToggle.textContent = theme === "dark" ? "[ light mode ]" : "[ dark mode ]";
  }
}

let savedTheme = null;
try {
  savedTheme = localStorage.getItem(THEME_KEY);
} catch (error) {
  savedTheme = null;
}

applyTheme(
  savedTheme ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"),
);

themeToggle?.addEventListener("click", () => {
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(next);
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch (error) {
    // 저장 실패해도 화면 전환은 유지
  }
});
