var voiceGPTComponent
var voiceGPTLogo
var voiceGPTPromptContainer
var voiceGPTPrompt
var voiceGPTPromptPlaceholder
var voiceGPTControlButtons
var voiceGPTExtensionMicButton
var voiceGPTExtensionPlayPauseButton
var voiceGPTExtensionStopButton
var voiceGPTAutoSubmitOption
var voiceGPTAutoSubmitOptionCheckbox
var voiceGPTAutoSubmitSubOptionInput
var voiceGPTCloseButton
var chatGPTInput
var chatGPTSubmitButton
var chatGPTRegenrateResponseButton
var chatGPTInputSection



const chatGPTSubmitButtonEnabledSelector = 'form button>svg'
const regenerateResponseButtonXpath = "//button[.//div[text()='Regenerate response']]";
const stopGeneratingButtonXpath = "//button[.//div[text()='Stop generating']]";
const lastResponseXpath = "(//main/div[1]/div/div/div/div[contains(@class, 'group')])[last()]";

function getElementByXpath(path) {
    return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

document.addEventListener('ExtensionRenderedEvent', (e) => {
    voiceGPTComponent = document.querySelector('#voice-gpt-component');
    voiceGPTLogo = document.querySelector('#voice-gpt-component .logo');
    voiceGPTPromptContainer = document.querySelector('#voice-gpt-component .transcript');
    voiceGPTPrompt = document.querySelector('#voice-gpt-component .transcript .body');
    voiceGPTPromptPlaceholder = document.querySelector('#voice-gpt-component .transcript .placeholder');
    voiceGPTControlButtons = document.querySelectorAll('#voice-gpt-component .control-button');
    voiceGPTExtensionMicButton = document.querySelector('#voice-gpt-component .control-button#record');
    voiceGPTExtensionPlayPauseButton = document.querySelector('#voice-gpt-component .control-button#pause');
    voiceGPTExtensionStopButton = document.querySelector('#voice-gpt-component .control-button#stop');
    voiceGPTAutoSubmitOption = document.querySelector('#voice-gpt-component .options .option#auto-submit');
    voiceGPTAutoSubmitOptionCheckbox = document.querySelector('#voice-gpt-component .options .option#auto-submit .checkbox');
    voiceGPTAutoSubmitSubOptionInput = document.querySelector('#voice-gpt-component .options .option#auto-submit .sub-option input');
    voiceGPTCloseButton = document.querySelector('#voice-gpt-component .close');

    if (chrome.runtime.getURL){
        voiceGPTLogo.src = chrome.runtime.getURL('assets/icon.png');
    }
});

document.addEventListener('ChatGPTFinishedLoadingEvent', (e) => {
    chatGPTInput = document.querySelector('form textarea');
    chatGPTSubmitButton = (function _ (){let buttons = document.querySelectorAll('form button'); return buttons[buttons.length - 1]})();
    chatGPTRegenrateResponseButton = getElementByXpath(regenerateResponseButtonXpath);
    chatGPTInputSection = document.querySelector("main>:last-child")
    chatGPTRegenrateResponseButtonContainer = document.querySelector("main>:last-child>form>div>div:first-child")
});