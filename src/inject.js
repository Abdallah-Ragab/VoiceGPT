const fetchPlaceHTML = (element, url, async=false) => {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, async);
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 && xhr.status === 200) {
      placeHTML(element, xhr.responseText);
    }
  };
  xhr.send();
}
const placeHTML = (element, htmlString) => {
  const template = document.createElement('template');
  template.innerHTML = htmlString.trim();
  element.appendChild(template.content);
  const scripts = element.querySelectorAll('script');
  for (const script of scripts) {
      const scriptTag = document.createElement('script');
      const attributes = script.attributes;
      for (const attribute of attributes) {
          scriptTag.setAttribute(attribute.name, attribute.value);
      }
      scriptContent = document.createTextNode(script.innerHTML);
      scriptTag.appendChild(scriptContent);
      script.parentNode.replaceChild(scriptTag, script);
  }
  // replace element with its children
  for (const child of element.childNodes) {
      element.parentNode.insertBefore(child, element);
    }
    element.parentNode.removeChild(element);
}
const replaceElementTags = () => {
  var elements = document.getElementsByTagName('element');
  for (var i = 0; i < elements.length; i++) {
      var element = elements[i];
      var src = element.getAttribute('src');
      fetchPlaceHTML(element, src);
  }
}