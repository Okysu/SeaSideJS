// This is a type guard that checks if the type is an object.
type NonObject<T> = T extends object ? never : T

// This is a recursive type that makes all the properties of an object reactive.
type ReactiveData<T> = {
    [K in keyof T]: T[K] extends object ? ReactiveData<T[K]> : NonObject<T[K]>
}

// This is a type that wraps a non-object value in an object.
type WrappedValue<T> = {
    value: T
    __isWrappedValue: true
}

// Extended ReactiveData type with _subscribers property
type Reactive<T extends object> = ReactiveData<T> & {
    _subscribers: Map<PropertyKey, Set<(value: any) => void>>
}

// computed type
type Computed = {
    readonly value: any
}