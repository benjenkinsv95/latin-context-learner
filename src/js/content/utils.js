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

module.exports = {
  sortBySourceLanguage,
  addInsensitiveContainsToJQuery,
  chooseRandomElementFrom
}
