function searchQuiz() {
  const input = document.getElementById("searchInput");
  if (!input) return;

  const keyword = input.value.toLowerCase().trim();
  const cards = document.querySelectorAll(".folder-card");

  cards.forEach(card => {
    const text = card.dataset.title.toLowerCase();

    if (text.includes(keyword)) {
      card.style.display = "block";
    } else {
      card.style.display = "none";
    }
  });
}function goHome() {
  window.location.href = "main.html";
}