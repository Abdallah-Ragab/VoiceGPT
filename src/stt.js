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
    disableControlButtons();

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
    function disableControlButtons () {
        voiceGPTExtensionMicButton.classList.add('disabled');
        voiceGPTExtensionPlayPauseButton.classList.add('disabled');
        voiceGPTExtensionStopButton.classList.add('disabled');
    }
    function enableControlButtons () {
        voiceGPTExtensionMicButton.classList.remove('disabled');
        voiceGPTExtensionPlayPauseButton.classList.remove('disabled');
        voiceGPTExtensionStopButton.classList.remove('disabled');
    }
    function toggleVoiceGPTVisability () {
        voiceGPTComponent.classList.toggle('vgpt-hidden');
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
        enableControlButtons();
        
        chatGPTSubmitButton.addEventListener('click', () => {
            uiPauseRecognition();
            uiClearPrompt();
        });
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
    voiceGPTCloseButton.addEventListener('click', () => {
        toggleVoiceGPTVisability();
    });
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.message === 'toggleVoiceGPTVisability') {
            toggleVoiceGPTVisability();
        }
    });
});