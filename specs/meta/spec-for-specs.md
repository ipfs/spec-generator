---
editors:
    - name: Robin Berjon
      email: robin@berjon.com
      url: https://berjon.com/
      github: darobin
      twitter: robinberjon
      mastodon: "@robin@mastodon.social"
      company:
          name: Protocol Labs
          url: https://protocol.ai/
---

# Spec for Specs

This document specifies the format and system used to create and maintain specifications for
the interplanetary stack.

## Structure

tk

## Metadata

tk

## Special Constructs

A number of additional structural constructs are available to capture common blocks that are
useful in specs: issues, warnings, notes, and examples.

An issue looks like this:

:::issue

This is a big, big problem.

:::

And the code for it is:

```md
:::issue

This is a big, big problem.

:::
```

A warning looks like this:

:::warning

Be careful!!!

Thar be dragons!

:::

And the code for it is:

```md
:::warning

Be careful!!!

Thar be dragons!

:::
```

A note looks like this:

:::note

Really, you want to pay attention to these things, because they kind of tend to matter, you know.

:::

And the code for it is:

```md
:::note

Really, you want to pay attention to these things, because they kind of tend to matter,
you know.

:::
```

An example looks like this:

:::example

And then it's just `document.getElementById('foo')`.

:::

And the code for it is:

```md
:::example

And then it's just `document.getElementById('foo')`.

:::
```

## References

tk

## Definitions

A :dfn[definition]{also="dfn,def"} is a key concept in a specification that can be referenced from other parts of the
spec or in other specs. The definition is created with a `:dfn[defined term]` directive. Some definitions can benefit
from having synonyms, and these can be specified as a comma-separated list with an `also` attribute as in
`:dfn[defined term]{also="term, def"}`.

Once a :ref[definition] has been created, it can be referenced with `:ref[definition]`. This includes the synonyms it
was givem, for instance :ref[def].

Plurals are handled for you (for English-language specs), so that you can reference :ref[definitions] without trouble.