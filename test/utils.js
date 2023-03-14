
import { ok, equal } from 'node:assert';
import { addId } from '../lib/html/utils.js';

describe('HTML Utils', function () {
  it('generates IDs', () => {
    equal(addId({ id: 'fnord' }), 'fnord', 'maintains existing');
    equal(addId({}, '', '726'), '726', 'accepts numbers');
  });
});
