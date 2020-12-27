import '../../css/content.css'

const $ = require('jquery')

const { unsetEverythingStyles, wrapperStyles, duoReplacedStyles, duoSkippedStyles, tooltipStyles } = require('./styles')

const { sourceLanguageToTargetLanguageDuolingo } = require('./data')
const sourceLanguageToTargetLanguageEntries = Object.entries(
  sourceLanguageToTargetLanguageDuolingo.source_to_target_translations
)

// Sort entries so longer entries come up first. So we match the longest text if it includes multiple words
sourceLanguageToTargetLanguageEntries.sort(
  ([sourceLanguage], [sourceLanguage2]) => {
    return sourceLanguage2.length - sourceLanguage.length
  }
)

// console.log('sourceLanguageToTargetLanguageEntries', sourceLanguageToTargetLanguageEntries)
// case insensitive contains
$.expr[':'].icontains = function (a, i, m) {
  return $(a).text().toUpperCase().indexOf(m[3].toUpperCase()) >= 0
}

const buildKnownSourceLanguageWordsSelector = () => {
  const sourceLanguageCssQueries = sourceLanguageToTargetLanguageEntries.map(
    ([sourceLanguage]) => {
      return `*:icontains("${sourceLanguage}")`
    }
  )

  // combine the individiual queries into one massive query with a comma
  return sourceLanguageCssQueries.join(',')
}
const knownSourceLanguageWordsSelector = buildKnownSourceLanguageWordsSelector()

const elementsNotToSelect = 'style,meta,script,noscript,base,title,link,area,audio,img,map,track,video,embed,iframe,object,param,picture,source,svg,math,canvas,datalist,fieldset,input,optgroup,option,select,textarea,slot,template,applet,basefont,bgsound,frame,frameset,image,isindex,keygen,menuitem,multicol,nextid,noembed,noframes,plaintext,shadow,spacer,xmp,*[user-select=text]'
const injectedCssClasses =
  '.target-to-source-language-wrapper,.target-to-source-language-tooltip-text,.target-to-source-language-replacement'


const getInnerMostSourceLanguageElements = (containerSelector) => {
  console.log('container', containerSelector)
  if ($(containerSelector).is(injectedCssClasses) || $(containerSelector).is(elementsNotToSelect)) {
    console.log('returning early', $(containerSelector))
    // return nothing
    return $(null)
  }

  const allSourceLanguageMatchedElements = $(containerSelector)
    .find(knownSourceLanguageWordsSelector)
  
  const innermostSourceLanguageElements = allSourceLanguageMatchedElements.not(
    allSourceLanguageMatchedElements.has(allSourceLanguageMatchedElements)
  )

  // filter out any sourceLanguage words that have already been switched (useful if the sourceLanguage and targetLanguage are the same)
  const innermostWithoutMarked = innermostSourceLanguageElements
    .not(injectedCssClasses)
    .not(innermostSourceLanguageElements.has(injectedCssClasses))

  const innermostWithoutElementsNotToSelect = innermostWithoutMarked
    .not(elementsNotToSelect)
    .not(innermostWithoutMarked.has(elementsNotToSelect))
  console.log('innermostWithoutMarked', innermostWithoutElementsNotToSelect)
  return innermostWithoutElementsNotToSelect
}

// match a single sourceLanguage phrase
// select sourceLanguage phrases, match at word breaks
const createIndividuaSourceLanguageRegexString = (sourceLanguage) =>
  `(\\b${sourceLanguage}\\b)`

// match a single sourceLanguage phrase with regex
const createIndividualSourceLanguageRegex = (
  sourceLanguage,
  targetLanguageWords,
  flags = 'gi'
) => {
  const individualSourceLanguageRegex = createIndividuaSourceLanguageRegexString(
    sourceLanguage,
    targetLanguageWords
  )
  // wrap in parenthesis, so we can match a single sourceLanguage phrase later and replace their name
  return new RegExp(`(${individualSourceLanguageRegex})`, flags)
}

const buildAllSourceLanguagePhrasesRegex = () => {
  // Build regex to search for any of the sourceLanguage phrases names https://stackoverflow.com/a/185529/3500171

  const sourceLanguagePhraseRegexStr = sourceLanguageToTargetLanguageEntries
    .map(([sourceLanguage, targetLanguageWords]) =>
      createIndividuaSourceLanguageRegexString(
        sourceLanguage,
        targetLanguageWords
      )
    ) // (surely is not)
    .join('|') // (surely is not)|(Actor)

  // wrap in parenthesis, so we can match a single sourceLanguage phrases later and replace their name
  // NOTE: Must include 'g' if we want to only match the full pattern
  // include i so it is case insesitive
  return new RegExp(`(${sourceLanguagePhraseRegexStr})`, 'gi')
}
const allSourceLanguagePhrasesRegex = buildAllSourceLanguagePhrasesRegex()

const findSpecificSourceLanguagePhrase = (text) => {
  let individualSourceLanguagePhraseRegexAll
  let individualSourceLanguagePhraseRegexFirst

  const normalizedText = text.toLowerCase()
  const targetLanguagePhrases =
    sourceLanguageToTargetLanguageDuolingo[normalizedText]
  // console.log(
  //   'normalizedText',
  //   normalizedText,
  //   'targetLanguagePhrases',
  //   targetLanguagePhrases
  // )

  // search for the specific possible sourceLanguage phrase we matched, so we can verify they are an sourceLanguage phrase
  const specificSourceLanguageToTargetLanguage = sourceLanguageToTargetLanguageEntries.find(
    ([sourceLanguagePhrase, targetLanguageWords]) => {
      individualSourceLanguagePhraseRegexAll = createIndividualSourceLanguageRegex(
        sourceLanguagePhrase,
        targetLanguageWords
      )
      individualSourceLanguagePhraseRegexFirst = createIndividualSourceLanguageRegex(
        sourceLanguagePhrase,
        targetLanguageWords,
        'i'
      )

      const currentSourceLanguagePhraseMatches = text.match(
        individualSourceLanguagePhraseRegexAll
      )
      // if the current sourceLanguage phrase matches contains the potential traitor we matched, then we found the object we are looking for

      return (
        currentSourceLanguagePhraseMatches &&
        currentSourceLanguagePhraseMatches.length > 0
      )
    }
  )

  return {
    specificSourceLanguageToTargetLanguage,
    specificSourceLanguageToTargetLanguageRegexAll: individualSourceLanguagePhraseRegexAll,
    specificSourceLanguageToTargetLanguageRegexFirst: individualSourceLanguagePhraseRegexFirst
  }
}

// https://stackoverflow.com/a/1026087/3500171
function capitalizeFirstLetter (string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

const getMatchesInArray = (regexp, str) => {
  const matches = str.matchAll(regexp)
  const matchesArr = []
  for (const match of matches) {
    // console.log(
    //   `Found ${match[0]} start=${match.index} end=${match.index + match[0].length
    //   }.`
    // )
    matchesArr.push({
      matchText: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length
    })
  }

  return matchesArr
}

const replaceWords = (innerMostNode) => {
  let text = innerMostNode.text()

  // find all potential traitor matches
  // const dirtyMatches = Array.from(text.matchAll(allSourceLanguagePhrasesRegex))
  // Reverse matches so we can loop through it backwards, this way when we replace text we don't affect indexes for future elements
  const verifiedMatches = getMatchesInArray(
    allSourceLanguagePhrasesRegex,
    text
  ).reverse()

  // console.log('dirtyMatches', dirtyMatches)
  // console.log('verifiedMatches', verifiedMatches)

  // if we found possible traitors
  if (verifiedMatches && verifiedMatches.length > 0) {
    // const verifiedMatches = dirtyMatches[0].filter(el => el !== undefined)
    // console.log('verifiedMatches', verifiedMatches)

    // console.log('matches', verifiedMatches)
    // // loop through each possible traitor we matched
    for (const match of verifiedMatches) {
      const { matchText, startIndex, endIndex } = match
      // console.log(`Found ${matchText} start=${startIndex} end=${endIndex}.`)
      // console.log(
      //   `Matched ${matchText} in \n${text}\nverified matches: ${verifiedMatches}`
      // )

      const {
        specificSourceLanguageToTargetLanguage,
        specificSourceLanguageToTargetLanguageRegexAll,
        specificSourceLanguageToTargetLanguageRegexFirst
      } = findSpecificSourceLanguagePhrase(matchText)
      // console.log(
      //   'specific phrase (possibly, might be buggy)',
      //   specificSourceLanguageToTargetLanguage
      // )

      if (specificSourceLanguageToTargetLanguage) {
        const specificSourceLanguageToTargetLanguageRegexFirst = createIndividualSourceLanguageRegex(
          matchText,
          null,
          'i'
        )
        // console.log('About to replace match', matchText)
        const [
          sourceLanguagePhrase,
          targetLanguageWords
        ] = specificSourceLanguageToTargetLanguage
        // console.log('about to update text', text)

        const randomIndex = Math.floor(
          Math.random() * targetLanguageWords.length
        )
        const randomTargetLanguageWord = targetLanguageWords[randomIndex]

        // If less than 0.2, replace with targetLanguage word
        // TODO change 2
        const shouldReplace = Math.random() <= 0.80
        let replacement = shouldReplace ? randomTargetLanguageWord : matchText
        const isCapitalized = matchText[0] === matchText[0].toUpperCase()
        if (isCapitalized) {
          replacement = capitalizeFirstLetter(replacement)
          // console.log(`Replacing ${matchText} with ${replacement}`)
        }
        const targetLanguagesAllDisplay = targetLanguageWords.join(' | ')
        const titleText = shouldReplace
          ? matchText + ` (${targetLanguagesAllDisplay})`
          : targetLanguagesAllDisplay
        const innerStyles = shouldReplace ? duoReplacedStyles : duoSkippedStyles

        // const html = replacement
        const html =
          `<span class="target-to-source-language-wrapper" style="${unsetEverythingStyles + wrapperStyles}">` +
          `<abbr class="target-to-source-language-tooltip-text"  style="${tooltipStyles}" title="${titleText}">` +
          `<span style="${innerStyles}" tabindex="-1" class="target-to-source-language-replacement">` +
          `${replacement}` +
          '</span>' +
          '</abbr>' +
          '</span>'

        // TODO slice/splice
        // console.log('text before splice', text)
        text = text.slice(0, startIndex) + html + text.slice(endIndex)
        // console.log('new text', text)
        // if we found an sourceLanguage word, replace it with targetLanguage
      }
    }

    console.log('\nold html', $(innerMostNode).html(), '\n\nnew html', text)
    $(innerMostNode).html(text)
    // alert('')
  }
}

// Callback function to execute when mutations are observed
const markNewContent = function (mutationsList, observer) {
  console.log('Marking new content')
  for (const mutation of mutationsList) {
    for (const node of mutation.addedNodes) {
      if (!$(node).is(injectedCssClasses) && !$(node).is(elementsNotToSelect)) {
      
        console.log('in is', $(node))
        // find the sourceLanguage phrases
        getInnerMostSourceLanguageElements(node).each(function () {
          replaceWords($(this))
        })
      }
    }
  }
}

function restoreOptions () {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.sync.get(
    {
      username: '',
      sourceLanguage: '',
      targetLanguage: ''
    },
    function ({ username, sourceLanguage, targetLanguage }) {
      console.log({ username, sourceLanguage, targetLanguage })

      // $.ajax({
      //   url:
      //     'https://duolingo-django-api.herokuapp.com/source_to_target_phrases/',
      //   method: 'POST',
      //   data: {
      //     source_language: sourceLanguage,
      //     target_language: targetLanguage,
      //     username
      //   }
      // })
      //   .then((responseData) =>
      //     console.log('source to target phrases from api', responseData)
      //   )
      //   .catch((error) =>
      //     console.error('failed to fetch source to target phrases', error)
      //   )

      getInnerMostSourceLanguageElements('body').each(function () {
        replaceWords($(this))
      })

      // Options for the observer (which mutations to observe)
      const config = { childList: true, subtree: true }
      // Create an observer instance linked to the callback function
      // eslint-disable-next-line no-undef
      const observer = new MutationObserver(markNewContent)

      // Start observing the target node for configured mutations
      observer.observe(document, config)
    }
  )
}

// eslint-disable-next-line no-undef
chrome.extension.sendMessage({}, function (response) {
  const readyStateCheckInterval = setInterval(function () {
    if (document.readyState === 'complete') {
      clearInterval(readyStateCheckInterval)

      // This part of the script triggers when page is done loading
      console.log('Language Through Context Loaded')
      $(() => {
        // Look for all of our sourceLanguage phrases and replace some of them
        restoreOptions()
        // document.addEventListener('DOMContentLoaded', restore_options)
      })
    }
  }, 10)
})
