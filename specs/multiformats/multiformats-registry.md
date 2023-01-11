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

# Multiformats Registry

The whole point of multiformats is to support multiple value encodings. In turn, this requires the ability to
register new encodings for each multiformat type. This document unifies multiformat registries.

## Introduction

Encodings are indicated using some form of flag (eg. a prefix) and such flags can become exhausted (eg. if only
one byte is allocated for it), congested (if commonly-used encodings require abnormally long flags), or squatted
(when projects that don't have much traction register flags to increase their legitimacy or simply because it's
easy). In order to ensure that our registries are as extensible as they need to be but do not suffer from over-use,
we have a set of criteria which is used to ensure that only encodings that broadly benefit the community are
registered (:cite[multiformats-governance]).

## Registry

tk

::data-table{src="registry.json" config="registry-config.json"}
