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
        // clearTimeout(afterResponseComplete);

        const oldLastResponse = lastResponseElement;
        const newLastResponse = getElementByXpath(lastResponseXpath);
                
        lastResponseElement = newLastResponse;
        
        if (childIndex(oldLastResponse) !== childIndex(newLastResponse)) {
            console.log ('New response added to the responses container.');
            resetLastResponseObject();
        } 

        handleContentChange();
        // afterResponseComplete = setTimeout(() => {
        //     handleContentChange();
        //     console.log('RESPONSE COMPLETE: ', lastResponseObject.textChunks);
        // }, 5000);
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
            if (!this.textChunks.includes(chunk)) {this.textChunks.push(chunk); console.log('New chunk added: ', chunk);}
        }
    };

    let lastResponseElement
    let lastResponseObject
    let afterResponseComplete = null;

    document.addEventListener('ChatGPTFinishedLoadingEvent', (e) => {
        observeResponsesContainerChange();
        observeChatGPTRegenrateResponseButtonContainer();
    });

});