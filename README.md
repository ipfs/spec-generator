
# Spec Generator: InterPlanetary Standards Edited and Integrated to Travel Yonder (IPSEITY)

This is the specification generator for IPFS and other friends in the Interplanetary stack.
You can enjoy its output online at [https://specs.ipfs.tech/](https://specs.ipfs.tech/).

It is essentially a batteries-included, unobtrusive static site generator. What it will do
is:

- Convert any `unicorn.md` in the input tree to `/unicorn/index.html` in the output tree with:
  - A table of contents.
  - A bunch of features for standards metadata (editors, etc.).
  - Definitions and definitions cross-references support, including to all of the broader
    [web standards universe](https://github.com/w3c/webref/).
  - Bibliographical references to other specs (from [SpecRef](https://www.specref.org/)),
    including linking and bibliography management.
  - Exported definitions plus biblio entry for the specs you write, so that others can load them.
  - Odds and ends that are helpful in this kind of context, you can read more in the
    [spec for specs](https://specs.ipfs.tech/meta/spec-for-specs/).
- Copy over any static files, including HTML documents.
- Add a number of useful resources to your ouput: fonts, if needed some scripts, and common
  logos used in spec headers and the such.

In watch mode it will auto-update the spec in your browser as you edit it.

## Installation

The usual:

```sh
npm install -g spec-generator
```

This will make a `spec-generator` command available. (It is also available under the name
`ipseity`.)

## Usage

In order to set up a spec site, you need:

- A `source` directory that will contain your MD spec source and whatever static files you
  want to copy over.
- An `output` directory where the generated output will go. These two directories can be
  absolutely anywhere, they don't have to share a parent. However, **don't** use the same
  input and output.
- A `config` file, that is a simple piece of JSON.
- A `template` file that is a basic piece of HTML.

That's a fair bit of setup, but you only need to do it once for a whole spec *site*, which
hopefully shouldn't be too often.

### Configuration

The `config` file have the following format:

```json
{
  "input": "./src/",
  "output": "./out/",
  "template": "./template.html",
  "baseURL": "https://specs.ipfs.tech",
  "github": {
    "repository": "ipfs/specs",
    "defaultBranch": "main"
  }
}
```

The fields are simple:

- `input`: the source directory, relative to the config file.
- `output`: the published directory, relative to the config file.
- `template`: the template file, relative to the config file.
- `baseURL`: the base URL at which the specs are published. This is used to generated the
  bibliographic entries for the specs in this site.
- `github`: optional settings to generate commit history and feedback links for
  each specification. Currently, we only support GitHub. Feel free to open a PR
  to add support for other services.

All fields are required except `baseURL`, and `baseURL` is highly recommended.

### Template

The Markdown spec just generate the body of the spec, but you need some HTML to wrap
around it from which to specify some metadata, hook up some styles, etc.

An example template file might look like this:

```html
<!DOCTYPE html>
<html lang="en" dir="ltr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width">
    <title></title>
    <link rel="stylesheet" href="/css/ipseity.min.css">
    <link rel="stylesheet" href="/css/your-spec-style.css">
    <link rel="icon" href="/img/my-standards-logo.svg">
  </head>
  <body>
    <nav id="ipseity-back-to-root">
      <a href="/">Standards Home</a>
    </nav>
    <ipseity-header></ipseity-header>
${body}
  </body>
</html>
```

The `${body}` gets replaced by the Markdown output. Optionally the `ipseity-header` element
can be used to mark the injection point for the spec metadata if you don't intend it to be
the first thing in the body.

Apart from these conventions you can have whatever you want in there.

### CSS

If your template includes `/css/ipseity.min.css`, that will load styles for the spec body.
You can roll your own, of course, but this will have you covered. This doesn't include styling
the wrapper your way.

### Command Line

There are two ways of running the command. The first is in regular batch mode:

```sh
ipseity -c /path/to/config.json
```

The `-c` option is always required. This will run once, generate the specs, and exit.

Or you can run in watch mode. This is most useful while you're editing a spec:

```sh
ipseity -c /path/to/config.json -w
```

This will start up a local server and watch your files in the `input` directory. It will hot
reload specs you have open in a browser.
