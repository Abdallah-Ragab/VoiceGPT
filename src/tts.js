document.addEventListener('ExtensionRenderedEvent', (e) => {
    function childIndex(child) {
        return child?.parentElement?.childNodes ? Array.prototype.indexOf.call(child.parentElement.childNodes, child) : null;
    };
    function recievingResponse () {
        return document.querySelector(chatGPTSubmitButtonEnabledSelector) ? false : true;
    };
    const hasEventListener = (element, eventName, listener) => {
        const events = element._events || {};
        return events[eventName] && events[eventName].findIndex(l => l.toString() === listener.toString()) !== -1;
    };

    function observeResponsesContainerChange () {
        responsesContainer = getElementByXpath(lastResponseXpath)?.parentElement;
        if (responsesContainer) {
            lastResponseObject = new Response(lastResponseElement);
            responsesContainerObserver.observe(responsesContainer, { childList: true, subtree: true });
        } else {
            setTimeout(() => {
                observeResponsesContainerChange();
            }, 200);
        }
    };
    const responsesContainerObserver = new MutationObserver((mutations) => {
        const oldLastResponse = lastResponseElement;
        const newLastResponse = getElementByXpath(lastResponseXpath);

        lastResponseElement = newLastResponse;

        if (childIndex(oldLastResponse) !== childIndex(newLastResponse)) {
            resetLastResponseObject();
        }

        handleContentChange();
    });
    
    function observeChatGPTRegenrateResponseButtonContainer () {
        if (chatGPTRegenrateResponseButtonContainer) {
            chatGPTRegenrateResponseButtonContainerObserver.observe(chatGPTRegenrateResponseButtonContainer, { childList: true, subtree: true });
        }
    }
    const chatGPTRegenrateResponseButtonContainerObserver = new MutationObserver((mutations) => {
        const regenerateResponseButton = getElementByXpath(regenerateResponseButtonXpath);
        if (regenerateResponseButton) {
            if (!hasEventListener(regenerateResponseButton, 'click', resetLastResponseObject)) {
                regenerateResponseButton.addEventListener('click', resetLastResponseObject);
                handleContentChange();
                console.log('RESPONSE COMPLETE: ', lastResponseObject.textChunks);
            }
        }
    });
    function resetLastResponseObject () {
        lastResponseObject = new Response(lastResponseElement);
    };

    function handleContentChange() {
        let newLastResponseChuncks = lastResponseObject.readTextChunks();
        if (recievingResponse()) {
            newLastResponseChuncks.splice(-1,1)
        }
        lastResponseObject.appendTextChunks(newLastResponseChuncks);
    }
    class Response {
        constructor (responseElement) {
            if (!responseElement) {
                console.error('Response Construction Failed: Invalid Response Element.');
                return;
            }
            this.responseElement = responseElement;
            console.info('New Response Object Created.');
            this.textChunks = [];
            speaker.terminate();
        }
        readTextChunks () {
            let responseMarkdown = this.responseElement?.querySelector('.markdown');
            let innerTextChunks = [];

            for (let i = 0; i < responseMarkdown?.childNodes.length; i++) {
                const child = responseMarkdown?.childNodes[i];
                if (child?.nodeName === 'OL' || child?.nodeName === 'UL') {
                    for (let j = 0; j < child?.childNodes.length; j++) {
                        const listChild = child?.childNodes[j];
                        innerTextChunks.push(listChild?.innerText);
                    }
                } else {
                    if (child?.nodeName === 'PRE') {
                        innerTextChunks.push('');
                    } else if (child?.classlist?.contains('math')){
                        console.log('MATH: ', child?.innerText);
                        continue;
                    } else{
                        innerTextChunks.push(child?.innerText);
                    }
                }
            }
            return innerTextChunks;
        }
        appendTextChunks (textChunks) {
            if (typeof textChunks === 'string') {
                this.addChunk(textChunks);
            } else if (Array.isArray(textChunks)) {
                for (let i = 0; i < textChunks.length; i++) {
                    const chunk = textChunks[i];
                    this.addChunk(chunk);
                }
            }
        }
        addChunk (chunk) {
            if (!this.textChunks.includes(chunk)) {
                this.textChunks.push(chunk);
                console.log('New Text added: ', chunk);
                if(enableReadResponse){
                    speaker.enqueue(chunk);
                }
            }
        }
    };
    class SpeechManager {
        constructor (lang = 'en-US', rate = 1.0, pitch = 1.0, volume = 1.0, voice_index = 3) {
            this.speechSynthesis = speechSynthesis;
            this.speechSynthesisUtterance = new SpeechSynthesisUtterance();
            this.speechSynthesisUtterance.lang = lang;
            this.speechSynthesisUtterance.rate = rate;
            this.speechSynthesisUtterance.pitch = pitch;
            this.speechSynthesisUtterance.volume = volume;
            this.speechSynthesisUtterance.voice = this.localVoices()[voice_index];
            this.speechSynthesisUtterance.text = '';
            this.queue = [];
        }
        start () {
            this.stop();
            this.speechSynthesis.speak(this.speechSynthesisUtterance);
            this.uiPlayPause()
        }
        stop () {
            this.speechSynthesis.cancel();
        }
        terminate () {
            console.log('Terminating Speech Manager...');
            this.stop();
            this.uiPlayPause()
            this.clearQueue();
        }

        pause () {
            console.log('Pausing Speech Manager...');
            this.speechSynthesis.pause();
            this.uiPlayPause()
        }
        resume () {
            this.speechSynthesis.resume();
            this.uiPlayPause()
        }
        clearQueue () {
            this.queue = [];
        }
        localVoices () {
            return this.speechSynthesis.getVoices().filter(voice => voice.localService);
        }
        addTextToQueue (text) {
            // break text into sentences by . , ! ? : ;
            let sentences = text.split(/(?<=[.!?,:;])\s+/);
            for (let i = 0; i < sentences.length; i++) {
                if (sentences[i].trim() === '') {continue}
                const sentence = sentences[i];
                this.queue.push(sentence);
            }
        }
        processQueue () {
            if (this.queue.length > 0) {
                console.log('Reading next item in queue...');
                console.log('Queue: ', this.queue);
                this.speechSynthesisUtterance.text = this.queue[0];
                this.start();
                this.speechSynthesisUtterance.onend = () => {
                    console.log('Speech ended.');
                    this.queue.splice(this.playing, 1);
                    this.processQueue();
                }
            }
            else {
                this.terminate();
            }
        }
        startIfNotPlaying () {
            if (!this.speechSynthesis.speaking) {
                console.log('Starting Speech Manager...');
                this.processQueue();
            } else {
                console.log('Speech Manager already running.');
            }
        }
        enqueue(text) {
            this.addTextToQueue(text);
            this.startIfNotPlaying();
        }
        setRate (rate) {
            if (rate < 0.1 ) rate = 0.1;
            if (rate > 4) rate = 4;
            this.speechSynthesisUtterance.rate = rate;
            return rate;
        }
        setPitch (pitch) {
            this.speechSynthesisUtterance.pitch = pitch;
        }
        setVolume (volume) {
            this.speechSynthesisUtterance.volume = volume;
        }
        setVoice (voice) {
            this.speechSynthesisUtterance.voice = voice;
        }
        setVoiceByIndex (index) {
            if (index < 0 || index >= this.localVoices().length) return;
            this.speechSynthesisUtterance.voice = this.localVoices()[index];
        }
        setVoiceByLang (lang) {
            this.speechSynthesisUtterance.voice = this.localVoices().filter(voice => voice.lang === lang)[0];
        }
        uiPlayPause () {
            let notPlaying = speaker.speechSynthesis.paused || !speaker.speechSynthesis.speaking;
            console.log('Is Speech Playing : ', !notPlaying);
            voiceGPTExtensionPlayPauseButton.setAttribute('state', notPlaying ? 'play' : 'pause');
            if (notPlaying) {
                voiceGPTExtensionPlayPauseButton.classList.remove('active');
            } else if (!notPlaying) {
                voiceGPTExtensionPlayPauseButton.classList.add('active');
            }
        }
    }


    let lastResponseElement
    let lastResponseObject
    let speaker
    let enableReadResponse = true;
    let defaultVoiceIndex = 0;


    speechSynthesis.onvoiceschanged = () => {
        speaker = new SpeechManager();
        populateVoiceSelect();
        setReadOption();
        setReadSpeed();
        setVoice();
    }

    document.addEventListener('ChatGPTFinishedLoadingEvent', (e) => {
        observeResponsesContainerChange();
        observeChatGPTRegenrateResponseButtonContainer();
    });

    function switchReadOption () {
        let state = voiceGPTReadOption.getAttribute('state');
        let newState = state === 'on' ? 'off' : 'on';
        voiceGPTReadOption.setAttribute('state', newState);
    }
    function setReadOption () {
        let state = voiceGPTReadOption.getAttribute('state');
        if (state === 'on') {
            enableReadResponse = true;
        } else if (state === 'off') {
            enableReadResponse = false;
        }
        console.log('enableReadResponse: ' + enableReadResponse);
    }
    function setReadSpeed () {
        let speed = voiceGPTReadSubOptionInput.value;
        let newSpeed = speaker.setRate(speed);
        console.log('Read Speed: ' + newSpeed);
    }
    function populateVoiceSelect() {
        const voiceSelect = voiceGPTReadSubOptionSelect;
        const voices = speaker.localVoices();
        for (let i = 0; i < voices.length; i++) {
            const voice = voices[i];
            const option = document.createElement('option');
            option.textContent = voice.name + ' (' + voice.lang + ')';
            option.value = i;
            voiceSelect.appendChild(option);
        }
        voiceSelect.selectedIndex = defaultVoiceIndex;
    }
    function setVoice () {
        const voiceSelect = voiceGPTReadSubOptionSelect;
        const index = voiceSelect.selectedIndex;
        speaker.setVoiceByIndex(index);
        console.log('Voice: ' + speaker.localVoices()[index].name);
    }

    voiceGPTReadOptionCheckbox.addEventListener('click', (e) => {
        switchReadOption();
        setReadOption();
    });
    voiceGPTReadSubOptionInput.addEventListener('change', (e) => {
        setReadSpeed();
    });
    voiceGPTReadSubOptionSelect.addEventListener('change', (e) => {
        setVoice();
    });
    voiceGPTExtensionPlayPauseButton.addEventListener('click', (e) => {
        if (!speaker.speechSynthesis.paused) {
            speaker.pause();
        } else {
            speaker.resume();
        }
    });
    voiceGPTExtensionStopButton.addEventListener('click', (e) => {
        speaker.terminate();
    });
});
