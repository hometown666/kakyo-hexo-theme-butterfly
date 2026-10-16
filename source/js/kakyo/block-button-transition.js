const PHRASES_PATH = 'English%20Phrases/'
const ROW_TRANSITION_MS = 1000

function initHideBlock() {
  if (!window.location.pathname.includes(PHRASES_PATH)) return
  if (window.hideBlockInitialized) return
  window.hideBlockInitialized = true

  document.addEventListener('click', handleHideBlockClick, true)
}

function expandBlock(block) {
  block.classList.remove('collapsing')
  block.classList.add('expanded')
}

function collapseBlock(block) {
  if (!block.classList.contains('expanded')) return

  block.classList.add('collapsing')
  block.classList.remove('expanded')

  let done = false
  const finish = () => {
    if (done) return
    done = true
    block.classList.remove('collapsing')
    block.removeEventListener('transitionend', onTransitionEnd)
    clearTimeout(fallback)
  }

  const onTransitionEnd = (e) => {
    if (e.target !== block || e.propertyName !== 'grid-template-rows') return
    finish()
  }

  block.addEventListener('transitionend', onTransitionEnd)
  const fallback = setTimeout(finish, ROW_TRANSITION_MS + 50)
}

function handleHideBlockClick(e) {
  const button = e.target.closest('.button-container .hide-button')
  if (!button) return

  e.preventDefault()
  e.stopImmediatePropagation()

  const block = button.closest('.hide-block')
  const container = button.closest('.button-container')
  if (!block || !container) return

  const willExpand = !block.classList.contains('expanded')

  if (willExpand) {
    container.querySelectorAll('.hide-block.expanded, .hide-block.collapsing').forEach(other => {
      if (other !== block) collapseBlock(other)
    })
    expandBlock(block)
  } else {
    collapseBlock(block)
  }
}

document.addEventListener('DOMContentLoaded', initHideBlock)

document.addEventListener('pjax:complete', () => {
  window.hideBlockInitialized = false
  setTimeout(initHideBlock, 100)
})
