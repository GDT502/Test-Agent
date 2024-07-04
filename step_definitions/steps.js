const { Given, When } = require('@cucumber/cucumber');
const { webkit } = require('playwright');

let page; // Declare page globally to use in different steps

Given('I open {string}', { timeout: 10000 }, async (url) => {
  let browser;
  try {
    browser = await webkit.launch({ headless: false });
    page = await browser.newPage(); // Assign to the global variable

    page.on('console', msg => console.log(`PAGE LOG: ${msg.text()}`));
    await page.goto(url);

    const elements = await page.evaluate(async () => {
      const extractDetails = async (xpath, type) => {
        const elements = [];
        const iterator = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
        let element = iterator.iterateNext();
        
        while (element) {
          const xpath = getElementXPath(element); // Function to get XPath of an element
          console.log(`XPath: ${xpath}`); // Log the XPath to the terminal
          elements.push({
            type,
            text: element.innerText || element.placeholder || '',
            xpath,
            ...(type === 'link' && { href: element.href }),
          });
          element = iterator.iterateNext();
        }
        return elements;
      };

      const getElementXPath = (el) => {
        // Check if the element is a link and use the text() function for XPath
        if (el.tagName.toLowerCase() === 'a') {
          const text = el.textContent.trim();
          return `//*[text()="${text}"]`;
        }
        // Fallback to ID-based XPath or other sophisticated XPath generation
        if (el.id) return `//*[@id="${el.id}"]`;
        return '';
      };

      const buttons = await extractDetails('//button', 'button');
      const inputs = await extractDetails('//input', 'input');
      const links = await extractDetails('//a', 'link');

      return [...buttons, ...inputs, ...links];
    });

    // Additional steps or logic can be added here
  } catch (error) {
    console.error('Error during page interaction:', error);
    // Error handling logic can be added here
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});