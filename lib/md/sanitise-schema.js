
import { defaultSchema } from 'hast-util-sanitize';

const sanitiseSchema = JSON.parse(JSON.stringify(defaultSchema));
sanitiseSchema.clobber = [];
Object.keys(sanitiseSchema.protocols).forEach(k => {
  sanitiseSchema.protocols[k].push('ipfs');
  sanitiseSchema.protocols[k].push('ipns');
});
sanitiseSchema.tagNames.push('section');
sanitiseSchema.tagNames.push('aside');
sanitiseSchema.tagNames.push('video');
sanitiseSchema.tagNames.push('audio');
sanitiseSchema.tagNames.push('ipseity-data-table');
sanitiseSchema.tagNames.push('table');
sanitiseSchema.tagNames.push('thead');
sanitiseSchema.tagNames.push('tbody');
sanitiseSchema.tagNames.push('tfoot');
sanitiseSchema.tagNames.push('tr');
sanitiseSchema.tagNames.push('th');
sanitiseSchema.tagNames.push('td');
sanitiseSchema.tagNames.push('caption');
sanitiseSchema.attributes['*'].push('className');
sanitiseSchema.attributes['ipseity-data-table'] = ['src', 'config'];

export default sanitiseSchema;
