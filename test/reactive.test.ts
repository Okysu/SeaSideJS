import { reactive } from '../src/libs/reactive'


const obj = reactive({
    a: 1,
    b: {
        c: 2
    }
})


const common = reactive()

test("reactive test", () => {
    expect(obj.a).toBe(1)
    expect(obj.b.c).toBe(2)
    obj.a = 2
    expect(obj.a).toBe(2)
    obj.b.c = 3
    expect(obj.b.c).toBe(3)
    expect(common.value).toBe(undefined)
    common.value = 1
    expect(common.value).toBe(1)
})