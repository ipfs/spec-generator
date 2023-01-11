---
editors:
  - name: Robin Berjon
    email: robin@berjon.com
    url: https://berjon.com/
    github: darobin
    twitter: robinberjon
    mastodon: "@robin@mastodon.social"
    affiliation:
        name: Protocol Labs
        url: https://protocol.ai/
---

# Multiformats Governance Process

Multiformats is a set of self-describing protocol values. These values are foundational in that they are
low-level building blocks for both data and network layers and are used in IPFS, IPLD, libp2p, and beyond.
As a result, it is particularly important that these values be managed in such a way that guarantees
that they are maximally reliable, interoperable, and safe. This document captures the process that is
used to manage the multiformats specifications and the registries that support them.

## Introduction

This process is focused on remaining lightweight and on supporting long-term reliability for multiformat
protocol values.

The expectation is that changes to the specifications themselves ought to be limited and are more likely
to be clarifications or bug fixes. As such, these do not have an involved process beyond a pull request
review. All decisions are eventually made by the
[Specs Stewards](https://github.com/orgs/ipfs/teams/specs-stewards/members).

Changes to the registries are more involved. The reason for that is that registration consumes subtractable
resources (eg. an ASCII prefix code), and while workarounds can always be used to extend a namespace we
would rather not have to. Additionally, if we consider the long-term durability of content that relies
on multiformats, it is desirable to avoid an excessive proliferation of options as that makes archiving
them harder if you wish to guarantee long-term decodability (where by long-term we mean centuries).

## The Process

This process is intended to organize productive and friendly discussions around the evolution and maintenance
of multiformats, with an eye towards high reliability including over long periods of time.

All discussions must abide by the code of conduct (:cite[code-of-conduct]). We seek to make decisions in as
consensual a manner as possible, but if disagreements cannot be resolved by participants in any given issue,
the [Specs Stewards](https://github.com/orgs/ipfs/teams/specs-stewards/members) will always have final say.

### Reporting Issues

If you find bugs, mistakes, inconsistencies in the Multiformats specs, please let us know by filing an issue.
No issue is too small.

Multiformats are foundational, which in turn makes security issues with multiformats specs and implementations
particularly important. If you find a vulnerability that may affect live deployments – for example, expose a
remote execution exploit – please disclose it responsibly and send your report privately to [security@ipfs.io](mailto:security@ipfs.io),
please **DO NOT** file a public issue.

### Multiformats Specifications

The process to make changes to muliformats specifications is to file an issue or pull request and dicuss the
change accordingly.

When considering protocol design proposals, we are looking for:

- A description of the problem this design proposal solves.
- Discussion of the tradeoffs involved.
- Review of other existing solutions.
- Links to relevant literature (RFCs, papers, etc.).
- Discussion of the proposed solution.

Please note that protocol design is hard, and meticulous work. You may need to review existing literature and
think through generalized use cases. You need to be prepared to discuss corner cases in potentially
frustrating detail.

### Multiformats Registries

The whole point of multiformats is to support multiple value encodings. In turn, this requires the ability to
register new encodings for each multiformat type. Encodings are indicated using some form of flag (eg. a prefix)
and such flags can become exhausted (eg. if only one byte is allocated for it), congested (if commonly-used
encodings require abnormally long flags), or squatted (when projects that don't have much traction register
flags to increase their legitimacy or simply because it's easy).

In order to ensure that our registries are as extensible as they need to be but do not suffer from over-use,
we have a set of criteria which is used to ensure that only encodings that broadly benefit the community are
registered.

In order to be accepted for registration, an encoding MUST:

* Produce a specification indicating how to process it at a level of detail that makes independent interoperable
  implementations possible. (References to an external specification is acceptable if it comes from a body with
  sufficient durability guarantees.)
* Provide a comprehensive test suite sufficient to support independent interoperable implementations.
* Volunteer at least one person who will be available to answer questions and address issues for some time after
  the encoding is accepted. The purpose of this provision is to help out as multiformat implementations start
  adding support for the new encoding; it is not meant to be forever.
* Provide evidence that the encoding is supported in at least two production implementations.
* Describe a convincing use case for the deployment of this specific encoding.

If an encoding seems plausible but does not yet fulfil all requirements, it can be registered with a `draft`
status. Encodings with a `draft` status should be revisited by
[Specs Stewards](https://github.com/orgs/ipfs/teams/specs-stewards/members) regularly. If after some reasonable
amount of time (enough to make progress, but ideally no more than a year) a `draft` encoding has not resolved
issues with its registration, it will become `deprecated`. After an encoding is `deprecated` for some time
(long enough for its use to be reasonably considered eliminated or historical), its code becomes available for
reuse. Accepted encodings are granted a status of `permanent`.

## Acknowledgements

This document is an iteration of the [original contributing document](https://github.com/multiformats/multiformats/blob/master/contributing.md).
