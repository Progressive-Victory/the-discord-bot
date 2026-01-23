import esbuild from "esbuild";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

await esbuild.build({
  platform: "node",
  target: "esnext",
  format: "esm",
  entryPoints: ["./src/index.ts"],
  outfile: "./dist/index.js",
  sourcemap: true,
  minify: true,
  bundle: true,
  legalComments: "external",
  packages: "external",
  alias: {
    "~": path.resolve(__dirname, "src"),
    "@": path.resolve(__dirname, "src"),
  },
});
