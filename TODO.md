
# TODO

- [x] set up bin
- [x] set up lib
- [x] command for watch
- [x] nodemon for watch in dev
- [x] basic remark generation
- [x] basic template
- [x] basic CSS
- [x] set up watch to have an HTTP server and inject code that reloads
- [ ] Features
    - [ ] Parse metadata
    - [ ] List editors
    - [ ] GitHub source
    - [x] Set title correctly
    - [x] Inject modified date
    - [ ] Sectionify
    - [ ] ToC
    - [ ] Sectionals
    - [ ] IDs on sections
    - [ ] Issues (use :: directives)
    - [ ] Notes
    - [ ] Download references from SpecRef
    - [ ] Have own additional references
    - [ ] Put references on IPFS
    - [ ] Definitions
    - [ ] Definition references
    - [ ] PR mode
    - [ ] Multiformat metadata (some hover thing)
- [x] early tests
- [ ] Look into hosting — Fleek?
- [ ] Start setting up the structure of the spec space
    - [ ] Where do PRs go?
    - [ ] We need a `meta` section, with specs-for-specs notably
    - [ ] Test protocol spec: the way in which the test runners are expected to run in all implemetations

## For The Specs

From @aschmahmann:
* Overall problem:
    * https://github.com/ipfs/specs as a whole slew of documents that should be removed/archived as not being real specs (keychain, keystore, mfs, repo, ...) or being horribly out of date.
* Specs with big problems:
    * UnixFS specs aren't good enough to build an implementation out of
    * There is no IPFS DHT spec, there's a libp2p one https://github.com/libp2p/specs/tree/master/kad-dht, but all of the IPFS-specific pieces are either missing or hidden in the libp2p spec
* Pet peeve:
    * Spec documents where things unrelated to the spec such as implementation details, alternatives considered, etc. and the spec are intertwined such that they're hard to distinguish. I personally prefer specs just being specs, but if people want these other artifacts around then having them sufficiently separate would be great. The UnixFS spec is particularly bad at this.
