(function () {
  const currentPath = window.location.pathname
  const targetArticle = 'English%20Phrases/'

  const decodedPath = decodeURIComponent(currentPath)
  const isTargetPage = currentPath.includes(targetArticle) || decodedPath.includes('/English Phrases/')

  if (!isTargetPage) return

  const elements = document.querySelectorAll('.chinese-translation-text:not(.button-container .chinese-translation-text)')
  if (elements.length === 0) return

  function updateWidth() {
    elements.forEach(el => {
      if (el.closest('.button-container')) return

      const ancestor = el.closest('.post-content')
      if (ancestor) {
        const width = ancestor.getBoundingClientRect().width - 48
        el.style.width = width > 0 ? `${width}px` : 'auto'
      }
    })
  }

  updateWidth()
  window.addEventListener('resize', updateWidth)
  document.addEventListener('pjax:success', updateWidth)
})()
