document.addEventListener('ExtensionRenderedEvent', (e) => {
    let recognitionSilenceLimit = 5; // seconds
    const recognitionSentancePostfix = '.'; // character to end a sentance
    const speechRecognitionProvider = window.SpeechRecognition || webkitSpeechRecognition;
    const speechRecognition = new speechRecognitionProvider();
    let enableAutoSubmit = true;
    let recognitionActive = false;
    let promptText = '';
    let sentenceChunkHolder
    let lastReconitionAt = new Date().getTime();

    speechRecognition.interimResults = true;
    speechRecognition.continuous = true;
    speechRecognition.lang = 'en-US';
    speechRecognition.onresult = handleSpeech;


    uiPauseRecognition();
    setAutoSubmit();
    setRecognitionSilenceLimit(recognitionSilenceLimit);
    setAutoSubmitSubOption();
    disableMicButton();

    function handleSpeech (event) {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        const isFinal = event.results[current].isFinal;
        
        uiPopulatePrompt(transcript, isFinal);
        recognizableInput = true;
        lastReconitionAt = new Date().getTime();
    }
    function pauseRecognition () {
        if (recognitionActive) {
            recognitionActive = false;
            speechRecognition.stop();
            voiceGPTExtensionMicButton.classList.remove('active');
        }
    }
    function uiPauseRecognition () {
        let buttonActive = voiceGPTExtensionMicButton.classList.contains('active');
        if (buttonActive) {
            voiceGPTExtensionMicButton.classList.remove('active');
        }
        pauseRecognition();
    }
    function resumeRecognition () {
        if (!recognitionActive) {
            if(!sentenceChunkHolder) {
                sentenceChunkHolder = document.createElement('p'); voiceGPTPrompt.appendChild(sentenceChunkHolder);
            }
            recognitionActive = true;
            speechRecognition.start();
            voiceGPTExtensionMicButton.classList.add('active');
            lastReconitionAt = new Date().getTime();
        }
    }
    function uiResumeRecognition () {
        let buttonActive = voiceGPTExtensionMicButton.classList.contains('active');
        if (!buttonActive) {
            voiceGPTExtensionMicButton.classList.add('active');
        }
        resumeRecognition();
    }
    function clearPrompt () {
        promptText = '';
        sentenceChunkHolder = document.createElement('p'); voiceGPTPrompt.appendChild(sentenceChunkHolder);
    }
    function uiClearPrompt () {
        voiceGPTPrompt.textContent = '';
        voiceGPTPromptContainer.setAttribute('state', 'empty');
        clearPrompt();
    }
    function populatePrompt (transcript, final) {
        if (recognitionActive) {
            sentenceChunkHolder.textContent = transcript;
            if (final) {
                let fullSentance = transcript + recognitionSentancePostfix
                sentenceChunkHolder.textContent = fullSentance;
                promptText += fullSentance;
                sentenceChunkHolder = document.createElement('p'); voiceGPTPrompt.appendChild(sentenceChunkHolder);
            }
        }
    }
    function uiPopulatePrompt (transcript, final) {
        populatePrompt(transcript, final);
        voiceGPTPromptContainer.setAttribute('state', '');
        // scroll to bottom of transcript
        voiceGPTPromptContainer.scrollTop = voiceGPTPromptContainer.scrollHeight;
        if (final) {
            chatGPTInput.value = promptText;
        }
    }
    function setAutoSubmit () {
        let state = voiceGPTAutoSubmitOption.getAttribute('state');
        if (state === 'on') {
            enableAutoSubmit = true;
        } else if (state === 'off') {
            enableAutoSubmit = false;
        }
        console.log('enableAutoSubmit: ' + enableAutoSubmit);
    }
    function switchAutoSubmitOption () {
        let state = voiceGPTAutoSubmitOption.getAttribute('state');
        let newState = state === 'on' ? 'off' : 'on';
        voiceGPTAutoSubmitOption.setAttribute('state', newState);
    }
    function setRecognitionSilenceLimit (limit=null) {
        if (!limit) {
            limit = voiceGPTAutoSubmitSubOptionInput.value;
        }
        if (limit) {
            recognitionSilenceLimit = limit;
        }
        console.log('recognitionSilenceLimit: ' + recognitionSilenceLimit);
    }
    function setAutoSubmitSubOption () {
        voiceGPTAutoSubmitSubOptionInput.value = recognitionSilenceLimit;
    }
    function submitPrompt () {
        uiPauseRecognition();
        uiClearPrompt();
        chatGPTSubmitButton.click();
    }
    function reAssignElements () {
        chatGPTInput = document.querySelector('form textarea');
        chatGPTSubmitButton = (function _ (){let buttons = document.querySelectorAll('form button'); return buttons[buttons.length - 1]})()
    }
    function disableMicButton () {
        voiceGPTExtensionMicButton.classList.add('disabled');
        // voiceGPTExtensionMicButton.setAttribute('disabled', 'disabled');
    }
    function enableMicButton () {
        voiceGPTExtensionMicButton.classList.remove('disabled');
        // voiceGPTExtensionMicButton.removeAttribute('disabled');
    }
    function toggleVoiceGPTVisability () {
        voiceGPTComponent.classList.toggle('hidden');
    }

    setInterval(() => {
        if (recognitionActive && enableAutoSubmit) {
            elapsed = new Date().getTime() - lastReconitionAt;
            if (elapsed >= recognitionSilenceLimit * 1000) {
                uiPauseRecognition();
                submitPrompt();
            }
        }
    }, 1000);

    document.addEventListener('ChatGPTFinishedLoadingEvent', (e) => {
        reAssignElements();
        enableMicButton();
    });

    // button event listeners
    voiceGPTExtensionMicButton.addEventListener('click', () => {
        if (recognitionActive) {
            uiPauseRecognition();
        } else {
            uiResumeRecognition();
        }
    });
    voiceGPTExtensionStopButton.addEventListener('click', () => {
        uiPauseRecognition();
        uiClearPrompt();
    });
    voiceGPTAutoSubmitOptionCheckbox.addEventListener('click', () => {
        switchAutoSubmitOption();
        setAutoSubmit();
    });
    voiceGPTAutoSubmitSubOptionInput.addEventListener('change', () => {
        setRecognitionSilenceLimit();
    });
    chatGPTSubmitButton.addEventListener('click', () => {
        uiPauseRecognition();
        uiClearPrompt();
    });
    voiceGPTCloseButton.addEventListener('click', () => {
        toggleVoiceGPTVisability();
    });
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.message === 'toggleVoiceGPTVisability') {
            toggleVoiceGPTVisability();
        }
    });
});


// <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="animate-spin text-center mx-auto mt-4" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
// document.querySelector("#__next > div.overflow-hidden.w-full.h-full.relative > div.flex.h-full.flex-1.flex-col.md\\:pl-\\[260px\\] > main > div.flex-1.overflow-hidden > div > div > div > svg")
