


// const scriptUrl = chrome.runtime.getURL("import.js");
// console.log(scriptUrl);
// fetch(scriptUrl)
//     .then(response => response.text())
//     .then(code => {
//         eval(code);
//     });
// importScripts('import.js');

// add an overlay to the page
var placeholder = document.createElement('div');
placeholder.id = 'voicegpt-placeholder';
document.body.appendChild(placeholder);
fetchPlaceHTML(placeholder, chrome.runtime.getURL('app/modal.html'));

// fetch html from url and replace element with it
// let url = chrome.runtime.getURL('components/app.js')
// fetch(url)
//     .then(response => response.text())
//     .then(html => {
//         var script = document.createElement('script');
//         script.innerHTML = html;
//         script.setAttribute('defer', '')
//         document.body.appendChild(script);
//     });

// // chrome.scripting.executeScript({
// //     target: { tabId: tabId },
// //     files: ['components/app.js']
// // });
// // load js 
// const scriptUrl = chrome.runtime.getURL("components/app.js");

