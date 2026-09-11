import sanitize from 'sanitize-filename'
import extend from 'extend'
import {
  normalizeOptions,
  checkEmbedType,
  processImageEmbed,
  processWikilink,
} from './utils.js'

// ## - DEFAULT OPTIONS -
const defaultOptions = {
  // * - default options for wikilinks (eg [[some page]] )
  pageLink: {
    // base url for pages (default '/' ('/blog/' in my case))
    absoluteBaseURL: '/',
    // relative base url for pages if needed (default './')
    relativeBaseURL: './',
    // make all the page links absolute (default false (true in my case))
    forceAllLinksAbsolute: false,
    // process the raw wikilink target (the part before a pipe (if present)) (default is to trim)
    postProcessLinkTarget: (target) => target.trim(),
    // process the wikilink label (the part after a pipe (if present)) (default is to trim)
    postProcessLinkLabel: (label) => label.trim(),
    // allow formatting like bold/italic in link labels
    allowLinkLabelFormatting: true,
    // suffix to add to the link target, like '.html'
    uriSuffix: '',
    // extra attributes to add to the `<a>`
    htmlAttributes: {},
  },
  // * - default options for image embeds (eg ![[image.png]] )
  imageEmbed: {
    // base url for images (default '/' ('/blog/assets/images/' in my case))
    absoluteBaseURL: '/',
    // relative base url for images if needed (default './')
    relativeBaseURL: './',
    // whether to force all the image urls to be absolute (default false (true in my case))
    forceAllImageUrlsAbsolute: false,
    // suffix to add to the image url, like '?v=123'
    uriSuffix: '',
    // extra attributes to add to the `<img>` (excluding src and alt)
    htmlAttributes: {},
    // process the image target (the filename) (default is to trim, split, then sanitize each section of the full url, then rejoin)
    postProcessImageTarget: (imageTarget) =>
      imageTarget.trim().split('/').map(sanitize).join('/'),
    // process the alt text from the label (the bit after the first pipe, if not dimensions) (default is to trim)
    postProcessAltText: (altText) => altText.trim(),
    // allowed file extensions to be considered an image (embed)
    imageFileExt: ['bmp', 'gif', 'jpeg', 'jpg', 'png', 'svg', 'webp'],
    // default alt text (boolean or function) (default false (don't create default alt text))
    defaultAltText: false,
  },
}

// ## - MAIN -
/**
 * main function
 * @param {any} md - markdown instance (a markdown-it instance from 11ty probably)
 * @param {Object} [userOptions={}] - object with user options
 * @returns {any} modified md instance, hopefully
 */
export default function wikilinksPlus(md, userOptions = {}) {
  // * - options
  // merge user options over defaults
  const options = extend(true, {}, defaultOptions, userOptions)

  // if no postProcessAltText in user options (null) or if it's empty {}, use the default
  if (userOptions.imageEmbed?.postProcessAltText == null) {
    options.imageEmbed.postProcessAltText = (altText) => altText
  }

  // normalize URLs in options
  normalizeOptions(options)

  // * - the markdown-it rule for wikilinks
  function wikilinksRule(state, silent) {
    let pos = state.pos
    const src = state.src
    const maxPos = state.posMax
    let isEmbed = false

    // * - find opening delimiter: ('![[' or '[[') and determine if it's an embed or wikilink
    // - if it starts with "![[", then it's an embed
    // - if it starts with "[[", then it's a wikilink
    if (src.slice(pos, pos + 3) === '![[') {
      isEmbed = true
      pos += 3 // move pos to after "![[" (aka +3)
    } else if (src.slice(pos, pos + 2) === '[[') {
      pos += 2 // move pos to after "[[" (aka +2)
    } else {
      return false
    }

    // * - find closing delimiter (']]')
    const closePos = src.indexOf(']]', pos)
    if (closePos === -1 || closePos >= maxPos) return false

    // * - get inner content (everything between the delimiters (pos to closePos), trimmed)
    const innerContent = src.slice(pos, closePos).trim()
    // if nothing, return false
    if (!innerContent) return false
    // if silent, return false
    if (silent) {
      return false
    }

    // * - split on pipe to allow optional label/alt text/dimensions
    const innerParts = innerContent.split('|')
    const rawTarget = innerParts[0].trim()

    // * - check the embed type, if it's an embed. if it's not an embed (not '![[') then it's a 'link'
    const embedType = isEmbed ? checkEmbedType(rawTarget, options) : 'link'

    // * - move state.pos +2 (after the closing delimiter) (aka move pos to after ']]')
    state.pos = closePos + 2

    // * - switch case by embedType
    // switch case because i originally planned on expanding to also do audio/video embeds smh
    switch (embedType) {
      case 'image':
        return processImageEmbed(state, innerParts, rawTarget, options, md)

      case 'link':
        return processWikilink(state, innerParts, rawTarget, options, md)

      default:
        console.warn(
          '-- wikilinksPlus: Unexpected embed type, falling back to wikilink!',
        )
        return processWikilink(state, innerParts, rawTarget, options, md)
    }
  }
  // * - register the rule before the link rule
  md.inline.ruler.before('link', 'wikilinks', wikilinksRule)
}
