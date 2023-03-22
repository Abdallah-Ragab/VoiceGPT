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
    function resetLastResponseObject () {
        lastResponseObject = new Response(lastResponseElement);
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
            console.log ('New response added to the responses container.');
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
    function handleContentChange() {
        let newLastResponseChuncks = lastResponseObject.readTextChunks();
        if (recievingResponse()) {
            newLastResponseChuncks.splice(-1,1)
        }
        lastResponseObject.appendTextChunks(newLastResponseChuncks);
    }
    class Response {
        constructor (responseElement) {
            if (!responseElement) {console.error('Response Construction Failed: Invalid Response Element.'); return}
            this.responseElement = responseElement;
            console.info('New Response Object Created.');
            this.textChunks = [];
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
                } else if (child?.nodeName !== 'PRE') {
                    if (child?.classlist?.contains('math')){console.log('MATH: ', child?.innerText) }
                    innerTextChunks.push(child?.innerText);
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
                console.log('New chunk added: ', chunk);
                speaker.enqueue(chunk);
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
            console.log('Available Voices: ', this.localVoices());
            console.log('Voice: ', this.speechSynthesisUtterance.voice);
        }
        start () {
            // this.refreshSpeechManager();
            this.speechSynthesis.speak(this.speechSynthesisUtterance);
        }
        stop () {
            console.log('Stopping Speech Manager...');
            this.speechSynthesis.cancel();
        }
        pause () {
            this.speechSynthesis.pause();
        }
        resume () {
            this.speechSynthesis.resume();
        }
        clearQueue () {
            this.queue = [];
        }
        localVoices () {
            return this.speechSynthesis.getVoices().filter(voice => voice.localService);
        }
        refreshSpeechManager () {
            console.log('Refreshing Speech Manager...');
            this.stop();
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
                    this.queue.splice(this.playing, 1);
                    this.processQueue();
                }
            }
            else {
                this.stop();
            }
        }
        startIfNotPlaying () {
            if (!this.speechSynthesis.speaking) {
                console.log('Speech Synthesis is not playing. Starting...');
                this.processQueue();
            } else {
                console.log('Speech Synthesis is already playing.');
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
        console.log('Populating Voice Select...');
        const voiceSelect = voiceGPTReadSubOptionSelect;
        const voices = speaker.localVoices();
        console.log('Available Voices: ', voices);
        for (let i = 0; i < voices.length; i++) {
            console.log('Voice: ', voices[i]);
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
});
