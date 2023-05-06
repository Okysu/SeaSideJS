/**
 * MurmurHash3 32-bit implementation
 * @param key raw string
 * @param seed seed
 * @returns hash number
 */
function murmurHash32(key: string, seed: number = 0): number {
    let len = key.length
    let h = seed ^ len
    let i = 0
    const c1 = 0xcc9e2d51
    const c2 = 0x1b873593

    while (len >= 4) {
        let k =
            ((key.charCodeAt(i) & 0xff)) |
            ((key.charCodeAt(i + 1) & 0xff) << 8) |
            ((key.charCodeAt(i + 2) & 0xff) << 16) |
            ((key.charCodeAt(i + 3) & 0xff) << 24)

        k = (k * c1) & 0xffffffff
        k = (k << 15) | (k >>> 17)
        k = (k * c2) & 0xffffffff

        h ^= k
        h = (h << 13) | (h >>> 19)
        h = (h * 5 + 0xe6546b64) & 0xffffffff

        len -= 4
        i += 4
    }

    if (len > 0) {
        let k = 0
        switch (len) {
            case 3:
                k ^= (key.charCodeAt(i + 2) & 0xff) << 16
            case 2:
                k ^= (key.charCodeAt(i + 1) & 0xff) << 8
            case 1:
                k ^= key.charCodeAt(i) & 0xff

                k = (k * c1) & 0xffffffff
                k = (k << 15) | (k >>> 17)
                k = (k * c2) & 0xffffffff

                h ^= k
        }
    }

    h ^= key.length

    h ^= h >>> 16
    h = (h * 0x85ebca6b) & 0xffffffff
    h ^= h >>> 13
    h = (h * 0xc2b2ae35) & 0xffffffff
    h ^= h >>> 16

    return h >>> 0
}

export default murmurHash32