// Applies the saved theme and UI style before the first paint.
// External file: the CSP (default-src 'self') blocks inline scripts.
// The style Pro is always dark (v3 §4.3, Louis).
try {
  var root = document.documentElement
  var ui = localStorage.getItem('budj-ui')
  var theme = localStorage.getItem('budj-theme')
  root.dataset.ui = ui === 'pro' ? 'pro' : 'playfull'
  // Installed app: sized on the screen, not on the moving viewport (global.css).
  if (navigator.standalone === true || matchMedia('(display-mode: standalone)').matches) {
    root.dataset.standalone = ''
  }
  if (theme === 'light' || theme === 'dark' || theme === 'system') root.dataset.theme = theme
  if (ui === 'pro') {
    root.dataset.theme = 'dark'
  }
} catch (e) {}
