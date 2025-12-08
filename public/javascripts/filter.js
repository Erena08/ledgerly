document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("filterToggle");
  const panel = document.getElementById("filterPanel");

  toggle.addEventListener("click", () => {
    panel.classList.toggle("open");
  });
});
