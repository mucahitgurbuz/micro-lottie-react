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
  // Production minified UMD build - the only one we ship
  {
    input: "src/index.ts",
    external,
    output: {
      file: "dist/index.umd.min.js",
      format: "umd",
      name: "MicroLottieReact",
      globals,
      sourcemap: false, // No source maps for production
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: true,
        declarationMap: false, // No declaration maps
        outDir: "dist",
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
