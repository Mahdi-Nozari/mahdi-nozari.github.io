// Keep browser zoom available on the portfolio as well as the presentations.
const viewport = document.querySelector('meta[name="viewport"]');
if (viewport) {
  viewport.content = 'width=device-width, initial-scale=1, viewport-fit=cover';
}
