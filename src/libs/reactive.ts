/**
 * Create a reactive object Or Create a reactive value.
 * @version 1.0.0
 * @since 2023-05-04
 */

export const subscribersMap = new WeakMap<object, Map<PropertyKey, Set<(value: any) => void>>>()

/**
 * Create a reactive object.
 * @returns {Reactive<WrappedValue<any>>} - The reactive object.
 */
function reactive(callback?: Function): Reactive<WrappedValue<any>>

/**
 * Create a reactive object.
 * @param {T} data - The object to be made reactive.
 * @returns {Reactive<T>} - The reactive object.
 */
function reactive<T extends object>(data: T, callback?: Function): Reactive<T>

/**
 * Create a reactive object.
 * @param {T} data - The value to be made reactive.
 * @returns {ReactiveData<T>} - The reactive object.
 */
function reactive<T extends NonObject<any>>(data: T, callback?: Function): Reactive<WrappedValue<T>>

function reactive<T extends object>(data?: T, callback?: Function): Reactive<T> {
    if (typeof data !== 'object' || data === null || data === undefined) {
        data = { value: data, __isWrappedValue: true } as unknown as T
    }

    const subscribers: Map<PropertyKey, Set<(value: any) => void>> = new Map()

    const handler: ProxyHandler<T> = {
        get(target, key, receiver): any {
            const result = Reflect.get(target, key, receiver)
            // console.log('get', key, result)
            return typeof result === 'object' && result !== null ? (callback ? reactive(result, callback) : reactive(result)) : result
        },
        set(target: { [key: string]: any }, key: PropertyKey, value: any, receiver: any): boolean {
            // if value is not changed, return true
            if (target[key as keys<PropertyKey>] === value) {
                return true
            }
            const result = Reflect.set(target, key, value, receiver);
            // console.log('set', key, value);

            // Trigger callbacks when the proxy object's value changes
            const proxySubscribers = subscribersMap.get(receiver);
            if (proxySubscribers) {
                const keySubscribers = proxySubscribers.get(key);
                if (keySubscribers) {
                    keySubscribers.forEach((callback) => callback(value));
                }
            }

            // Trigger callbacks that user passed in
            if (callback) {
                callback(value)
            }

            return result;
        }
    }

    const proxy = new Proxy(data, handler) as Reactive<T>
    subscribersMap.set(proxy, subscribers)

    return proxy
}

export { reactive }