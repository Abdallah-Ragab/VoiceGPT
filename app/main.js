// excute the code when the DOM loads or changes and  certain elements are available
const domEvents = ['load', 'DOMContentLoaded', 'DOMSubtreeModified'];
domEvents.forEach(event => document.addEventListener(event, () => {
    // check if the element exists
    const element = document.querySelector('#voice-gpt-component');
    if (element) {

        // set logo image src
        const logo = document.querySelector('#voice-gpt-component .logo');
        logo.src = chrome.runtime.getURL('assets/icon.png');
        
        
        // on record button click toggle class active
        const controlButtons = document.querySelectorAll('#voice-gpt-component .control-button');
        controlButtons.forEach(button => {
            button.addEventListener('click', () => {
                button.classList.toggle('active');
            });
        });
        
        const Prompt = document.querySelector('#voice-gpt-component .transcript .body');
        const promptPlaceholder = document.querySelector('#voice-gpt-component .transcript .placeholder');
        // if prompt is empty show placeholder
        if (Prompt.innerText.trim() === '') {
            promptPlaceholder.classList.remove('hidden');
        }
        // populate prompt with textarea input
        const textareaInput = document.querySelector('#textarea-input');
        textareaInput.addEventListener('input', () => {
            Prompt.innerText = textareaInput.value;
            if (Prompt.innerText.trim() === '') {
                console.log('empty');
                promptPlaceholder.classList.remove('hidden');
            } else {
                promptPlaceholder.classList.add('hidden');
            }
        });
    }
}));

