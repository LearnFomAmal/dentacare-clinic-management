export const applyTheme = (theme = "light") => {
  const selectedTheme = theme === "dark" ? "dark" : "light";

  document.documentElement.classList.remove("light", "dark");
  document.documentElement.classList.add(selectedTheme);

  localStorage.setItem("dentacare_theme", selectedTheme);
};

export const getStoredTheme = () => {
  return localStorage.getItem("dentacare_theme") || "light";
};