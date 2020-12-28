import '../../css/content.css'

const $ = require('jquery')
const { sortBySourceLanguage, addInsensitiveContainsToJQuery, chooseRandomElementFrom, capitalizeFirstLetter, getMatchesAsArray, isCapitalized } = require('./utils')
// load the store object where I will add different pieces of data
const store = require('./store')

store.styles = require('./styles')

addInsensitiveContainsToJQuery($)

const buildKnownSourceLanguageWordsSelector = () => {
  const sourceLanguageCssQueries = store.sourceLanguageToTargetLanguageEntries.map(
    ([sourceLanguage]) => {
      return `*:icontains("${sourceLanguage}")`
    }
  )

  // combine the individiual queries into one massive query with a comma
  return sourceLanguageCssQueries.join(',')
}

// Elements to avoid selecting
store.elementsNotToContain = 'style,meta,script,noscript,base,title,link,embed'
store.elementsNotToSelect = store.elementsNotToContain + 'img,area,audio,map,track,video,iframe,object,param,picture,source,svg,math,canvas,datalist,fieldset,input,optgroup,option,select,textarea,slot,template,applet,basefont,bgsound,frame,frameset,image,isindex,keygen,menuitem,multicol,nextid,noembed,noframes,plaintext,shadow,spacer,xmp,code,code *'

// Classes of elements that will be injected into the page. We will ignore searching inside of them for matches
// since they have already matched and been replaced.
store.injectedCssClasses = '.target-to-source-language-wrapper,.target-to-source-language-tooltip-text,.target-to-source-language-replacement'

// Find the inner most elements that match the source language
const getInnerMostSourceLanguageElements = (containerSelector) => {
  // If the container is an element we created or is an element we don't want to select
  if ($(containerSelector).is(store.injectedCssClasses) || $(containerSelector).is(store.elementsNotToSelect)) {
    // return nothing
    return $(null)
  }

  // Find every element inside the container that matches a word we know about from the source language
  // and include the container itself
  const allSourceLanguageMatchedElements = $(containerSelector)
    .add($(containerSelector).find(store.knownSourceLanguageWordsSelector))

  // Find elements with matches that don't contain other elements that match
  // So we find the most specific match.
  const innermostSourceLanguageElements = allSourceLanguageMatchedElements.not(
    allSourceLanguageMatchedElements.has(allSourceLanguageMatchedElements)
  )

  // filter out any sourceLanguage words that have already been switched
  // useful to avoid processing the same word twice and if the sourceLanguage and targetLanguage are the same
  const innermostWithoutMarked = innermostSourceLanguageElements
    .not(store.injectedCssClasses)
    .not(innermostSourceLanguageElements.has(store.injectedCssClasses))

  // Filter out any elements from the list of elements not to select (so we dont return script tags or style tags)
  const innermostWithoutElementsNotToSelect = innermostWithoutMarked
    .not(store.elementsNotToSelect)
    .not(innermostWithoutMarked.has(store.elementsNotToContain))

  return innermostWithoutElementsNotToSelect
}

// match a single sourceLanguage phrase
// select sourceLanguage phrases, match at word breaks
const createIndividuaSourceLanguageRegexString = (sourceLanguage) => `(\\b${sourceLanguage}\\b)`

// match a single sourceLanguage phrase with regex
const createIndividualSourceLanguageRegex = (sourceLanguage, flags = 'gi') => {
  const individualRegex = createIndividuaSourceLanguageRegexString(sourceLanguage)
  // wrap in parenthesis, so we can match a single sourceLanguage phrase later and replace their name
  return new RegExp(`(${individualRegex})`, flags)
}

// Build a regex that matches any source language phrase
const buildAllSourceLanguagePhrasesRegex = () => {
  // Build regex to search for any of the sourceLanguage phrases names https://stackoverflow.com/a/185529/3500171

  const sourceLanguagePhraseRegexStr = store.sourceLanguageToTargetLanguageEntries
    .map(([sourceLanguage]) =>
      createIndividuaSourceLanguageRegexString(
        sourceLanguage
      )
    ) // (surely is not)
    .join('|') // (surely is not)|(Actor)

  // wrap in parenthesis, so we can match a single sourceLanguage phrases later and replace their name
  // NOTE: Must include 'g' if we want to only match the full pattern
  // include i so it is case insesitive
  return new RegExp(`(${sourceLanguagePhraseRegexStr})`, 'gi')
}

// Return the specific source language to target language we are looking for
const findSpecificSourceLanguagePhrase = (text) => {
  let individualSourceLanguagePhraseRegexAll

  // search for the specific possible sourceLanguage phrase we matched, so we can verify they are an sourceLanguage phrase
  const specificSourceLanguageToTargetLanguage = store.sourceLanguageToTargetLanguageEntries
    .find(([sourceLanguagePhrase]) => {
      individualSourceLanguagePhraseRegexAll = createIndividualSourceLanguageRegex(sourceLanguagePhrase)

      // if the current sourceLanguage phrase matches contains the phrase we matched, then we found the object we are looking for
      const currentSourceLanguagePhraseMatches = text.match(individualSourceLanguagePhraseRegexAll)

      // If we have matches, then this is the specific source language phrase we were looking for
      return currentSourceLanguagePhraseMatches && currentSourceLanguagePhraseMatches.length > 0
    })

  return specificSourceLanguageToTargetLanguage
}

const replaceWords = (innerMostNode) => {
  let text = innerMostNode.text()

  // Reverse matches so we can loop through it backwards, this way when we replace text we don't affect indexes for future elements
  const sourceLanguagePhraseMatches = getMatchesAsArray(
    store.allSourceLanguagePhrasesRegex,
    text
  ).reverse()

  // if we found source language phrases
  if (sourceLanguagePhraseMatches && sourceLanguagePhraseMatches.length > 0) {
    // loop through each source language phrase we matched
    for (const sourceLanguagePhraseMatch of sourceLanguagePhraseMatches) {
      const { matchText, startIndex, endIndex } = sourceLanguagePhraseMatch

      const specificSourceLanguageToTargetLanguage = findSpecificSourceLanguagePhrase(matchText)

      if (specificSourceLanguageToTargetLanguage) {
        // select a random target language to use as a replacement
        const targetLanguageWords = specificSourceLanguageToTargetLanguage[1]
        const randomTargetLanguageWord = chooseRandomElementFrom(targetLanguageWords)

        // If less than replacementPercentage, replace with targetLanguage word
        const shouldReplace = Math.random() <= (store.replacementPercentage / 100.0)
        let replacement = shouldReplace ? randomTargetLanguageWord : matchText

        if (isCapitalized(matchText)) {
          replacement = capitalizeFirstLetter(replacement)
          // console.log(`Replacing ${matchText} with ${replacement}`)
        }

        // Get a display of all possible target phrases
        const targetLanguagesAllDisplay = targetLanguageWords.join(' | ')

        // Get the text for the title text
        const titleText = shouldReplace
          ? matchText + ` (${targetLanguagesAllDisplay})`
          : targetLanguagesAllDisplay

        // extract styles
        const { duoReplacedStyles, duoSkippedStyles, unsetEverythingStyles, wrapperStyles, tooltipStyles } = store.styles
        const innerStyles = shouldReplace ? duoReplacedStyles : duoSkippedStyles

        // build replacement html
        const html =
          `<span class="target-to-source-language-wrapper" style="${unsetEverythingStyles + wrapperStyles}">` +
          `<abbr class="target-to-source-language-tooltip-text"  style="${tooltipStyles}" title="${titleText}">` +
          `<span style="${innerStyles}" tabindex="-1" class="target-to-source-language-replacement">` +
          `${replacement}` +
          '</span>' +
          '</abbr>' +
          '</span>'

        // replace the text with the wrapped html
        // TODO: Likely want to replace html instead of text
        text = text.slice(0, startIndex) + html + text.slice(endIndex)
      }
    }

    // replace the source language phrases with the target phrases html
    console.log('\nold html', $(innerMostNode).html(), '\n\nnew html', text)
    $(innerMostNode).html(text)
  }
}

// Callback function to execute when mutations are observed
const markNewContent = function (mutationsList, observer) {
  console.log('Marking new content')
  for (const mutation of mutationsList) {
    for (const node of mutation.addedNodes) {
      // if the node isnt a node we already inserted and it isnt a node we dont want to select
      if (!$(node).is(store.injectedCssClasses) && !$(node).is(store.elementsNotToSelect)) {
        // find the sourceLanguage phrases
        getInnerMostSourceLanguageElements(node).each(function () {
          // for each node we found with a match, replace words in it
          replaceWords($(this))
        })
      }
    }
  }
}

function restoreOptions () {
  // Use default value color = 'red' and likesColor = true.
  // eslint-disable-next-line no-undef
  chrome.storage.sync.get(
    {
      username: '',
      replacementPercentage: 100
    },
    function ({ username, replacementPercentage }) {
      // we use local storage for sourceLanguageToTargetLanguageEntries since it can be very large
      // eslint-disable-next-line no-undef
      chrome.storage.local.get(
        {
          sourceLanguageToTargetLanguageEntries: [] // default to an empty array until we can fetch some
        },
        function ({ sourceLanguageToTargetLanguageEntries }) {
          store.replacementPercentage = replacementPercentage
          store.sourceLanguageToTargetLanguageEntries = sourceLanguageToTargetLanguageEntries

          // build after loading source phrases to target phrases
          store.knownSourceLanguageWordsSelector = buildKnownSourceLanguageWordsSelector()
          store.allSourceLanguagePhrasesRegex = buildAllSourceLanguagePhrasesRegex()
          console.log({ username })

          // Make an ajax request to fetch the source to target phrases
          $.ajax({
            url:
          'https://duolingo-django-api.herokuapp.com/source_to_target_phrases/',
            method: 'POST',
            data: {
              username
            }
          })
            .then((responseDataStr) => {
              const responseData = JSON.parse(responseDataStr)
              console.log('source to target phrases from api', responseData.source_to_target_translations)

              const newSourceLanguageToTargetLanguageEntries = Object.entries(
                responseData.source_to_target_translations
              )
              // Sort entries so longer entries come up first. So we match the longest text if it includes multiple words
              sortBySourceLanguage(newSourceLanguageToTargetLanguageEntries)

              // eslint-disable-next-line no-undef
              chrome.storage.local.set({ sourceLanguageToTargetLanguageEntries: newSourceLanguageToTargetLanguageEntries }, function () {
                console.log('New source to target phrases loaded')
              })
            }
            )
            .catch((error) =>
              console.error('failed to fetch source to target phrases', error)
            )

          // get the innermost elements that contain a source language phrase
          getInnerMostSourceLanguageElements('body').each(function () {
            // replace the source language phrase within each element
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
    })
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
