
import process from "node:process";

export default function die (msg) {
  console.warn(msg);
  process.exit(1);
}
