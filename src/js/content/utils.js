// Sort entries so longer entries come up first. So we match the longest text if it includes multiple words
const sortBySourceLanguage = (sourceLanguageToTargetLanguageEntries) => {
  sourceLanguageToTargetLanguageEntries.sort(
    ([sourceLanguage], [sourceLanguage2]) => {
      return sourceLanguage2.length - sourceLanguage.length
    }
  )
}

const addInsensitiveContainsToJQuery = $ => {
  // case insensitive contains
  $.expr[':'].icontains = function (a, i, m) {
    return $(a).text().toUpperCase().indexOf(m[3].toUpperCase()) >= 0
  }
}

const chooseRandomElementFrom = (array) => {
  const randomIndex = Math.floor(Math.random() * array.length)

  return array[randomIndex]
}

// https://stackoverflow.com/a/1026087/3500171
const capitalizeFirstLetter = string => {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

// Convert matches iterator to an array. Each match contains the text, start index, and end index
const getMatchesAsArray = (regexp, str) => {
  // console.log('str', regexp)
  const matches = str.matchAll(regexp)
  const matchesArr = []

  // loop through every match
  for (const match of matches) {
    // add it to the new array
    matchesArr.push({
      matchText: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length
    })
  }

  return matchesArr
}

const isCapitalized = text => {
  return text.length > 0 && text[0] === text[0].toUpperCase()
}

// https://stackoverflow.com/a/8729274/3500171
const getParentDOMNodes = (domElement) => {
  let currentElement = domElement
  const parentElements = []

  while (currentElement) {
    parentElements.unshift(currentElement)
    currentElement = currentElement.parentNode
  }

  return parentElements
}

// Given an html tag like <sup id="cite_ref-88" class="reference">
// return a simplified tag of the same length: <xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx>
const getSimplifiedHtmlForMatching = html => {
  const matchInnerHtmlTag = /(?<=<)\/?\s*[^>]*/g
  const sourceLanguagePhraseMatches = getMatchesAsArray(
    matchInnerHtmlTag,
    html
  ).reverse()

  let newHtml = html
  for (const sourceLanguagePhraseMatch of sourceLanguagePhraseMatches) {
    const { matchText, startIndex, endIndex } = sourceLanguagePhraseMatch
    // use a dummy letter, in this case z.
    newHtml = newHtml.slice(0, startIndex) + 'z'.repeat(matchText.length) + newHtml.slice(endIndex)
  }

  return newHtml
}

module.exports = {
  sortBySourceLanguage,
  addInsensitiveContainsToJQuery,
  chooseRandomElementFrom,
  capitalizeFirstLetter,
  getMatchesAsArray,
  isCapitalized,
  getParentDOMNodes,
  getSimplifiedHtmlForMatching
}
