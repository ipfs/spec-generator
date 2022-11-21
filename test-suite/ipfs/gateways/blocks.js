
import { readFile, stat } from "node:fs/promises";
import { Buffer } from "node:buffer";
import { env } from "node:process";
import { ok, equal, match } from 'node:assert';
import axios from "axios";
import makeRel from '../../../lib/rel.js';

const rel = makeRel(import.meta.url);
const IPLD_RAW_TYPE = 'application/vnd.ipld.raw';
const ROOT_GATEWAY_URL = env.ROOT_GATEWAY_URL;
const dirAsRawBlock = await readFile(rel('./fixtures/dir.expected.bin'));
// ipfs add -Qrw --cid-version 1 dir
const ROOT_DIR_CID = 'bafybeie72edlprgtlwwctzljf6gkn2wnlrddqjbkxo3jomh4n7omwblxly';
// ipfs resolve -r /ipfs/$ROOT_DIR_CID/dir/ascii.txt | cut -d "/" -f3
const FILE_CID = 'bafkreihhpc5y2pqvl5rbe5uuyhqjouybfs3rvlmisccgzue2kkt5zq6upq';

// XXX get the root URL
describe('Test HTTP Gateway Raw Block (application/vnd.ipld.raw) Support', () => {
  let ax;
  before('Setting up the HTTP client', () => {
    ok(ROOT_GATEWAY_URL, 'Env contains a URL for the root of the gateway');
    ax = axios.create({ baseURL: ROOT_GATEWAY_URL });
  });

  // the gateways needs to be minimally writable in order to be testable
  before('Writing a raw block to the gateway', async () => {
    const res = await ax.post('/ipfs/', {
      data: dirAsRawBlock,
      headers: { 'Content-Type': IPLD_RAW_TYPE },
      maxRedirects: 0,
    });
    ok(res.status < 400, 'Writing fixture was successful');
  });

  describe('GET unixfs dir root block and compare it with expected raw block', () => {
    it('GET with format=raw param returns a raw block', async () => {
      const res = await ax.get(`/ipfs/${ROOT_DIR_CID}/dir?format=raw`, {
        responseType: 'arraybuffer',
      });
      equal(res.status, 200, 'GET succeeded');
      const bf = Buffer.from(res.data);
      ok(bf.equals(dirAsRawBlock), 'received raw buffer is correct');
    });
    it('GET for application/vnd.ipld.raw returns a raw block', async () => {
      const res = await ax.get(`/ipfs/${ROOT_DIR_CID}/dir`, {
        headers: { Accept: IPLD_RAW_TYPE },
        responseType: 'arraybuffer',
      });
      equal(res.status, 200, 'GET succeeded');
      const bf = Buffer.from(res.data);
      ok(bf.equals(dirAsRawBlock), 'received raw buffer is correct');
    });
  });

  describe('Make sure expected HTTP headers are returned with the block bytes', () => {
    it('GET response for application/vnd.ipld.raw has expected response headers', async () => {
      const res = await ax.get(`/ipfs/${ROOT_DIR_CID}/dir/ascii.txt`, {
        headers: { Accept: IPLD_RAW_TYPE },
        responseType: 'arraybuffer',
      });
      equal(res.status, 200, 'GET succeeded');
      equal(res.headers['content-type'], IPLD_RAW_TYPE, 'correct Content-Type');
      const { size } = await stat(rel('./fixtures/dir/ascii.txt'));
      equal(res.headers['content-length'], size, 'correct Content-Length');
      match(res.headers['content-disposition'], new RegExp(`attachment;\\s*filename="${FILE_CID}\\.bin"`), 'correct Content-Disposition');
      equal(res.headers['x-content-type-options'], 'nosniff', 'correct X-Content-Type-Options');
    });
    it('GET for application/vnd.ipld.raw with query filename includes Content-Disposition with custom filename', async () => {
      const res = await ax.get(`/ipfs/${ROOT_DIR_CID}/dir/ascii.txt?filename=foobar.bin`, {
        headers: { Accept: IPLD_RAW_TYPE },
        responseType: 'arraybuffer',
      });
      equal(res.status, 200, 'GET succeeded');
      match(res.headers['content-disposition'], new RegExp(`attachment;\\s*filename="foobar\\.bin"`), 'correct Content-Disposition');
    });
    // (basic checks, detailed behavior is tested in t0116-gateway-cache.sh)
    it('GET response for application/vnd.ipld.raw has expected caching headers', async () => {
      const res = await ax.get(`/ipfs/${ROOT_DIR_CID}/dir/ascii.txt`, {
        headers: { Accept: IPLD_RAW_TYPE },
        responseType: 'arraybuffer',
      });
      equal(res.status, 200, 'GET succeeded');
      equal(res.headers.etag, `"${FILE_CID}.raw"`, 'correct Etag');
      ok(res.headers['x-ipfs-path'], 'has X-Ipfs-Path');
      ok(res.headers['x-ipfs-roots'], 'has X-Ipfs-Roots');
      const cachePragmata = (res.headers['cache-control'] || '').split(/\s*,\s*/);
      Object.entries({
          'public pragma': (str) => str.toLowerCase() === 'public',
          'immutable pragma': (str) => str.toLowerCase() === 'immutable',
          'max-age pragma': (str) => {
            if (!/^max-age=/i.test(str)) return false;
            if (parseInt(str.replace('max-age=', ''), 10) < 29030400) return false; // at least 29030400
            return true;
          },
        })
        .forEach(([label, func]) => ok(cachePragmata.find(func), label))
      ;
    });
  });
});
