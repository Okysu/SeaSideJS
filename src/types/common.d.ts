// keys<T> is a type that extracts all keys from T that are string or number.
type keys<T> = T extends object ? Extract<keyof T, string | number> : never

// Instance type of a class
type SeaSideJSOptions = {
    template: string | DocumentFragment
    data: () => object
    methods: { [key: string]: (...args: any[]) => any }
    mounted?: () => void
}