import '../css/options.css'
// docs: https://developer.chrome.com/docs/extensions/mv2/options/#:~:text=A%20user%20can%20view%20an,then%20selection%20the%20options%20link.
// Saves options to chrome.storage
function saveOptions () {
  const username = document.getElementById('username').value
  const replacementPercentage = document.getElementById('replacement-percentage').value

  // eslint-disable-next-line no-undef
  chrome.storage.sync.set({ username, replacementPercentage }, function () {
    // Update status to let user know options were saved.
    const status = document.getElementById('status')
    status.textContent = 'Options saved.'
    setTimeout(function () {
      status.textContent = ''
    }, 3000)
  })
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restoreOptions () {
  // Use default value color = 'red' and likesColor = true.
  // eslint-disable-next-line no-undef
  chrome.storage.sync.get({
    username: '',
    replacementPercentage: 100 // Default to replacing every word
  }, function ({ username, replacementPercentage }) {
    document.getElementById('username').value = username
    document.getElementById('replacement-percentage').value = replacementPercentage
  })
}

document.addEventListener('DOMContentLoaded', restoreOptions)
document.getElementById('save').addEventListener('click',
  saveOptions)
