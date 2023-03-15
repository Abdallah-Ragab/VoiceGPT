
const fetchPlaceHTML = (element, url) => {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
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