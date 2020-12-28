import '../css/options.css'
// docs: https://developer.chrome.com/docs/extensions/mv2/options/#:~:text=A%20user%20can%20view%20an,then%20selection%20the%20options%20link.
// Saves options to chrome.storage
function saveOptions () {
  const username = document.getElementById('username').value

  // eslint-disable-next-line no-undef
  chrome.storage.sync.set({ username }, function () {
    // Update status to let user know options were saved.
    const status = document.getElementById('status')
    status.textContent = 'Options saved.'
    setTimeout(function () {
      status.textContent = ''
    }, 750)
  })
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restoreOptions () {
  // Use default value color = 'red' and likesColor = true.
  // eslint-disable-next-line no-undef
  chrome.storage.sync.get({
    username: ''
  }, function ({ username }) {
    document.getElementById('username').value = username
  })
}

document.addEventListener('DOMContentLoaded', restoreOptions)
document.getElementById('save').addEventListener('click',
  saveOptions)
