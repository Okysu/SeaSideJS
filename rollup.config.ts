import typescript from "@rollup/plugin-typescript"
import { nodeResolve } from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"
import terser from "@rollup/plugin-terser"
import cleanup from 'rollup-plugin-cleanup'

export default {
    input: "src/index.ts",
    output: [
        {
            file: "dist/sjs.cjs.js",
            format: "cjs",
            exports: 'named',
            plugins: [cleanup(
                {
                    comments: 'none'
                }
            )],
        },
        {
            file: "dist/sjs.esm.js",
            format: "es",
            exports: 'named',
            plugins: [cleanup(
                {
                    comments: 'none'
                }
            )],
        },
        {
            file: "dist/sjs.cjs.min.js",
            format: "cjs",
            exports: 'named',
            plugins: [terser(), cleanup(
                {
                    comments: 'none'
                }
            )],
        },
        {
            file: "dist/sjs.esm.min.js",
            format: "es",
            exports: 'named',
            plugins: [terser(), cleanup(
                {
                    comments: 'none'
                }
            )],
        },
        {
            file: "dist/sjs.iife.min.js",
            format: "iife",
            name: "SeaSideJS",
            exports: 'named',
            plugins: [terser(), cleanup(
                {
                    comments: 'none'
                }
            )],
        },
        {
            file: "dist/sjs.umd.min.js",
            format: "umd",
            name: "SeaSideJS",
            exports: 'named',
            plugins: [terser(), cleanup(
                {
                    comments: 'none'
                }
            )],
        }
    ],
    plugins: [nodeResolve(), commonjs(), typescript()],
}
