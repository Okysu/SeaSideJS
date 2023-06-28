/**
 * data proxy
 * @version 1.0.0
 * @since 2023-05-28
 */

// global actived effect function
let activeEffect: effect | undefined = undefined

// global effect function bucket and stack
const bucketEffect = new WeakMap<Object, Map<string | symbol, Set<effect>>>()
const stackEffect: effect[] = []

// global reactive object map and weakmap
const reactiveMap = new Map()
const reactiveWeakMap = new WeakMap()

// global job queue
const jobQueue = new Set<effect>()
// global job queue promise
let jobQueuePromise: Promise<void> = Promise.resolve()
// global job queue finished flag
let isFlushing = false

/**
 * flush the job queue
 */
function flush() {
  // when flush is called, we don't need to call it again
  if (isFlushing) return
  // set the isFlushing to true
  isFlushing = true
  jobQueuePromise.then(() => {
    // call the job function
    jobQueue.forEach(job => job())
  }).finally(() => {
    // reset the flush flag
    isFlushing = false
  })
}

/**
 * register effect function
 * @param {Function} fn - effect function
 * @param {effectOptions} options - effect function options
 */
export function effect(fn: Function, options?: effectOptions) {
  const effectFn: effect = () => {
    clear(effectFn)
    // when effectFn is called, set the activeEffect to effectFn
    activeEffect = effectFn
    // push the effectFn to the stack
    stackEffect.push(effectFn)
    // call the effect function
    const result = fn()
    // pop the effectFn from the stack
    stackEffect.pop()
    activeEffect = stackEffect[stackEffect.length - 1]
    return result
  }
  effectFn.options = options || {
    scheduler: (effectFn: effect) => {
      // when the effectFn is called, push the effectFn to the job queue
      jobQueue.add(effectFn)
      // flush the job queue
      flush()
    },
    lazy: false
  }
  effectFn.deps = []
  // call effect function
  if (options && !options?.lazy) {
    effectFn()
  }
  return effectFn
}

/**
 * track the reactive object
 * @param {Object} target - reactive object
 * @param {string | symbol} key - reactive object key
 */
export function track(target: object, key: string | symbol) {
  // if activeEffect is undefined, return
  if (!activeEffect) return
  let depsMap = bucketEffect.get(target)
  if (!depsMap) {
    bucketEffect.set(target, (depsMap = new Map()))
  }
  let dep = depsMap.get(key)
  if (!dep) {
    depsMap.set(key, (dep = new Set()))
  }
  // if the activeEffect is not in the dep, add it
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect)
    // add the dep to the activeEffect
    activeEffect.deps.push(dep)
  }
}

/**
 * clear the deps
 * @param {effect} effect - effect function
 */
function clear(effect: effect) {
  // clear the deps
  for (let i = 0; i < effect.deps.length; i++) {
    const dep = effect.deps[i]
    dep.delete(effect)
  }
  // set the deps to empty array
  effect.deps.length = 0
}

/**
 * trigger the reactive object
 * @param {Object} target - reactive object
 * @param {string | symbol} key - reactive object key
 */
export function trigger(target: object, key: string | symbol) {
  const depsMap = bucketEffect.get(target)
  if (!depsMap) return

  const effects = depsMap.get(key)
  const effectsToRun = new Set(effects)
  effects && effects.forEach(effectFn => {
    // avoid maximum call stack size exceeded
    if (effectFn !== activeEffect) {
      effectsToRun.add(effectFn)
    }
  })

  effectsToRun.forEach(effectFn => {
    // if effectFn has scheduler, call it
    if (effectFn.options && effectFn.options.scheduler) {
      effectFn.options.scheduler(effectFn)
    } else {
      effectFn()
    }
  })
}

/**
 * Create a reactive object.
 * @returns {Reactive<WrappedValue<any>>} - The reactive object.
 */
export function reactive(callback?: Function): Reactive<WrappedValue<any>>

/**
 * Create a reactive object.
 * @param {T} target - The object to be made reactive.
 * @returns {Reactive<T>} - The reactive object.
 */
export function reactive<T extends object>(target: T, callback?: Function): Reactive<T>

/**
 * Create a reactive object.
 * @param {T} target - The value to be made reactive.
 * @returns {ReactiveData<T>} - The reactive object.
 */
export function reactive<T extends NonObject<any>>(target: T, callback?: Function): Reactive<WrappedValue<T>>

export function reactive<T extends object>(target?: T, callback?: Function): Reactive<T> {
  // if target is not object, wrap it
  if (typeof target !== 'object' || target === null || target === undefined) {
    target = { value: target, __isWrappedValue: true } as unknown as T
  }
  // if target is reactived, return it
  if (reactiveWeakMap.has(target)) {
    return reactiveWeakMap.get(target)
  }
  // if target is not reactived, reactived it
  const proxy = new Proxy(target, {
    get(target, key, receiver) {
      const res = Reflect.get(target, key, receiver)
      track(target, key)
      return typeof res === 'object' ? reactive(res as object) : res
    },
    set(target, key, value, receiver) {
      // if the value is not equal to the old value, trigger the reactive object
      if (target[key as keys<PropertyKey>] === value) {
        return true
      }

      const res = Reflect.set(target, key, value, receiver)
      trigger(target, key)

      // if the callback is not undefined, call it
      if (callback) {
        const target = reactiveMap.get(receiver)
        const newVal = value
        const oldVal = target[key as keys<PropertyKey>]
        callback(newVal, oldVal)
      }

      // return the result
      return res
    },
    deleteProperty(target, key) {
      const res = Reflect.deleteProperty(target, key)
      trigger(target, key)
      return res
    }
  })
  reactiveWeakMap.set(target, proxy)
  reactiveMap.set(proxy, target)
  return proxy as Reactive<T>
}

/**
 * Computed reactive object.
 * @param {Function} getter - The getter function.
 * @returns {Computed} - The computed reactive object.
 */
export function computed(getter: Function): Computed {
  let value: any
  let dirty = true

  const effectFn = effect(getter, {
    lazy: true,
    scheduler: () => {
      if (!dirty) {
        dirty = true
        trigger(obj, 'value')
      }
    }
  })

  const obj = {
    get value() {
      if (dirty) {
        value = effectFn()
        dirty = false
      }
      track(obj, 'value')
      return value
    }
  }

  return obj as Computed
}

/**
 * traverse the reactive object
 * @param {Object} target - reactive object
 * @param {Set} seen - the seen set
 * @returns {Object | null} - the traversed reactive object
 */
function traverse(target: Object, seen: Set<object> = new Set()): Object | null {
  if (typeof target !== 'object' || target === null || seen.has(target)) {
    return null
  }
  seen.add(target)
  if (Array.isArray(target)) {
    target.forEach(item => traverse(item, seen))
  }
  Object.keys(target).forEach(key => {
    const PropertyKey = key as keys<PropertyKey>
    traverse(target[PropertyKey], seen)
  })
  return target
}
/**
 * Watch reactive object.
 * @param {Object} source - The reactive object.
 * @param {Function} callback - The callback function.
 * @param {watchOptions} options - The options object.
 */
export function watch(source: Object, callback: Function, options: watchOptions = {}) {
  let getter: Function
  if (typeof source === 'function') {
    getter = source
  } else {
    getter = () => traverse(source)
  }

  let oldVal: any, newVal

  let clear: Function

  const onInvaildate = (fn: Function) => {
    clear = fn // save the clear function
  }

  const job = () => {
    newVal = effectFn()

    if (clear) {
      clear()
    }

    callback(newVal, oldVal, onInvaildate)
    oldVal = newVal
  }

  const effectFn = effect(() => getter(), {
    lazy: true,
    scheduler: () => {
      if (options?.flush === 'post') {
        const p = Promise.resolve()
        p.then(job)
      }
      else {
        job()
      }
    }
  })

  if (options?.immediate) {
    job()
  } else {
    oldVal = effectFn()
  }
}
