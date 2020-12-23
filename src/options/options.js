// docs: https://developer.chrome.com/docs/extensions/mv2/options/#:~:text=A%20user%20can%20view%20an,then%20selection%20the%20options%20link.
// Saves options to chrome.storage
function save_options() {
  const username = document.getElementById('username').value;
  const sourceLanguage = document.getElementById('source-language').value;
  const targetLanguage = document.getElementById('target-language').value;

  chrome.storage.sync.set({ username, sourceLanguage, targetLanguage }, function() {
    // Update status to let user know options were saved.
    const status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.sync.get({
    username: '',
    sourceLanguage: '',
    targetLanguage: ''
  }, function({ username, sourceLanguage, targetLanguage }) {
    document.getElementById('username').value = username;
    document.getElementById('source-language').value = sourceLanguage;
    document.getElementById('target-language').value = targetLanguage;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);
