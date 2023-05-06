import typescript from "@rollup/plugin-typescript"
import { nodeResolve } from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"
import terser from "@rollup/plugin-terser"

export default {
    input: "src/index.ts",
    output: [
        {
            file: "dist/sjs.cjs.js",
            format: "cjs",
            exports: 'named',
        },
        {
            file: "dist/sjs.esm.js",
            format: "es",
            exports: 'named',
        },
        {
            file: "dist/sjs.iife.min.js",
            format: "iife",
            name: "SeaSideJS",
            exports: 'named',
            plugins: [terser()],
        },
        {
            file: "dist/sjs.umd.min.js",
            format: "umd",
            name: "SeaSideJS",
            exports: 'named',
            plugins: [terser()],
        }
    ],
    plugins: [nodeResolve(), commonjs(), typescript()],
}
