/**
 * Using templates to quickly create elements
 * @version 1.0.0
 * @since 2023-05-05
 */

import { setAttributeOrProperty, getElementEvent } from './useModel'

export const updaters: (() => void)[] = [];

/**
 * Create a template
 * @param {string} template - The template string
 * @returns {DocumentFragment} - The template
 */
function createTemplate(template: string): DocumentFragment {
    const templateElement = document.createElement('template')
    templateElement.innerHTML = template
    return templateElement.content
}

/**
 * Get the template
 * @param selectors - The selectors
 * @returns {DocumentFragment} - The template
 */
function getTemplate<K extends keyof HTMLElementTagNameMap>(selectors: K): DocumentFragment {
    const element = document.querySelector(selectors) as HTMLTemplateElement
    if (element) {
        return element.content
    }
    return document.createDocumentFragment()
}


/**
 * Node information
 */
interface NodeInfo {
    node: Node;
    attrs: NamedNodeMap | null;
    events: { [key: string]: any };
}

/**
 * Generate node tree
 * @param node node to be processed
 * @param idMap collection of node id
 * @param nodeTree node tree
 * @param idCounter node id counter
 */
function generateNodeTree(node: Node, idMap: Map<Node, string>, nodeTree: { [key: string]: NodeInfo }, idCounter: { value: number }): void {
    if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) {
        const id = `node-${idCounter.value++}`;
        const attrs = node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement).attributes : null;
        const events = {}; // TODO: Collect events from the node
        nodeTree[id] = { node, attrs, events };
        idMap.set(node, id);
    }

    node.childNodes.forEach((childNode) => generateNodeTree(childNode, idMap, nodeTree, idCounter));
}



/**
 * Compile the template
 * @param {Node} template - The template
 * @param {object} data - The data
 * @param {object} methods - The methods
 * @returns {object} - The compiled template
 * TODO: Add support for loops and fix the bug that for loops arguments will be first text complied
 */
function compileTemplate(template: Node, data: { [key: string]: any }, methods: { [key: string]: (...args: any[]) => any }): { node: Node, idMap: Map<Node, string>, nodeTree: { [key: string]: NodeInfo } } {
    const compiledTemplate = template.cloneNode(true);

    // Bind data to each method
    for (const key in methods) {
        methods[key] = methods[key].bind(data);
    }

    const idMap = new Map<Node, string>();
    const nodeTree: { [key: string]: NodeInfo } = {};
    generateNodeTree(compiledTemplate, idMap, nodeTree, { value: 0 });

    function replaceContent(node: Node) {

        if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName.toLowerCase() === 'nocompile') {
            // del nocompile tag, but not del the child node
            const childNodes = node.childNodes;
            const fragment = document.createDocumentFragment();
            for (let i = 0; i < childNodes.length; i++) {
                fragment.appendChild(childNodes[i].cloneNode(true));
            }
            node.parentNode!.replaceChild(fragment, node);
            return; // Skip processing for 'nocompile' elements
        }

        if (node.nodeType === Node.TEXT_NODE) {
            const regex = /{{\s*((?:.|\n)+?)\s*}}/g;
            const originalTextContent = node.textContent!;
            const updater = () => {
                let result = originalTextContent;
                let match: any;
                while ((match = regex.exec(originalTextContent)) !== null) {
                    const code = match[1];
                    try {
                        const fn = new Function("data", "methods", `with(data) { with(methods) { return ${code}; } }`);
                        const value = fn(data, methods);
                        result = result.replace(match[0], value !== undefined ? value : match[0]);
                    } catch (error) {
                        console.error(`Error executing code '${code}' in template:`, error);
                    }
                }
                node.textContent = result;
            };
            updaters.push(updater);
            updater(); // Call the updater initially to set the value
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            const nodeId = idMap.get(node);
            if (!nodeId) return
            const { attrs, events } = nodeTree[nodeId];
            if (attrs) {
                Array.from(attrs).forEach(attr => {
                    if (attr.name.startsWith("@")) {
                        // Event binding
                        const eventName = attr.name.substring(1);
                        const handlerCode = attr.value;
                        const handler = methods[handlerCode] || new Function("data", "methods", "event", `with(data) { with(methods) { ${handlerCode} } }`);
                        element.addEventListener(eventName, (event) => handler(data, methods, event));
                        element.removeAttribute(attr.name);
                        events[eventName] = handler; // Add the event handler to the nodeTree
                    } else if (attr.name.startsWith(":")) {
                        // Attribute binding
                        const scope = attr.name.substring(1);
                        const valueCode = attr.value;
                        const updater = () => {
                            try {
                                const fn = new Function("data", "methods", `with(data) { with(methods) { return ${valueCode}; } }`);
                                const value = fn(data, methods);
                                setAttributeOrProperty(element, scope, value);
                            } catch (error) {
                                console.error(`Error executing code '${valueCode}' in template:`, error);
                            }
                        };
                        updaters.push(updater);
                        updater(); // Call the updater initially to set the value
                        element.removeAttribute(attr.name);
                    } else if (attr.name.startsWith("#model")) {
                        // Model binding
                        let scope: string;
                        if (attr.name === "#model") {
                            scope = "value";
                        } else if (attr.name.startsWith("#model:")) {
                            scope = attr.name.substring(7);
                        }
                        // Two-way data binding
                        const support = ["input", "select", "textarea"];
                        if (support.includes(element.tagName.toLowerCase())) {
                            const valueCode = attr.value;
                            const updater = () => {
                                try {
                                    const fn = new Function("data", "methods", `with(data) { with(methods) { return ${valueCode}; } }`);
                                    const value = fn(data, methods);
                                    setAttributeOrProperty(element, scope, value);
                                } catch (error) {
                                    console.error(`Error executing code '${valueCode}' in template:`, error);
                                }
                            };
                            updaters.push(updater);
                            updater(); // Call the updater initially to set the value
                            // Listen to the change event
                            // Get event type
                            const eventType = getElementEvent(element);
                            if (!eventType) {
                                return;
                            }
                            // Change the variable value, use New Function
                            const handler = (event: Event) => {
                                let value = (event.target as any).value;
                                if (value) {
                                    const fn = new Function("data", "methods", `with(data) { with(methods) { ${valueCode} = "${value}"; } }`);
                                    fn(data, methods);
                                } else {
                                    const fn = new Function("data", "methods", `with(data) { with(methods) { ${valueCode} = ""; } }`);
                                    fn(data, methods);
                                }
                            };
                            element.addEventListener(eventType, handler);
                            events[eventType] = handler; // Add the event handler to the nodeTree
                        }
                        element.removeAttribute(attr.name);
                    } else if (attr.name === "#show") {
                        // Conditional show
                        const showCode = attr.value;
                        const showUpdater = () => {
                            try {
                                const fn = new Function("data", "methods", `with(data) { with(methods) { return ${showCode}; } }`);
                                const value = fn(data, methods);
                                if (value) {
                                    element.style.display = "";
                                } else {
                                    element.style.display = "none";
                                }
                            } catch (error) {
                                console.error(`Error executing code '${showCode}' in #show directive:`, error);
                            }
                        };
                        updaters.push(showUpdater);
                        showUpdater(); // Call the updater initially to set the value
                        element.removeAttribute("#show");
                    } else if (attr.name === "#if") {
                        // Conditional rendering
                        // TODO: Support #else and #else-if
                        const ifCode = attr.value;
                        const placeholder = document.createComment("sea-placeholder");
                        let hasBeenInserted = true;
                        const ifUpdater = () => {
                            try {
                                const fn = new Function("data", "methods", `with(data) { with(methods) { return ${ifCode}; } }`);
                                const value = fn(data, methods);
                                if (value && !hasBeenInserted) {
                                    placeholder.parentNode!.insertBefore(element, placeholder);
                                    placeholder.parentNode!.removeChild(placeholder);
                                    hasBeenInserted = true;
                                } else if (!value && hasBeenInserted) {
                                    element.parentNode!.insertBefore(placeholder, element);
                                    element.parentNode!.removeChild(element);
                                    hasBeenInserted = false;
                                }
                            } catch (error) {
                                console.error(`Error executing code '${ifCode}' in #if directive:`, error);
                            }
                        };
                        updaters.push(ifUpdater);
                        ifUpdater(); // Call the updater initially to set the value
                        element.removeAttribute("#if");
                    } else if (attr.name === "#for") {
                        // List rendering
                        const forCode = attr.value;
                        const forRegex = /^\s*(\w+)\s+in\s+((?:.|\n)+?)\s*$/;
                        const forMatch = forRegex.exec(forCode);
                        if (forMatch) {
                            const itemName = forMatch[1];
                            const listCode = forMatch[2];
                            const placeholder = document.createComment("sea-placeholder-for");
                            element.parentNode!.insertBefore(placeholder, element);
                            element.removeAttribute("#for");
                            element.parentNode!.removeChild(element);
                            const forUpdater = () => {
                                try {
                                    const fn = new Function("data", "methods", `with(data) { with(methods) { return ${listCode}; } }`);
                                    const list = fn(data, methods);
                                    if (Array.isArray(list)) {
                                        const fragment = document.createDocumentFragment();
                                        list.forEach((itemData, index) => {
                                            const clonedNode = element.cloneNode(true) as HTMLElement;
                                            const newData = { ...data, [itemName]: itemData, $index: index };
                                            const compiled = compileTemplate(clonedNode, newData, methods);
                                            fragment.appendChild(compiled.node);
                                        });
                                        // Remove the original element
                                        element.remove();
                                        placeholder.parentNode!.insertBefore(fragment, placeholder.nextSibling);
                                    } else {
                                        console.error(`Error: the value of '${listCode}' is not an array.`);
                                    }
                                } catch (error) {
                                    console.error(`Error executing code '${listCode}' in #for directive:`, error);
                                }
                            };
                            updaters.push(forUpdater);
                            forUpdater(); // Call the updater initially to set the value                            
                        } else {
                            console.error(`Error: Invalid #for directive syntax. Expected format: "item in list".`);
                        }
                    }
                });
            }
            node.childNodes.forEach(childNode => replaceContent(childNode));
        } else {
            node.childNodes.forEach(childNode => replaceContent(childNode));
        }
    }

    replaceContent(compiledTemplate);
    return {
        node: compiledTemplate,
        idMap: idMap,
        nodeTree: nodeTree,
    }
}

/**
 * Diff the template and update the differences
 * @param {Node} oldNode - The old compiled template node
 * @param {Node} newTemplate - The new template
 * @param {Object} nodeTree - The node tree
 * @param {Map} idMap - The id map
 */
export function diffTemplate(oldNode: Node, newTemplate: Node, nodeTree: { [key: string]: NodeInfo }, idMap: Map<Node, string>): void {
    function updateNode(oldNode: Node, newNode: Node) {
        if (oldNode.nodeType === Node.TEXT_NODE && newNode.nodeType === Node.TEXT_NODE) {
            if (oldNode.textContent !== newNode.textContent) {
                oldNode.textContent = newNode.textContent;
            }
        } else if (oldNode.nodeType === Node.ELEMENT_NODE && newNode.nodeType === Node.ELEMENT_NODE) {
            const oldElement = oldNode as HTMLElement;
            const newElement = newNode as HTMLElement;

            if (oldElement.tagName !== newElement.tagName) {
                oldElement.replaceWith(newElement.cloneNode(true));
                return;
            }

            const oldAttrs = Array.from(oldElement.attributes);
            const newAttrs = Array.from(newElement.attributes);

            oldAttrs.forEach(attr => {
                if (!newElement.hasAttribute(attr.name)) {
                    oldElement.removeAttribute(attr.name);
                }
            });

            newAttrs.forEach(attr => {
                if (oldElement.getAttribute(attr.name) !== attr.value) {
                    oldElement.setAttribute(attr.name, attr.value);
                }
            });

            // Handle special cases for input, textarea, and select elements
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(oldElement.tagName)) {
                const oldInputElement = oldElement as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
                const newInputElement = newElement as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

                if (oldInputElement.value !== newInputElement.value) {
                    oldInputElement.value = newInputElement.value;
                }

                if (oldInputElement.tagName === 'SELECT') {
                    // Handle <select> elements
                    const oldSelectElement = oldElement as HTMLSelectElement;
                    const newSelectElement = newElement as HTMLSelectElement;

                    if (oldSelectElement.selectedIndex !== newSelectElement.selectedIndex) {
                        oldSelectElement.selectedIndex = newSelectElement.selectedIndex;
                    }

                    // change selected option via value
                    const value = newElement.getAttribute('value');
                    if (value) {
                        const option = oldSelectElement.querySelector(`option[value="${value}"]`);
                        if (option) {
                            oldSelectElement.value = value;
                            // change selected option
                            const oldSelectedOption = oldSelectElement.querySelector('option[selected]');
                            if (oldSelectedOption) {
                                oldSelectedOption.removeAttribute('selected');
                            }
                            option.setAttribute('selected', '');
                        }
                    }
                }
            }

            const maxChildCount = Math.max(oldElement.childNodes.length, newElement.childNodes.length);
            for (let i = 0; i < maxChildCount; i++) {
                const oldChildNode = oldElement.childNodes[i];
                const newChildNode = newElement.childNodes[i];

                if (!oldChildNode && newChildNode) {
                    oldElement.appendChild(newChildNode.cloneNode(true));
                } else if (oldChildNode && !newChildNode) {
                    oldElement.removeChild(oldChildNode);
                } else if (oldChildNode && newChildNode) {
                    if (newChildNode.nodeType === Node.COMMENT_NODE && newChildNode.textContent?.startsWith('sea-placeholder')) {
                        if (oldChildNode.nodeType !== Node.COMMENT_NODE || !oldChildNode.textContent?.startsWith('sea-placeholder')) {

                            oldElement.replaceChild(newChildNode.cloneNode(true), oldChildNode);
                        }
                    } else if (oldChildNode.nodeType === Node.COMMENT_NODE && oldChildNode.textContent?.startsWith('sea-placeholder')) {
                        if (newChildNode.nodeType !== Node.COMMENT_NODE || !newChildNode.textContent?.startsWith('sea-placeholder')) {
                            const newOldChildNode = newChildNode.cloneNode(true)
                            // get event listeners from nodeTree
                            const id = idMap.get(newChildNode);
                            const nodeInfo = nodeTree[id!]
                            if (nodeInfo && nodeInfo.events) {
                                Object.keys(nodeInfo.events).forEach(eventName => {
                                    const eventHandler = nodeInfo.events![eventName];
                                    newOldChildNode.addEventListener(eventName, eventHandler);
                                });
                            }
                            oldElement.replaceChild(newOldChildNode, oldChildNode);
                        }
                    } else if (!oldChildNode.isEqualNode(newChildNode)) {
                        updateNode(oldChildNode, newChildNode);
                    }
                }
            }
        }
    }

    updateNode(oldNode, newTemplate);
}

export {
    createTemplate,
    getTemplate,
    compileTemplate
}