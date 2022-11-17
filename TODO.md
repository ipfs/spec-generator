
# TODO

- [x] Features
    - [x] Parse metadata
    - [x] List editors
    - [x] Issues (use :: directives)
    - [x] Notes
    - [x] Definitions
        - [x] :dfn[]
        - [x] :cite[]
        - [x] :ref[]
    - [x] Definition references
    - [x] MUST, etc.
    - [x] render errors
- [x] eliminate leftovers from previous approach
- [x] command to build
- [ ] Spec for Specs needs to be written
- [ ] look at Fleek hosting (test run myself before doing the real thing)

- [x] early tests
- [ ] Start setting up the structure of the spec space
    - [x] We need a `meta` section, with specs-for-specs notably
    - [ ] Test protocol spec: the way in which the test runners are expected to run in all implemetations

## Next
- [ ] PR mode: generate PRs to prXXX.specs.ipfs.tech
- [ ] Multiformat metadata (some hover thing that shows detail for embedded MFs)
- [ ] lint mode (reporting errors out rather than to the spec)
- [ ] a lot more tests

## For The Specs

* The stuff Mauve wants
* We need our own wpc.guide

From @aschmahmann:
* Overall problem:
    * https://github.com/ipfs/specs as a whole slew of documents that should be removed/archived as not being real specs (keychain, keystore, mfs, repo, ...) or being horribly out of date.
* Specs with big problems:
    * UnixFS specs aren't good enough to build an implementation out of
    * There is no IPFS DHT spec, there's a libp2p one https://github.com/libp2p/specs/tree/master/kad-dht, but all of the IPFS-specific pieces are either missing or hidden in the libp2p spec
* Pet peeve:
    * Spec documents where things unrelated to the spec such as implementation details, alternatives considered, etc. and the spec are intertwined such that they're hard to distinguish. I personally prefer specs just being specs, but if people want these other artifacts around then having them sufficiently separate would be great. The UnixFS spec is particularly bad at this.

From @lidel:
* (specs/governance) multiformats (low level primitives that everything is built on, including Multihash, CID) use global code tables that lack clear maintainers, policies around change
    1. global code table at https://github.com/multiformats/multicodec/blob/master/table.csv
        * iiuc purpose is to ensure a code has single meaning across our entire stack (removing ambiguity)
        * problems
            * no clear governance means a lot of questionable codes entered this "append only" table
            * people assume string "name" is as immutable as the number in "code", but that is not true: we did change labels multiple times, including recently (see BREAKING CHANGES https://github.com/multiformats/go-multicodec/pull/71)
    2. for some reason (probably to ensure "name" is stable?) we have a copy of  codes used for identifying libp2p transports in https://github.com/multiformats/multiaddr/blob/master/protocols.csv (+ someone needs to manually add new protocols to both protocols.csv and table.csv
    3. Multibase prefixes are maintained in separate table: https://github.com/multiformats/multibase/blob/master/multibase.csv
* (specs) DNS related things are all over the place
    * we have two standards for addressing with DNS TXT records, but there is no single place that tells entire story
        * content addressing uses DNSLink
            * this is the only way we can do human-readable names for mutable content, it also acts as interop layer for alternatives to ICANN like ENS (iirc PL sponsored https://github.com/wealdtech/coredns-ens/ plugin) or Handshake (see https://hackmd.io/1UU2rhYsQDOqC2YCbtGfTQ?view)
            * it has docs at https://docs.ipfs.tech/concepts/dnslink/ +  own website at https://dnslink.dev/ (+ own org at  https://github.com/dnslink-std )
        * peer addressing uses DNSAddr
            * pretty important, default bootstrappers use it https://github.com/ipfs/kubo/blob/b8412efb80f1205be70dd71cfca64c68456682e8/config/bootstrap_peers.go#L11-L21
            * afaik only place we mention it is https://github.com/multiformats/multiaddr/blob/master/protocols/DNSADDR.md
* (compliance tests)
    * We have some ways of testing p2p protocols (e.g. testground), but there is no story for testing compliance/interop around processing content addressed-data.
    * HTTP Gateways are the closest thign we have to vendor-agnostic API.
    * They have specs, but there are no compliance test suite that implementer or gateway operator  could run against their HTTP endpoint to ensure it works as expected.
    * Why it is important?
        * Iroh team already uses gateway API as the way to measure perf against Kubo.
        * For now, Gateway are only used for data retrieval via HTTP GET, but we want to add POST/PUT support for data onboarding.
        * When we have it, implementations will be able to do end-to-end compliance testing around content-addressed data.
    * Prior art:
        * we have a lot of bash+curl tests tied to Kubo implementation (see *gateway*.sh in https://github.com/ipfs/kubo/tree/master/test/sharness) – ugly, but they do work and protect against regressions
        * in contrast, there is tiny set of 4 tests performed by https://ipfs.github.io/public-gateway-checker/  – def. not enough, not useful for gateway operators / implementers
Also:
Something we could leverage is that the Gateway interface acts as an "thin waist" – it informs what types of content-addressed data are being used in real world (what is accessible to people who do not run full IPFS node). With that in mind, the initial "read-only" scope is limited to:
* raw block or  CAR
* IPLD Data Model in form of
    * UnixFS (with HAMT-sharding) for files and directories – wip improved specs in this PR https://github.com/ipfs/specs/pull/331
    * (soon to be added) DAG-CBOR/JSON (https://github.com/ipfs/specs/pull/328) for custom DAGs and data structures (note: we had DAG-CBOR for years, but adoption is low due to the lack of support of gateways)
* IPNS and DNSLink for mutability (note: we could descope this too, and move entire mutability story to a separate test suite)
We need to cover those core primitives before moving into more advanced things.

From Dietrich:
* Look for small things that could be picked off to turn them into an IETF or W3C standard (eg. CIDs)
