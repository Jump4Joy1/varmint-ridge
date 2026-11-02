import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const from = path.resolve(here, "../../www");
const to = path.resolve(here, "../assets/www");

fs.rmSync(to, { recursive: true, force: true });
fs.mkdirSync(to, { recursive: true });
fs.cpSync(from, to, { recursive: true });
console.log("staged", from, "->", to);
