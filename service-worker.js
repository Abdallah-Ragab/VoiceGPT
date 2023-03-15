// // listen to tab updates
// chrome.tabs.onUpdated.addListener(function(tabId, tab) {
//     // check if the url is chatgpt 
//     chatGPT = "chat.openai.com";
//     if (tab.url?.includes(chatGPT)) {
//         chrome.scripting.executeScript({
//             target: { tabId: tabId },
//             files: ['components/app.js']
//         });
//     }
// });