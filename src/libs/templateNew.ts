import { updateScheduler } from "./scheduler/updater";

const Templatescheduler = new updateScheduler()

export { Templatescheduler }

/**
 * Compile a template and return a node
 * @param {Node} template
 * @param {{ [key: string]: any }} data
 * @param {{ [key: string]: any }} methods
 * @returns {Node} render template
 */
function compile(template: Node, data: { [key: string]: any }, methods: { [key: string]: any }): Node {
  const compileTemplate = template.cloneNode(true);

  // bind data to each method
  for (const key in methods) {
    if (methods.hasOwnProperty(key)) {
      methods[key] = methods[key].bind(data);
    }
  }
}

/**
 * Translate a template to a node tree
 * @param {Node} singleNode
 * @param {String} namespace
 * @param {{ [key: string]: any }} data
 * @param {{ [key: string]: any }} methods
 * @returns {Node} render singleNode
 */
function translate(singleNode: Node, namespace: string, data: { [key: string]: any }, methods: { [key: string]: any }): Node {
  let counter = 1;
  const attrCode = `data-node-${namespace}-${counter++}}`;
  const element = singleNode as HTMLElement;
  // set attribute to element
  if (element.setAttribute) {
    element.setAttribute(attrCode, '');
  }

  // run code to get value
  const syntaxCode = (code: string, data: { [key: string]: any }, methods: { [key: string]: any }): any => {
    const fn = new Function("data", "methods", `with(data) { with(methods) { return ${code}; } }`);
    const value = fn(data, methods);
    return value;
  };

  if (element.nodeType === Node.TEXT_NODE) {
    // insert syntax {{}} parser
    let text = singleNode.textContent;
    if (text) {
      const regex = /{{\s*((?:.|\n)+?)\s*}}/g;
      const matches = text.matchAll(regex);
      for (const match of matches) {
        const code = match[1]; // get the inner code
        try {
          // replace the syntax {{}} with the value
          const value = syntaxCode(code, data, methods);
          text = text.replace(match[0], value !== undefined ? value : match[0]);
          // set the callback when the referenced data changes
          
        } catch (error) {
          console.error(`Error executing code '${code}' in template:`, error);
        }
      }
    }
  }
}