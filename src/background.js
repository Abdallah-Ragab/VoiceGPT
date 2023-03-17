async function getCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}
  
chrome.action.onClicked.addListener(function() {
    const url = 'https://chat.openai.com/';
    getCurrentTab().then((tab) => {
        if (tab.url.startsWith(url)) { chrome.tabs.sendMessage(tab.id, { message: 'toggleVoiceGPTVisability' }); }
        else { chrome.tabs.create({ url }); }
    });
});  