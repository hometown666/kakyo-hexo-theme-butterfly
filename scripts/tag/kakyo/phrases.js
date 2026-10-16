'use strict'

const { readdirSync, readFileSync } = require('fs')
const { join } = require('path')
const yaml = require('js-yaml')

/**
 * Kakyo custom tag — {% phrases %}
 *
 * {% phrases %}           — all letters
 * {% phrases a %}         — source/_data/phrases/a.yml only
 * {% phrases a,b,i %}     — multiple letter files (comma or space separated)
 *
 * One file per keyword initial letter. Entries are sorted alphabetically
 * by keyword (word: true), then button text.
 */

let cachedEntriesByKey = new Map()

const escapeHtml = str => String(str)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')

const boldToStrong = str => String(str).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

const renderButtonPart = part => {
  const text = part.text ?? ''
  if (part.word) return `<word>${escapeHtml(text)}</word>`
  let html = escapeHtml(text)
  if (part.sup) html += `<sup>${escapeHtml(part.sup)}</sup>`
  return html
}

const renderButton = parts => {
  if (!parts || !parts.length) return ''
  return `<span class="phrase-btn-text">${parts.map(renderButtonPart).join('')}</span>`
}

const renderSbPart = part => {
  const prefix = part.prefix ?? ''
  const suffix = part.suffix ?? ''
  const text = part.text ?? ''
  const inner = part.underline ? `<u>${escapeHtml(text)}</u>` : escapeHtml(text)
  return `<span class="sb-sth">${prefix}${inner}${suffix}</span>`
}

const renderTitlePart = part => {
  if (part.sb) return renderSbPart(part)
  if (part.underline) return `<u>${escapeHtml(part.text ?? '')}</u>`
  if (part.word) return `<word>${escapeHtml(part.text ?? '')}</word>`
  return escapeHtml(part.text ?? '')
}

const renderTitle = title => {
  if (!title || !title.length) return ''
  return `<span class="hideBlockTitle">${title.map(renderTitlePart).join('')}</span>`
}

const renderPos = sense => {
  if (sense.posHtml) return `${sense.posHtml} `
  if (sense.pos) return `${escapeHtml(sense.pos)} `
  return ''
}

const renderDefinition = sense => {
  const pos = renderPos(sense)
  const cn = escapeHtml(sense.cn ?? '')
  const en = sense.en ? `<span class="definition-english-text">${escapeHtml(sense.en)}</span>` : ''
  return `<span class="definition-text">${pos}${cn}${en}</span>`
}

const renderExampleHtml = ex => {
  const en = boldToStrong(ex.en ?? '')
  const metaParts = []
  if (ex.zh) metaParts.push(`<span class="chinese-text">（${escapeHtml(ex.zh)}）</span>`)
  if (ex.source) metaParts.push(`<span class="instance-source">——${escapeHtml(ex.source)}</span>`)
  const meta = metaParts.length
    ? `<span class="chinese-translation-text"><span class="chinese-translation-meta">${metaParts.join('')}</span></span>`
    : ''
  return `<li>${en}${meta}</li>`
}

const renderSense = sense => {
  let html = ''
  if (sense.title) html += renderTitle(sense.title)
  html += renderDefinition(sense)
  if (sense.examples && sense.examples.length) {
    html += '<ul>' + sense.examples.map(renderExampleHtml).join('') + '</ul>'
  }
  return html
}

const renderEntry = (entry, hexo) => {
  const id = entry.id || ''
  const sensesHtml = (entry.senses || []).map(sense => renderSense(sense)).join('')
  const buttonHtml = renderButton(entry.button)

  return `<div class="phrase-item" data-phrase-id="${escapeHtml(id)}">`
    + `<div class="hide-block">`
    + `<button type="button" class="hide-button">${buttonHtml}</button>`
    + `<div class="hide-content">${sensesHtml}</div>`
    + `</div></div>`
}

const getEntryKeyword = entry => {
  if (entry.keyword) return String(entry.keyword).toLowerCase()

  const wordPart = entry.button?.find(part => part.word)
  if (wordPart?.text) return String(wordPart.text).toLowerCase()

  return String(entry.button?.[0]?.text ?? entry.id).trim().toLowerCase()
}

const getEntrySortLabel = entry => (
  entry.button?.map(part => part.text).join('').toLowerCase() ?? entry.id
)

const sortEntries = entries => entries.sort((a, b) => {
  const byKeyword = getEntryKeyword(a).localeCompare(getEntryKeyword(b))
  if (byKeyword !== 0) return byKeyword
  return getEntrySortLabel(a).localeCompare(getEntrySortLabel(b))
})

const parseLetters = args => {
  if (!args?.length) return null

  const letters = args.join(' ')
    .split(/[,，\s]+/)
    .map(letter => letter.trim().toLowerCase())
    .filter(Boolean)

  return letters.length ? letters : null
}

const loadEntries = letters => {
  const cacheKey = letters ? letters.join(',') : '*'
  if (cachedEntriesByKey.has(cacheKey)) return cachedEntriesByKey.get(cacheKey)

  const dir = join(hexo.source_dir, '_data', 'phrases')
  let files = readdirSync(dir).filter(name => name.endsWith('.yml'))

  if (letters) {
    const wanted = new Set(letters.map(letter => `${letter}.yml`))
    files = files.filter(name => wanted.has(name))
  }

  const entries = sortEntries(files.flatMap(name => {
    const data = yaml.load(readFileSync(join(dir, name), 'utf8'))
    return Array.isArray(data) ? data : []
  }))

  cachedEntriesByKey.set(cacheKey, entries)
  return entries
}

hexo.extend.filter.register('before_generate', () => {
  cachedEntriesByKey.clear()
})

hexo.extend.tag.register('phrases', args => {
  const letters = parseLetters(args)
  const entries = loadEntries(letters)
  if (!entries.length) {
    const hint = letters ? letters.join(',') : 'all'
    return `<!-- phrases: no data (${hint}) -->`
  }

  return `<div class="button-container">${entries.map(entry => renderEntry(entry, hexo)).join('')}</div>`
})
