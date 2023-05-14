/**
 * Create a instance of the SeaSideJS application
 * @version 1.0.0
 * @class SeaSideJS
 * @since 2023-05-05
 */

import { compileTemplate, diffTemplate } from './template'
import { reactive } from './reactive'
import murmurHash32 from '@/utils/murmurhash'

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
        this._methods = options.methods
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
            let instanceHash = murmurHash32(window.location.href + '_instance_sea_side_js_' + Math.random().toString(36))
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
                const app = document.querySelector('#app_' + instanceHash + '_sea_side_js') as HTMLElement;
                if (app) {
                    const { node, idMap, nodeTree } = compileTemplate(template, SeaSideJS._data, SeaSideJS._methods);

                    // div wrapper
                    const div = document.createElement('div');
                    div.setAttribute('id', 'app_' + instanceHash + '_sea_side_js');
                    div.appendChild(node);

                    // call recompileTemplate with app and div
                    diffTemplate(app, div, nodeTree, idMap);

                    // console.log('data changed', app, div);
                }
            });
            // compile the template
            const { node, idMap, nodeTree } = compileTemplate(template, SeaSideJS._data, SeaSideJS._methods);
            // create a div element
            const app = document.createElement('div')
            app.setAttribute('id', 'app_' + instanceHash + '_sea_side_js')
            app.appendChild(node)
            // append the template to the root element
            const appendAppToRoot = () => {
                const root = document.querySelector(this._root);
                if (root) {
                    root.appendChild(app);
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