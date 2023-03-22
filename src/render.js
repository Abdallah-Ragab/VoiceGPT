const voiceGPTExtensionRenderedEvent = new CustomEvent('ExtensionRenderedEvent');
const chatGPTFinishedLoadingEvent = new CustomEvent('ChatGPTFinishedLoadingEvent');
const chatGPTResponseCompleteEvent = new CustomEvent('ChatGPTResponseCompleteEvent');

const DOMEvenets = ['DOMContentLoaded', 'DOMSubtreeModified'];


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

function checkForResponseComplete () {
    let chatGPTSubmitButtonEnabled = document.querySelector(chatGPTSubmitButtonEnabledSelector);
    if (chatGPTSubmitButtonEnabled) {
        document.dispatchEvent(chatGPTResponseCompleteEvent);
    }
}

function renderVoiceGPTExtension () {
    let extesionPlaceholder = document.createElement('div');
    extesionPlaceholder.id = 'voicegpt-placeholder';
    document.body.appendChild(extesionPlaceholder);

    fetchPlaceHTML(extesionPlaceholder, chrome.runtime?.getURL('app.html'));
    replaceElementTags();
    document.dispatchEvent(voiceGPTExtensionRenderedEvent);
}

window.onload = () => {    
    renderVoiceGPTExtension();
    DOMEvenets.forEach(event => document.addEventListener(event, checkForLoadingFinish));
    DOMEvenets.forEach(event => document.addEventListener(event, checkForLoadingFinish));
    document.addEventListener('ChatGPTFinishedLoadingEvent', checkForResponseComplete);
}

