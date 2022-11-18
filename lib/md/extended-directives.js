
import {visit} from 'unist-util-visit';
import { toString } from 'mdast-util-to-string';
import pluralize from 'pluralize';

const { isPlural, plural, singular } = pluralize;

export default function makeRemarkExtendedDirectives (ctx) {
  return () => {
    const blockTypes = new Set(['note', 'issue', 'warning', 'example']);
    return (tree) => {
      // await saveJSON(rel('../scratch/tree.json'), tree);
      visit(tree, (node) => {
        if (
          node.type === 'textDirective' ||
          // node.type === 'leafDirective' || // these are ::block, not inline but not a container
          node.type === 'containerDirective'
        ) {
          const data = node.data || (node.data = {});
          if (blockTypes.has(node.name)) {
            data.hName = 'div';
            data.hProperties = { className: node.name };
          }
          else if (node.name === 'dfn') {
            const primaryDef = toString(node);
            let defs = [primaryDef];
            if (node.attributes && node.attributes.also) defs.push(...node.attributes.also.split(/\s*,\s*/));
            defs = defs.map(cleanText);
            defs.push(...defs.map(df => isPlural(df) ? singular(df) : plural(df)));
            defs = [...new Set(defs)];
            const id = `dfn-${primaryDef}`;
            defs.forEach(df => {
              if (ctx.definitions[df]) return ctx.error(`Duplicate definition: ${df}`);
              ctx.definitions[df] = `#${id}`;
            });
            data.hName = 'dfn';
            data.hProperties = { id };
          }
          else if (node.name === 'ref') {
            const to = cleanText(toString(node));
            data.hName = 'a';
            data.hProperties = { className: 'ipseity-unresolved-ref', href: to };
          }
          else if (node.name === 'cite') {
            const to = cleanText(toString(node));
            data.hName = 'a';
            data.hProperties = { className: 'ipseity-unresolved-cite', href: to };
          }
          else if (node.name === 'rfc2119') {
            data.hName = 'em';
            data.hProperties = { className: 'rfc2119' };
          }
        }
      })
    }
  };
}

function cleanText (txt) {
  return (txt || '').trim().toLocaleLowerCase();
}
