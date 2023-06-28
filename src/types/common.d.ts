// keys<T> is a type that extracts all keys from T that are string or number.
type keys<T> = T extends object ? Extract<keyof T, string | number> : never

// instance type of a class
type SeaSideJSOptions = {
    template: string | DocumentFragment
    data: () => object
    methods?: { [key: string]: (...args: any[]) => any }
    mounted?: () => void
}

// proxy interface
interface effect {
    (): any
    deps: Set<effect>[]
    options?: effectOptions
}
// effect options type
type effectOptions = Object & {
    scheduler?: Function
    lazy?: boolean
}

// watch options type
type watchOptions = Object & {
    immediate?: boolean
    deep?: boolean
    flush?: string
}