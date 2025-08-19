import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";

const external = ["react", "react-dom", "react/jsx-runtime"];
const globals = {
  react: "React",
  "react-dom": "ReactDOM",
  "react/jsx-runtime": "jsxRuntime",
};

export default [
  // ESM build for modern bundlers
  {
    input: "src/index.ts",
    external,
    output: {
      file: "dist/index.esm.js",
      format: "esm",
      sourcemap: false,
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: true,
        declarationMap: false,
        declarationDir: "dist",
        emitDeclarationOnly: false,
      }),
    ],
  },

  // CommonJS build for Node.js
  {
    input: "src/index.ts",
    external,
    output: {
      file: "dist/index.cjs.js",
      format: "cjs",
      sourcemap: false,
      exports: "named",
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: false,
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
      sourcemap: false,
      exports: "named",
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: false,
      }),
    ],
  },

  // Minified UMD build for production
  {
    input: "src/index.ts",
    external,
    output: {
      file: "dist/index.umd.min.js",
      format: "umd",
      name: "MicroLottieReact",
      globals,
      sourcemap: false,
      exports: "named",
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: false,
      }),
      terser({
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ["console.log", "console.warn", "console.error"],
          dead_code: true,
          unused: true,
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
