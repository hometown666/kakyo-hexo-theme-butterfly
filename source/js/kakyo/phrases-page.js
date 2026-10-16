const PHRASES_PATH = 'English%20Phrases/'
const STORAGE_KEY = 'english-phrases-learned'

const ROW_TIPS = [
  '勾选表示已掌握',
  '温故而知新',
  '积少成多',
  '再记一个吧',
  '坚持就是胜利'
]

function isPhrasesPage() {
  return window.location.pathname.includes(PHRASES_PATH)
}

function getLearnedSet() {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))
  } catch {
    return new Set()
  }
}

function saveLearnedSet(set) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]))
}

function getContainer() {
  return document.querySelector('.post-content .button-container')
}

function getPhraseItems(container) {
  return [...container.querySelectorAll('.phrase-item')]
}

function syncLearnedState(container) {
  const learned = getLearnedSet()
  getPhraseItems(container).forEach(item => {
    const id = item.dataset.phraseId
    const input = item.querySelector('.phrase-mark-input')
    const checked = learned.has(id)
    if (input) input.checked = checked
    item.classList.toggle('phrase-learned', checked)
  })
}

function updateGlobalSummary(container) {
  const items = getPhraseItems(container)
  const learned = getLearnedSet()
  const total = items.length
  const count = items.filter(item => learned.has(item.dataset.phraseId)).length
  let summary = container.querySelector('.phrase-global-summary')

  if (!summary) {
    summary = document.createElement('div')
    summary.className = 'phrase-global-summary phrase-row-filler'
    summary.style.flex = '1 0 100%'
    summary.style.justifyContent = 'space-between'
    summary.style.marginBottom = '4px'
    container.prepend(summary)
  }

  summary.innerHTML = `
    <span class="phrase-row-stats">总进度 <span class="phrase-row-stats-all">${count} / ${total}</span> 已掌握</span>
    <span class="phrase-row-tip">${count === total ? '全部掌握，太棒了！' : '勾选左侧方框标记已掌握的词组'}</span>
  `
}

function buildRowFiller(rowItems, rowIndex) {
  const learned = getLearnedSet()
  const total = rowItems.length
  const count = rowItems.filter(item => learned.has(item.dataset.phraseId)).length
  const tip = ROW_TIPS[rowIndex % ROW_TIPS.length]

  const filler = document.createElement('div')
  filler.className = 'phrase-row-filler'
  filler.innerHTML = `
    <span class="phrase-row-stats">本行 <span class="phrase-row-stats-all">${count}/${total}</span></span>
    <span class="phrase-row-tip">${tip}</span>
  `
  return filler
}

function layoutRowFillers(container) {
  container.querySelectorAll('.phrase-row-filler:not(.phrase-global-summary)').forEach(el => el.remove())

  const items = getPhraseItems(container).filter(item => !item.classList.contains('phrase-expanded'))
  if (!items.length) return

  let rowIndex = 0
  let rowTop = items[0].offsetTop
  let rowItems = [items[0]]

  for (let i = 1; i < items.length; i += 1) {
    const item = items[i]
    if (item.offsetTop !== rowTop) {
      rowItems[rowItems.length - 1].after(buildRowFiller(rowItems, rowIndex))
      rowIndex += 1
      rowItems = [item]
      rowTop = item.offsetTop
    } else {
      rowItems.push(item)
    }
  }

  rowItems[rowItems.length - 1].after(buildRowFiller(rowItems, rowIndex))
}

function scheduleLayout(container) {
  if (container._phraseLayoutTimer) {
    clearTimeout(container._phraseLayoutTimer)
  }
  container._phraseLayoutTimer = setTimeout(() => {
    layoutRowFillers(container)
    updateGlobalSummary(container)
  }, 50)
}

function setExpanded(item, expanded) {
  const block = item.querySelector('.hide-block')
  if (!block) return
  block.classList.toggle('expanded', expanded)
  item.classList.toggle('phrase-expanded', expanded)
}

function handlePhraseClick(e) {
  const button = e.target.closest('.button-container .hide-button')
  if (!button) return

  e.preventDefault()
  e.stopImmediatePropagation()

  const item = button.closest('.phrase-item')
  const container = button.closest('.button-container')
  if (!item || !container) return

  const willExpand = !item.querySelector('.hide-block')?.classList.contains('expanded')

  if (willExpand) {
    getPhraseItems(container).forEach(other => {
      if (other !== item) setExpanded(other, false)
    })
  }

  setExpanded(item, willExpand)
  scheduleLayout(container)
}

function handlePhraseMarkChange(e) {
  const input = e.target.closest('.phrase-mark-input')
  if (!input) return

  const item = input.closest('.phrase-item')
  const container = input.closest('.button-container')
  if (!item || !container) return

  const learned = getLearnedSet()
  const id = item.dataset.phraseId

  if (input.checked) {
    learned.add(id)
  } else {
    learned.delete(id)
  }

  saveLearnedSet(learned)
  item.classList.toggle('phrase-learned', input.checked)
  scheduleLayout(container)
}

function initPhrasesPage() {
  if (!isPhrasesPage()) return

  const container = getContainer()
  if (!container) return

  syncLearnedState(container)
  scheduleLayout(container)

  if (!window.phrasesPageInitialized) {
    window.phrasesPageInitialized = true
    document.addEventListener('click', handlePhraseClick, true)
    document.addEventListener('change', handlePhraseMarkChange, true)
    window.addEventListener('resize', () => {
      const current = getContainer()
      if (current) scheduleLayout(current)
    }, { passive: true })
  }
}

function resetPhrasesPage() {
  const container = getContainer()
  if (container && container._phraseLayoutTimer) {
    clearTimeout(container._phraseLayoutTimer)
    delete container._phraseLayoutTimer
  }
}

document.addEventListener('DOMContentLoaded', initPhrasesPage)
document.addEventListener('pjax:complete', () => {
  resetPhrasesPage()
  setTimeout(initPhrasesPage, 100)
})
