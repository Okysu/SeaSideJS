/**
 * Creating two-way data binding using a specific method.
 * @version 1.0.0
 * @since 2023-05-04
 */
import { subscribersMap } from './reactive'

// event map
const elementEventMap = new Map([
    ['input', 'input'],
    ['textarea', 'input'],
    ['select', 'change'],
    ['img', 'load']
])

/**
 * set attribute or property
 * @param target - target element
 * @param scope  - attribute or property
 * @param value  - value
 */
export function setAttributeOrProperty(target: HTMLElement, scope: string, value: any) {
    if (scope === 'class') {
        target.classList.add(value);
    } else if (scope === 'style') {
        Object.assign(target.style, value);
    } else {
        target.setAttribute(scope, value);
    }
}



/**
 * get element event
 * @param element - target element
 * @returns event name
 */
export function getElementEvent(element: HTMLElement): string | undefined {
    for (const [type, event] of elementEventMap.entries()) {
        if (element.tagName.toLowerCase() === type) {
            return event
        }
    }
    return undefined
}


/**
 * use model to create two-way data binding
 * @param reactiveData - proxy reactive object
 * @param key  - proxy reactive object key
 * @param target - target element
 * @param scope - attribute or property
 * @returns unbind function to remove the listener
 */
function useModel(reactiveData: Reactive<any>, key: keys<Reactive<any>>, target: HTMLElement, scope: string): () => void {
    // initialize the value
    setAttributeOrProperty(target, scope, reactiveData[key])

    const proxySubscribers = subscribersMap.get(reactiveData)
    if (proxySubscribers) {
        if (!proxySubscribers.has(key)) {
            proxySubscribers.set(key, new Set())
        }
        proxySubscribers.get(key)!.add((value: any) => {
            setAttributeOrProperty(target, scope, value)
        })
    }

    // get event type
    const eventType = getElementEvent(target)
    if (!eventType) {
        // just set the value
        return () => { }
    }
    // add event listener
    const eventHandler = (e: Event) => {
        if (scope in target) {
            reactiveData[key] = (e.target as any)[scope]
        } else {
            reactiveData[key] = target.getAttribute(scope)
        }
    }
    target.addEventListener(eventType, eventHandler)
    // return unbind function
    const destroy = () => {
        if (proxySubscribers) {
            const keySubscribers = proxySubscribers.get(key)
            if (keySubscribers) {
                keySubscribers.clear()
            }
        }
        target.removeEventListener(eventType, eventHandler)
    }
    return destroy
}

/**
 * use proxy model to create two-way data binding
 * @param proxy1 - proxy reactive object
 * @param key1  - proxy reactive object key
 * @param proxy2  - proxy reactive object
 * @param key2  - proxy reactive object key
 * @returns 
 */
function useProxyModel(proxy1: Reactive<any>, key1: keys<Reactive<any>>, proxy2: Reactive<any>, key2: keys<Reactive<any>>): () => void {
    const proxySubscribers1 = subscribersMap.get(proxy1)
    const proxySubscribers2 = subscribersMap.get(proxy2)

    if (proxySubscribers1 && proxySubscribers2) {
        if (!proxySubscribers1.has(key1)) {
            proxySubscribers1.set(key1, new Set())
        }
        if (!proxySubscribers2.has(key2)) {
            proxySubscribers2.set(key2, new Set())
        }
        proxySubscribers1.get(key1)!.add((value: any) => {
            proxy2[key2] = value
        })
        proxySubscribers2.get(key2)!.add((value: any) => {
            proxy1[key1] = value
        })
    }

    // return unbind function
    const destroy = () => {
        if (proxySubscribers1) {
            const keySubscribers = proxySubscribers1.get(key1)
            if (keySubscribers) {
                keySubscribers.clear()
            }
        }
        if (proxySubscribers2) {
            const keySubscribers = proxySubscribers2.get(key2)
            if (keySubscribers) {
                keySubscribers.clear()
            }
        }
    }

    return destroy
}

export { useModel, useProxyModel }