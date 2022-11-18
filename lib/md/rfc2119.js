
import { findAndReplace } from 'mdast-util-find-and-replace';

const joinRegex = regexes => new RegExp(`(${regexes.map(re => re.source).join('|')})`, 'g');
const rfc2119Rx = joinRegex([
  /\bMUST(?:\s+NOT)?\b/,
  /\bSHOULD(?:\s+NOT)?\b/,
  /\bSHALL(?:\s+NOT)?\b/,
  /\bMAY?\b/,
  /\b(?:NOT\s+)?REQUIRED\b/,
  /\b(?:NOT\s+)?RECOMMENDED\b/,
  /\bOPTIONAL\b/,
]);

export default function remarkRFC2119 () {
  return (tree) => findAndReplace(
    tree,
    [
      // ['spec', 'AARDVARK'],
      [
        rfc2119Rx,
        (_, value) => {
          return {
            type: 'textDirective',
            name: 'rfc2119',
            attributes: {},
            children: [ { type: 'text', value } ],
          };
        }
      ]
    ]
  );
}
