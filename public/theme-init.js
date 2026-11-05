// Applies the saved theme before the first paint.
// External file: the CSP (default-src 'self') blocks inline scripts.
try {
  var theme = localStorage.getItem('budj-theme')
  if (theme === 'light' || theme === 'dark' || theme === 'system') {
    document.documentElement.dataset.theme = theme
  }
} catch (e) {}
