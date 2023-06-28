/**
 * Create a instance of the SeaSideJS application
 * @version 1.0.0
 * @class SeaSideJS
 * @since 2023-05-05
 */

import { compileTemplate, diffTemplate } from './template'
import { reactive } from './proxy'

class SeaSideJS {
    private _root!: string
    static _template: string | DocumentFragment
    static _data: object
    static _methods: { [key: string]: (...args: any[]) => any }
    static _mounted?: () => void

    /**
     * Create a instance of the SeaSideJS application
     * @param {SeaSideJSOptions} options - The options of the SeaSideJS application
     * @returns {SeaSideJS} - The instance of the SeaSideJS application
     * @memberof SeaSideJS
     * @since 2023-05-05
     */
    static createApp(options: SeaSideJSOptions): SeaSideJS {
        this._template = options.template
        this._data = options.data()
        this._methods = options.methods || {}
        if (options.mounted) this._mounted = options.mounted
        return new SeaSideJS()
    }

    /**
     * Get the root element of the SeaSideJS application
     * @returns {string} - The root element of the SeaSideJS application
     * @memberof SeaSideJS
     */
    get root(): string {
        return this._root
    }

    /**
     * Get the template of the SeaSideJS application
     * @returns {string | DocumentFragment} - The template of the SeaSideJS application
     * @memberof SeaSideJS
     */
    get template(): string | undefined | DocumentFragment {
        return SeaSideJS._template
    }

    /**
     * mount the SeaSideJS application to the root element
     * @param {string} root - The root element of the SeaSideJS application
     * @memberof SeaSideJS
     */
    mount(root: string): SeaSideJS {
        this._root = root
        if (SeaSideJS._template) {
            const templateElement = document.createElement('template')
            // if template is a string, import it
            if (typeof SeaSideJS._template === 'string') {
                templateElement.innerHTML = SeaSideJS._template
            } else {
                templateElement.content.appendChild(SeaSideJS._template)
            }
            const template = templateElement.content
            // Wrap data object and set a callback for data changes
            SeaSideJS._data = reactive(SeaSideJS._data, () => {
                // get element via attr
                const app = document.querySelector('[data-v-app]') as HTMLElement | null
                if (app) {
                    const { node, idMap, nodeTree } = compileTemplate(template, SeaSideJS._data, SeaSideJS._methods);

                    // attr wrapper
                    const newApp = document.createElement('div');
                    newApp.appendChild(node);
                    newApp.setAttribute('data-v-app', '');

                    // call recompileTemplate with app and div
                    diffTemplate(app, newApp, nodeTree, idMap);

                    // console.log('data changed', app, div);
                }
            });
            // compile the template
            const { node, idMap, nodeTree } = compileTemplate(template, SeaSideJS._data, SeaSideJS._methods);
            // set attr to the root element
            const app = document.createElement('div');
            app.appendChild(node);
            app.setAttribute('data-v-app', '');
            // append the template to the root element
            const appendAppToRoot = () => {
                const root = document.querySelector(this._root);
                if (root) {
                    root.appendChild(app);
                    if (SeaSideJS._mounted) {
                        // bind methods and data to the mounted function
                        SeaSideJS._mounted = SeaSideJS._mounted.bind(SeaSideJS._data)
                        SeaSideJS._mounted = SeaSideJS._mounted.bind(SeaSideJS._methods)
                        SeaSideJS._mounted()
                    }
                }
            };
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', appendAppToRoot);
            } else {
                appendAppToRoot();
            }
        }
        return this
    }
}

export { SeaSideJS }