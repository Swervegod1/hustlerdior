(() => {
  const input = document.querySelector('#search');
  const cards = [...document.querySelectorAll('.card')];
  const count = document.querySelector('#count');
  const more = document.querySelector('#load-more');
  const empty = document.querySelector('#empty');
  if (!input || !count || !more || !empty) return;
  let limit = 12;
  function render() {
    const query = input.value.toLowerCase().trim();
    let matches = 0;
    cards.forEach(card => {
      const match = card.dataset.name.includes(query);
      if (match) matches++;
      card.hidden = !match || matches > limit;
    });
    count.textContent = `Showing ${Math.min(limit, matches)} of ${matches} pieces`;
    more.hidden = matches <= limit;
    empty.hidden = matches > 0;
  }
  input.addEventListener('input', () => { limit = 12; render(); });
  more.addEventListener('click', () => {
    const first = cards.filter(card => card.hidden && card.dataset.name.includes(input.value.toLowerCase().trim()))[0];
    limit += 12;
    render();
    first?.querySelector('a')?.focus({ preventScroll: true });
  });
  render();
})();
