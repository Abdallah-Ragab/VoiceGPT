const voiceGPTExtensionRenderedEvent = new CustomEvent('ExtensionRenderedEvent');
const chatGPTFinishedLoadingEvent = new CustomEvent('ChatGPTFinishedLoadingEvent');
let DOMEvenets = ['DOMContentLoaded', 'DOMSubtreeModified'];


function getElementByXpath(path) {
    return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

function checkForLoadingFinish () {
    let chatGPTLoading = getElementByXpath("//*[local-name()='svg' and contains(@class, 'animate-spin')]");
    if (chatGPTLoading) {
        DOMEvenets.forEach(event => document.removeEventListener(event, checkForLoadingFinish));
        let _ = setInterval(() => {
            chatGPTLoading = getElementByXpath("//*[local-name()='svg' and contains(@class, 'animate-spin')]");
            if (chatGPTLoading === null) {
                document.dispatchEvent(chatGPTFinishedLoadingEvent);
                clearInterval(_);
            }
        }, 1000);
    }
}
  
window.onload = () => {    
    let extesionPlaceholder = document.createElement('div');
    extesionPlaceholder.id = 'voicegpt-placeholder';
    document.body.appendChild(extesionPlaceholder);

    fetchPlaceHTML(extesionPlaceholder, chrome.runtime?.getURL('app.html'));
    replaceElementTags();

    document.dispatchEvent(voiceGPTExtensionRenderedEvent);
    
    DOMEvenets.forEach(event => document.addEventListener(event, checkForLoadingFinish));
}
