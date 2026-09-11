# markdown-it-wikilinks-plus

<div align="center">
  <a href="#installation">Installation</a> - 
  <a href="#usage">Usage</a> - 
  <a href="#options">Options</a> -
  <a href="#options-details">Options Details</a>
</div>

---

An [11ty](https://11ty.dev) plugin for [markdown-it](https://github.com/markdown-it/markdown-it) to use ([Obsidian](https://obsidian.md) style) wikilinks and image embeds, like `[[some page]]` and `![[image.png]]`.

Includes support for **alt text and link labels** via pipe `|` in the markdown image embed or wikilink, as well as **dimensions** on image embeds (this plugin can add an inline `style` to the `<img>` with `width` and `height` taken from the dimensions in the markdown):
- `[[some page|see here]]` for a link to `some page` with link text `see here`
- `![[image.png|some cat]]` for an image embed with `alt="some cat"`
- `![[image.png|200x200]]` for an image embed with display size `200x200`:
  - the image would get an inline style attribute of `style="width: 200px; height: 200px;"`
- both alt text *and* dimension attributes can be added by using another pipe and making the dimensions the *last* piped section on an image embed:
  - `![[image.png|some cat|200x200]]` results in the attributes:
    - `alt="some cat" style="width: 200px; height: 200px;"`

This plugin can also create an `alt` attribute for image embeds with *missing* alt text:
- **using the image name** as the `alt` attribute (for each image embed missing alt text)
- **using a given string** as the `alt` attribute (for each image embed missing alt text)

> [!TIP]
> this can be an empty string, to get `alt=""` attributes on image embeds with missing alt text

---

## Installation
Install in your project with:
```bash
npm install github:actuallysomecat/markdown-it-wikilinks-plus
```
or manually by adding to your `package.json` dependencies:
```json
{
  "dependencies": {
    "markdown-it-wikilinks-plus": "github:actuallysomecat/markdown-it-wikilinks-plus"
  }
}
```
then do `npm install` in the project.

---

## Usage
In your 11ty config (`eleventy.config.js`), `.use()` this plugin with your markdown-it instance:
```js
import MarkdownIt from 'markdown-it'
import wikilinksPlus from 'markdown-it-wikilinks-plus'

// default options for wikilinksPlus (see README)
const wikilinksPlusOptions = { /* default options */ }

// use wikilinksPlus with the markdown-it instance
const md = new MarkdownIt(mdOptions)
  .use(wikilinksPlus, wikilinksPlusOptions)
  // ... any additional plugins ...

// setting the markdown library:
eleventyConfig.setLibrary("md", md)

// ... rest of eleventy.config.js ...
```

---

## Options
| Group                     | Option                                                              | Type                  | Default                                                                  |
|---------------------------|---------------------------------------------------------------------|-----------------------|--------------------------------------------------------------------------|
| [pageLink](#pagelink)     | [`absoluteBaseURL`](#pagelinkabsolutebaseurl)                       | `string`              | `'/'`                                                                    |
| [pageLink](#pagelink)     | [`relativeBaseURL`](#pagelinkrelativebaseurl)                       | `string`              | `'./'`                                                                   |
| [pageLink](#pagelink)     | [`forceAllLinksAbsolute`](#pagelinkforcealllinksabsolute)           | `boolean`             | `false`                                                                  |
| [pageLink](#pagelink)     | [`postProcessLinkTarget`](#pagelinkpostprocesslinktarget)           | `function{}`          | `(target) => target.trim()`                                              |
| [pageLink](#pagelink)     | [`postProcessLinkLabel`](#pagelinkpostprocesslinklabel)             | `function{}`          | `(label) => label.trim()`                                                |
| [pageLink](#pagelink)     | [`allowLinkLabelFormatting`](#pagelinkallowlinklabelformatting)     | `boolean`              | `true`                                                                     |
| [pageLink](#pagelink)     | [`uriSuffix`](#pagelinkurisuffix)                                   | `string`              | `''`                                                                     |
| [pageLink](#pagelink)     | [`htmlAttributes`](#pagelinkhtmlattributes)                                   | `function` or `object`              | `{}`                                                                     |
| -                         | -                                                                   | -                     | -                                                                        |
| [imageEmbed](#imageembed) | [`absoluteBaseURL`](#imageembedabsolutebaseurl)                     | `string`              | `'/'`                                                                    |
| [imageEmbed](#imageembed) | [`relativeBaseURL`](#imageembedrelativebaseurl)                     | `string`              | `'./'`                                                                   |
| [imageEmbed](#imageembed) | [`forceAllImageUrlsAbsolute`](#imageembedforceallimageurlsabsolute) | `boolean`             | `false`                                                                  |
| [imageEmbed](#imageembed) | [`uriSuffix`](#imageembedurisuffix)                                 | `string`              | `''`                                                                     |
| [imageEmbed](#imageembed) | [`htmlAttributes`](#imageembedhtmlattributes)                       | `function` or `object`          | `{}`                                                                     |
| [imageEmbed](#imageembed) | [`postProcessImageTarget`](#imageembedpostprocessimageTarget)        | `function{}`          | `(imageTarget) => imageTarget.trim().split('/').map(sanitize).join('/')` |
| [imageEmbed](#imageembed) | [`postProcessAltText` ](#imageembedpostprocessalttext)                   | `function{}`          | `(altText) => altText.trim()`                                            |
| [imageEmbed](#imageembed) | [`imageFileExt`](#imageembedimagefileext)                                | `string[]`            | `['bmp', 'gif', 'jpeg', 'jpg', 'png', 'svg', 'webp']`                    |
| [imageEmbed](#imageembed) | [`defaultAltText`](#imageembeddefaultalttext)                       | `boolean` or `string` | `false`                                                                  |

### Default Options

> [!TIP]
>
> **Copypaste-friendly default options object template**
> 
> (any options omitted will use their default value)
>
> ```js
> // default markdown-it-wikilinks-plus options
> const wikilinksPlusOptions = {
>   pageLink: {
>     absoluteBaseURL: '/',
>     relativeBaseURL: './',
>     forceAllLinksAbsolute: false,
>     postProcessLinkTarget: (target) => target.trim(),
>     postProcessLinkLabel: (label) => label.trim(),
>     allowLinkLabelFormatting: true,
>     uriSuffix: '',
>     htmlAttributes: {},
>   },
>   imageEmbed: {
>     absoluteBaseURL: '/',
>     relativeBaseURL: './',
>     forceAllImageUrlsAbsolute: false,
>     uriSuffix: '',
>     htmlAttributes: {},
>     postProcessImageTarget: (imageTarget) =>
>       imageTarget.trim().split('/').map(sanitize).join('/'),
>     postProcessAltText: (altText) => altText.trim(),
>     imageFileExt: ['bmp', 'gif', 'jpeg', 'jpg', 'png', 'svg', 'webp'],
>     defaultAltText: false,
>   }
> }
> ```

---

## Options Details
### pageLink
#### `pageLink.absoluteBaseURL`
**Default:** `/`

absolute base URL for pages

<p align="right"><a href="#options">back to Options</a> 🔼 | <a href="#markdown-it-wikilinks-plus">back to top</a> ⏫</p>

#### `pageLink.relativeBaseURL`
**Default:** `./`

relative base URL for pages, if needed

<p align="right"><a href="#options">back to Options</a> 🔼 | <a href="#markdown-it-wikilinks-plus">back to top</a> ⏫</p>

#### `pageLink.forceAllLinksAbsolute`
**Default:** `false`

make all the page links absolute

<p align="right"><a href="#options">back to Options</a> 🔼 | <a href="#markdown-it-wikilinks-plus">back to top</a> ⏫</p>

#### `pageLink.postProcessLinkTarget`
**Default:** `(target) => target.trim()`

process the wikilink target (the part before a pipe (if present)).
default is to `trim`.
might be a good place to do a `slugify` or `toLowerCase` or something.
(the target will be `escape`d internally when the `href` is made)

<p align="right"><a href="#options">back to Options</a> 🔼 | <a href="#markdown-it-wikilinks-plus">back to top</a> ⏫</p>

#### `pageLink.postProcessLinkLabel`
**Default:** `(label) => label.trim()`

process the wikilink label (the part after a pipe (if present)).

<p align="right"><a href="#options">back to Options</a> 🔼 | <a href="#markdown-it-wikilinks-plus">back to top</a> ⏫</p>


#### `pageLink.allowLinkLabelFormatting`
**Default:** `true`

whether to format markdown in link labels

- if `true`, a link label like `[[test|*testing*]]` would be in italics ('*testing*'), etc
- if `false`, the same link label would be plaintext `*testing*`, unformatted

<p align="right"><a href="#options">back to Options</a> 🔼 | <a href="#markdown-it-wikilinks-plus">back to top</a> ⏫</p>

#### `pageLink.uriSuffix`
**Default:** `''`

suffix to add to the link target (like `.html`)

<p align="right"><a href="#options">back to Options</a> 🔼 | <a href="#markdown-it-wikilinks-plus">back to top</a> ⏫</p>

#### `pageLink.htmlAttributes`
**Default:** `{}`

html attributes to add to the `<a>`

> [!NOTE]
> `href` from `htmlAttributes` overrides derived `href`

<p align="right"><a href="#options">back to Options</a> 🔼 | <a href="#markdown-it-wikilinks-plus">back to top</a> ⏫</p>

##### `pageLink.htmlAttributes` example function
```js 
const customPageLinkAttributes: ({ originalHref, label }) => {
  let attrs = {}
  // give wikilinks a class 'internal-link'
  attrs = { class: `internal-link` }

  // give wikilinks a title referencing their originalHref
  attrs.title = `internal link to ${originalHref}`
  
  // console log the link label for some reason
  console.log(`link label: ${label}`)

  return attrs
}
```

##### `pageLink.htmlAttributes` example object
```js 
const customPageLinkAttributes = {
  // give wikilinks a class 'internal-link'
  class: `internal-link`,
  // and some other attribute
  'custom-attribute': 'meow'
}
```

<p align="right"><a href="#options">back to Options</a> 🔼 | <a href="#markdown-it-wikilinks-plus">back to top</a> ⏫</p>

### imageEmbed
#### `imageEmbed.absoluteBaseURL`
**Default:** `'/'`

absolute base URL for images

<p align="right"><a href="#options">back to Options</a> 🔼 | <a href="#markdown-it-wikilinks-plus">back to top</a> ⏫</p>

#### `imageEmbed.relativeBaseURL`
**Default:** `'./'`

relative base URL for images, if needed

<p align="right"><a href="#options">back to Options</a> 🔼 | <a href="#markdown-it-wikilinks-plus">back to top</a> ⏫</p>

#### `imageEmbed.forceAllImageUrlsAbsolute`
**Default:** `false`

whether to force all the image URLs to be absolute

<p align="right"><a href="#options">back to Options</a> 🔼 | <a href="#markdown-it-wikilinks-plus">back to top</a> ⏫</p>

#### `imageEmbed.uriSuffix`
**Default:** `''`

suffix to add to the image URL (like `'?v=123'`)

<p align="right"><a href="#options">back to Options</a> 🔼 | <a href="#markdown-it-wikilinks-plus">back to top</a> ⏫</p>

#### `imageEmbed.htmlAttributes`
**Default:** `{}`

html attributes to add to the `<img>`
> [!NOTE]
> alt text returned from `htmlAttributes` overrides any originally provided or computed alt text from the image

<p align="right"><a href="#options">back to Options</a> 🔼 | <a href="#markdown-it-wikilinks-plus">back to top</a> ⏫</p>

##### `imageEmbed.htmlAttributes` example function
```js 
const customImageEmbedAttributes: ({ embedType, dimensions, originalHref, altText }) => {
  let attrs = {}
  // give image embeds a class 'image-embed'
  attrs = { class: `${embedType}-embed` }

  // use the provided or computed alt text, if available, for title attribute
  if (altText) {
    attrs.title = altText
  }

  // console log originalHref and dimensions for some reason
  console.log(`originalHref: ${originalHref}`)
  console.log(`dimensions: ${dimensions}`)

  return attrs
}
```

##### `imageEmbed.htmlAttributes` example object
```js 
const customImageEmbedAttributes = {
  // give image embeds a custom class
  class: 'image-embed--class',
  // and some other attribute
  'custom-attribute': 'meow'
}
```

<p align="right"><a href="#options">back to Options</a> 🔼 | <a href="#markdown-it-wikilinks-plus">back to top</a> ⏫</p>

#### `imageEmbed.postProcessImageTarget`
**Default:**

```js
(imageTarget) => imageTarget.trim().split('/').map(sanitize).join('/')
```
process the image target (the filename).
default is to trim, split, sanitize each section of the full image target, then rejoin.
might be a good place to do a `slugify` or `toLowerCase` or something.
(the target will be `escape`d internally when the `href` is made)

<p align="right"><a href="#options">back to Options</a> 🔼 | <a href="#markdown-it-wikilinks-plus">back to top</a> ⏫</p>

#### `imageEmbed.postProcessAltText`
**Default:**

```js
(altText) => altText.trim()
```
process the alt text from the label (the bit after the first pipe, if it's not dimensions)
(default is to trim)

<p align="right"><a href="#options">back to Options</a> 🔼 | <a href="#markdown-it-wikilinks-plus">back to top</a> ⏫</p>

#### `imageEmbed.imageFileExt`
**Default:**

```js
['bmp', 'gif', 'jpeg', 'jpg', 'png', 'svg', 'webp']
```
allowed file extensions to be considered an image (embed) to be processed

<p align="right"><a href="#options">back to Options</a> 🔼 | <a href="#markdown-it-wikilinks-plus">back to top</a> ⏫</p>

#### `imageEmbed.defaultAltText`
**Default:** `false`

`boolean` to generate a default `alt` attribute for any image embed *without* alt text:
- `true`: use the **image name** to create an `alt` attribute for any image embed *without* alt text
  - example: `/img/cat/meow.png` would get `alt="meow"`
- `false`: do not generate any `alt` attribute for image embeds without alt text

*or* a `string` to use as the `alt` attribute on any image embeds *without* alt text:
- example: `defaultAltText: 'PLACEHOLDER'` would give all image embeds without alt text an `alt="PLACEHOLDER"` attribute
- example: `defaultAltText: ''` would give all image embeds without alt text `alt=""` attribute

> [!WARNING]
> if this is anything other than a `boolean` or `string`, **the image name will be used as the default alt text for any image embeds missing alt text**

<p align="right"><a href="#options">back to Options</a> 🔼 | <a href="#markdown-it-wikilinks-plus">back to top</a> ⏫</p>

---

## Meow
meow
