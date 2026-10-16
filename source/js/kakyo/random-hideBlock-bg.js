'use strict'

const TARGET_PATHS = [
  'English%20Phrases/',
  '%E6%AF%9B%E6%A6%82%E6%9C%9F%E6%9C%AB/'
]
const SCHEME_COUNT = 12

function initPhraseButtonSchemes() {
  if (!TARGET_PATHS.some(path => window.location.pathname.includes(path))) return

  const blocks = document.querySelectorAll('.button-container .hide-block')
  if (!blocks.length) return

  let previousScheme = null

  blocks.forEach(block => {
    let scheme
    do {
      scheme = Math.floor(Math.random() * SCHEME_COUNT) + 1
    } while (scheme === previousScheme && blocks.length > 1)

    previousScheme = scheme
    block.dataset.phraseScheme = String(scheme)
  })
}

document.addEventListener('DOMContentLoaded', initPhraseButtonSchemes)
document.addEventListener('pjax:complete', initPhraseButtonSchemes)
