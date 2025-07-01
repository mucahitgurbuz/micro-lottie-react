import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";

const external = ["react", "react-dom"];
const globals = {
  react: "React",
  "react-dom": "ReactDOM",
};

export default [
  // ES Modules build
  {
    input: "src/index.ts",
    external,
    output: {
      file: "dist/index.esm.js",
      format: "es",
      sourcemap: true,
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: true,
        declarationMap: true,
        outDir: "dist",
      }),
    ],
  },

  // CommonJS build
  {
    input: "src/index.ts",
    external,
    output: {
      file: "dist/index.js",
      format: "cjs",
      sourcemap: true,
      exports: "named",
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: "./tsconfig.json",
      }),
    ],
  },

  // UMD build for browsers
  {
    input: "src/index.ts",
    external,
    output: {
      file: "dist/index.umd.js",
      format: "umd",
      name: "MicroLottieReact",
      globals,
      sourcemap: true,
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: "./tsconfig.json",
      }),
    ],
  },

  // Minified UMD build
  {
    input: "src/index.ts",
    external,
    output: {
      file: "dist/index.umd.min.js",
      format: "umd",
      name: "MicroLottieReact",
      globals,
      sourcemap: true,
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: "./tsconfig.json",
      }),
      terser({
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ["console.log", "console.warn"],
        },
        mangle: {
          properties: {
            regex: /^_/,
          },
        },
        format: {
          comments: false,
        },
      }),
    ],
  },
];
