
import { readFileSync } from "node:fs";
import { Buffer } from "node:buffer";
import { env } from "node:process";
import { ok, equal } from 'node:assert';
import axios from "axios";
import makeRel from '../../../lib/rel.js';

const rel = makeRel(import.meta.url);
const ROOT_GATEWAY_URL = env.ROOT_GATEWAY_URL;
const dirAsRawBlock = readFileSync(rel('./fixtures/dir.expected.bin'));
// ipfs add -Qrw --cid-version 1 dir
const ROOT_DIR_CID = 'bafybeie72edlprgtlwwctzljf6gkn2wnlrddqjbkxo3jomh4n7omwblxly';
// ipfs resolve -r /ipfs/$ROOT_DIR_CID/dir/ascii.txt | cut -d "/" -f3
// const FILE_CID = 'bafkreihhpc5y2pqvl5rbe5uuyhqjouybfs3rvlmisccgzue2kkt5zq6upq';

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
      headers: { 'Content-Type': 'application/vnd.ipld.raw' },
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
        headers: { Accept: 'application/vnd.ipld.raw' },
        responseType: 'arraybuffer',
      });
      equal(res.status, 200, 'GET succeeded');
      const bf = Buffer.from(res.data);
      ok(bf.equals(dirAsRawBlock), 'received raw buffer is correct');
    });
  });
});

// # Make sure expected HTTP headers are returned with the block bytes

//     test_expect_success "GET response for application/vnd.ipld.raw has expected Content-Type" '
//     curl -svX GET -H "Accept: application/vnd.ipld.raw" "http://127.0.0.1:$GWAY_PORT/ipfs/$ROOT_DIR_CID/dir/ascii.txt" >/dev/null 2>curl_output &&
//     cat curl_output &&
//     grep "< Content-Type: application/vnd.ipld.raw" curl_output
//     '

//     test_expect_success "GET response for application/vnd.ipld.raw includes Content-Length" '
//     BYTES=$(ipfs block get $FILE_CID | wc --bytes)
//     grep "< Content-Length: $BYTES" curl_output
//     '

//     test_expect_success "GET response for application/vnd.ipld.raw includes Content-Disposition" '
//     grep "< Content-Disposition: attachment\; filename=\"${FILE_CID}.bin\"" curl_output
//     '

//     test_expect_success "GET response for application/vnd.ipld.raw includes nosniff hint" '
//     grep "< X-Content-Type-Options: nosniff" curl_output
//     '

//     test_expect_success "GET for application/vnd.ipld.raw with query filename includes Content-Disposition with custom filename" '
//     curl -svX GET -H "Accept: application/vnd.ipld.raw" "http://127.0.0.1:$GWAY_PORT/ipfs/$ROOT_DIR_CID/dir/ascii.txt?filename=foobar.bin" >/dev/null 2>curl_output_filename &&
//     cat curl_output_filename &&
//     grep "< Content-Disposition: attachment\; filename=\"foobar.bin\"" curl_output_filename
//     '

// # Cache control HTTP headers
// # (basic checks, detailed behavior is tested in  t0116-gateway-cache.sh)

//     test_expect_success "GET response for application/vnd.ipld.raw includes Etag" '
//     grep "< Etag: \"${FILE_CID}.raw\"" curl_output
//     '

//     test_expect_success "GET response for application/vnd.ipld.raw includes X-Ipfs-Path and X-Ipfs-Roots" '
//     grep "< X-Ipfs-Path" curl_output &&
//     grep "< X-Ipfs-Roots" curl_output
//     '

//     test_expect_success "GET response for application/vnd.ipld.raw includes Cache-Control" '
//     grep "< Cache-Control: public, max-age=29030400, immutable" curl_output
//     '
