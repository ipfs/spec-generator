
import { readFile } from 'node:fs/promises';

export default async function loadJSON (url) {
  const data = await readFile(url);
  return new Promise((resolve, reject) => {
    try {
      resolve(JSON.parse(data));
    }
    catch (err) {
      reject(err);
    }
  });
}
