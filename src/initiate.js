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
    
    chatGPTInput = document.querySelector('form textarea');
    chatGPTSubmitButton = (function _ (){let buttons = document.querySelectorAll('form button'); return buttons[buttons.length - 1]})();

    if (chrome.runtime.getURL){
        voiceGPTLogo.src = chrome.runtime.getURL('assets/icon.png');
    }
});