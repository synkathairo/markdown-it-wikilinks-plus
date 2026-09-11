import path from 'node:path/posix'
import urlJoin from 'proper-url-join'

// ## - normalizeOptions -
/**
 * normalize the absoluteBaseURL and relativeBaseURL options for all types (pageLink, imageEmbed, etc)
 * (this is silly, but...)
 *
 * @param {Object} options - the options (after merging (eg userOptions over defaultOptions))
 * @returns {void}
 */
export function normalizeOptions(options) {
  // - pageLink URLs
  // absolute
  options.pageLink.absoluteBaseURL = normalizeAbsoluteURL(
    options.pageLink.absoluteBaseURL,
  )
  // relative
  options.pageLink.relativeBaseURL = normalizeRelativeURL(
    options.pageLink.relativeBaseURL,
  )

  // - imageEmbed URLs
  // absolute
  options.imageEmbed.absoluteBaseURL = normalizeAbsoluteURL(
    options.imageEmbed.absoluteBaseURL,
  )
  // relative
  options.imageEmbed.relativeBaseURL = normalizeRelativeURL(
    options.imageEmbed.relativeBaseURL,
  )

  // - imageEmbed imageFileExt[]
  // lowercase and trim each one, remove a leading dot if there is one
  // eg '.PNG' -> 'png'
  options.imageEmbed.imageFileExt = options.imageEmbed.imageFileExt.map((ext) =>
    ext.toLowerCase().trim().replace(/^\./, ''),
  )
}

// ## - normalizeAbsoluteURL -
/**
 * ensure a URL is absolute (it must start and end with a slash)
 * this is a bit of silly overkill, just trying to correct for possible user options weirdness and redundancy (like '././' etc)
 *
 * @param {string} url - the incoming url to fix
 * @returns {string} the hopefully fixed url
 */
export function normalizeAbsoluteURL(url) {
  // normalize the url
  url = path.normalize(url)
  // force a leading slash if it doesn't start with one now
  if (!url.startsWith('/')) {
    url = '/' + url
  }
  // use urlJoin to ensure a leading and trailing slash finally
  return urlJoin(url, '', { leadingSlash: true, trailingSlash: true })
}

// ## - normalizeRelativeURL -
/**
 * ensures a URL is relative (it should start with a leading dotslash './' and end with a trailing slash)
 * this is a bit of silly overkill, just trying to correct for possible user options weirdness and redundancy (like '././' etc)
 *
 * @param {string} url - the incoming url to fix
 * @returns {string} the hopefully fixed url
 */
export function normalizeRelativeURL(url) {
  // remove any leading slashes.
  url = url.replace(/^\/+/, '')
  // set a leading dotslash on the url
  if (!url.startsWith('./')) {
    url = './' + url
  }
  // normalize the url
  url = path.normalize(url)
  // if now it's just '.' after that, make it a dotslash
  if (url === '.') {
    url = './'
  }
  // use urlJoin to ensure a trailing slash, but no leading slash, finally
  return urlJoin(url, '', { leadingSlash: false, trailingSlash: true })
}

// ## - isDimension -
/**
 * check if a string is NUMxNUM format (eg, '200x200')
 *
 * @param {string} str - expected to be something like '200x200' (NUMxNUM), will verify
 * @returns {boolean} true if the string is NUMxNUM, false otherwise
 */
export function isDimension(str) {
  // split the str by 'x' (if it has any)
  const dim = str.toLowerCase().split('x')
  // if dim isn't 2 things now, return false
  if (dim.length !== 2) return false
  // if both dims are numbers, it is a dimension so return true. otherwise return false.
  return !isNaN(Number(dim[0])) && !isNaN(Number(dim[1]))
}

// ## - determineAltText -
/**
 * determine the alt text for an image embed, given a (potential) raw alt and the image target (and access to plugin options)
 *
 * - *if a raw alt text (**from the markdown**) is present, it is processed and returned as the alt text*
 *
 * - *otherwise*, the returned alt text depends on the incoming `defaultAltText` option:
 * - - if `defaultAltText` is `false`, **no** alt text is generated (*alt text is **undefined***)
 * - - if `defaultAltText` is `true`, **the image filename** (from `imageTarget`) is processed and used (*alt text returned is the **image name***)
 * - - if `defaultAltText` is a `string`, **that string** is processed and returned as the alt text (*this can result in `alt=""` if `defaultAltText: ''`*)
 * - any other type of `defaultAltText` falls back to using the *image filename*
 *
 * @param {string|null|undefined} rawAltText - the raw alt text extracted from the markdown, if any
 * @param {string} imageTarget - the image target used to get the filename from if needed
 * @param {{
 *    imageEmbed: {
 *        defaultAltText: boolean | string,
 *        postProcessAltText: (alt: string) => string
 *    }}} options - the passed in plugin options, including the imageEmbed config
 * @returns {string|undefined} the processed alt text or no alt text if none exists and none should be generated
 */
export const determineAltText = (rawAltText, imageTarget, options) => {
  const { defaultAltText, postProcessAltText } = options.imageEmbed

  // if raw alt text is in the original markdown, process it and use it
  if (rawAltText !== undefined && rawAltText !== null && rawAltText !== '') {
    return postProcessAltText(rawAltText)
  }
  // otherwise, switch by true of options.imageEmbed.defaultAltText
  switch (true) {
    // if defaultAltText is false, don't generate any alt text when it's missing
    case defaultAltText === false:
      return undefined
    // if defaultAltText is true, process and return the name of the image for any missing alt text
    case defaultAltText === true:
      return postProcessAltText(path.parse(imageTarget).name)
    // if defaultAltText is a string, process and return that string for any missing alt text (this could be an empty string and result in `alt=""`)
    case typeof defaultAltText === 'string':
      return defaultAltText === '' ? '' : postProcessAltText(defaultAltText)
    // if defaultAltText is neither a boolean nor a string, complain about it and just use the name of the image for any missing alt text
    default:
      // TODO: optional defaultAltText function smh
      console.warn(
        '--- wikilinksPlus option "imageEmbed.defaultAltText" should be string or boolean! Using filename (no extension) as default alt text!',
      )
      return postProcessAltText(path.parse(imageTarget).name)
  }
}

// ## -- EMBED TYPE PROCESSING --

// ## - checkEmbedType -
/**
 * determine the embed type for a given raw target.
 *
 * for an embed (`![[...]]`), this extracts the file extension
 * from the target and uses the plugin options to decide if it
 * should be an image embed, an audio embed, or something else (unknown).
 *
 * if the target is not within an embed delimiter (so if isEmbed is false),
 * then it returns 'link' for normal wikilinks.
 *
 * @param {string} rawTarget - the raw target of the embed (a file path or URL)
 * @param {object} options - the plugin options, including embed configs (imageEmbed, etc)
 * @returns {string} - returns 'image' or 'link' based on the input
 */
export function checkEmbedType(rawTarget, options) {
  // get the extension of the embed (.png, etc) and slice off the first character (the dot, hopefully), then lowercase the ext
  const extension = path.extname(rawTarget).slice(1).toLowerCase()
  // if the extension matches an imageFileExt, it's an image embed
  // (doing this because i might do audio/video file embeds later)
  if (options.imageEmbed?.imageFileExt?.includes(extension)) {
    return 'image'
  }
  // otherwise it's a link
  return 'link'
}

// ## - processImageEmbed -
/**
 * processes an image embed.
 *
 * @param {object} state - markdown-it state
 * @param {string[]} innerParts - array of parts from splitting the innerContent by pipe (|)
 * @param {string} rawTarget - the raw target (the first innerParts[])
 * @param {object} options - the plugin options, including the imageEmbed configuration
 * @param {object} md - markdown parser instance
 * @returns {boolean} true if processed successfully.
 */
export function processImageEmbed(state, innerParts, rawTarget, options, md) {
  const escape = md.utils.escapeHtml
  // process image embed
  let altText = ''
  let dimensions = ''
  // if more parts than filename exists, it may be alt text OR dimensions
  if (innerParts.length > 1) {
    // so get the last part as potential dimensions
    const potentialDimensions = innerParts[innerParts.length - 1]
    // is it dimensions?
    if (isDimension(potentialDimensions)) {
      // if it is, use them
      dimensions = potentialDimensions
      // and if there are 2 or more parts
      if (innerParts.length >= 2) {
        // the alt text is everything between part 1 and the last part (which is dimensions), rejoined by pipe (because they were split by pipe earlier)
        altText = innerParts.slice(1, -1).join('|').trim()
      }
    } else {
      // if the last part isn't dimensions, it's alt text probably (or it is now at least)
      // so slice off everything after first part (which is filename) and rejoin by pipe as alt text (because split by pipe earlier)
      // (this allows for having pipes in the alt text)
      altText = innerParts.slice(1).join('|').trim()
    }
  }

  // if there's a postProcessImageTarget function in options, call it with the rawTarget (result is the imageTarget)
  // otherwise the imageTarget is just the rawTarget
  let imageTarget = options.imageEmbed.postProcessImageTarget
    ? options.imageEmbed.postProcessImageTarget(rawTarget)
    : rawTarget
  // convert backslash to forward slash, normalize path
  imageTarget = imageTarget.replace(/\\/g, '/')
  imageTarget = path.normalize(imageTarget)

  // if forceAllImageUrlsAbsolute is true, baseUrl is absoluteBaseURL. if false, it's relativeBaseUrl
  const baseUrl = options.imageEmbed.forceAllImageUrlsAbsolute
    ? options.imageEmbed.absoluteBaseURL
    : options.imageEmbed.relativeBaseURL

  // options for the joining (forcing leadingSlash depends on forceAllImageUrlsAbsolute) (trailingSlash is false)
  const joinOptions = {
    leadingSlash: options.imageEmbed.forceAllImageUrlsAbsolute,
    trailingSlash: false,
  }
  // the src bits (baseUrl, imageTarget, possible uriSuffix) get joined (with the above join options) as srcAttr
  let srcAttr = urlJoin(
    baseUrl,
    imageTarget,
    options.imageEmbed.uriSuffix,
    joinOptions,
  )
  // escape it
  srcAttr = escape(srcAttr)

  // create an image token (self-closing)
  const token = state.push('image', 'img', 0)
  // make an empty children[]
  token.children = []

  // * - determine the alt text from possible alt text, the raw target, and the options (defaultAltText option)
  // (this processes the alt text using postProcessAltText, if available)
  const computedAltText = determineAltText(altText || '', rawTarget, options)
  // console.warn(`- computed alt text: ${computedAltText}`)
  // set the final alt text (escaped and trimmed computedAltText, or undefined (no alt attribute))
  const finalAltText =
    computedAltText !== undefined ? escape(computedAltText.trim()) : undefined

  // * - merge in extra HTML attributes from the htmlAttributes function (or object)
  // temp var for the ones from user options
  const htmlAttrs = options.imageEmbed?.htmlAttributes
  // set up the extra attributes to be built
  let extraAttrs = {}
  // if htmlAttrs is a function, call it with some params available
  if (typeof htmlAttrs === 'function') {
    extraAttrs = htmlAttrs({
      originalHref: srcAttr,
      altText: finalAltText,
      dimensions,
      embedType: 'image',
    })
    // console.warn(
    //   `-- returned imageEmbed extraAttrs: ${JSON.stringify(extraAttrs, null, 2)}`,
    // )
    // else if htmlAttrs is an object, just use those
  } else if (htmlAttrs && typeof htmlAttrs === 'object') {
    extraAttrs = htmlAttrs
  }

  // * - merge the attributes (if user didn't provide src and alt, use the computed ones)
  const mergedAttrs = { src: srcAttr, ...extraAttrs }
  // only set the computed alt text if no user defined alt in htmlAttributes
  // this is tricky with defaultAltText, but maybe user would rather assign a default alt text in htmlAttributes
  // in short: alt text from htmlAttributes overrides any computed alt text (via defaultAltText option)
  if (mergedAttrs.alt === undefined && finalAltText !== undefined) {
    mergedAttrs.alt = finalAltText
  }
  // for each attribute in mergedAttrs, set an attr in the token for it
  for (const [key, value] of Object.entries(mergedAttrs)) {
    token.attrSet(key, value)
  }
  // console.warn(`-- merged attributes: ${JSON.stringify(mergedAttrs, null, 2)}`)

  // * - create a new token for the alt text
  const tokenAltText = new state.Token('text', '', 0)
  // set the mergedAttrs.alt to that alt text token's content
  tokenAltText.content = mergedAttrs.alt
  // push the alt text token as a child
  token.children.push(tokenAltText)

  // add display dimensions if specified
  if (dimensions) {
    const [displayWidth, displayHeight] = dimensions.split('x')
    // inline style for display dimensions
    token.attrSet(
      'style',
      `width: ${displayWidth}px; height: ${displayHeight}px;`,
    )
  }
  return true
}

// ## - processWikilink -
/**
 * processes a normal wikilink (i.e. not an embed) by creating link tokens.
 *
 * @param {object} state - markdown-it state
 * @param {string[]} innerParts - array of parts from splitting the innerContent by pipe (|)
 * @param {string} rawTarget - the raw target (the first innerParts[])
 * @param {object} options - the plugin options, including the pageLink configuration
 * @param {object} md - markdown-it parser instance
 * @returns {boolean} true if processed successfully
 */
export function processWikilink(state, innerParts, rawTarget, options, md) {
  // escape from md.utils
  const escape = md.utils.escapeHtml

  // the label comes from the all inner parts (after the filename), joined by pipe (in case they had a pipe originally when split)
  // (or just the rawTarget if there is no label)
  const label =
    innerParts.length > 1 ? innerParts.slice(1).join('|') : rawTarget
  // process the link target (rawTarget) to get the processedTarget
  let processedTarget = options.pageLink.postProcessLinkTarget(rawTarget)
  // collapse redundant stuff in the processedTarget with path.normalize
  processedTarget = path.normalize(processedTarget)

  // process the label (label) to get the processedLabel
  const processedLabel = options.pageLink.postProcessLinkLabel(label)

  // new opening token
  const tokenLinkOpen = state.push('link_open', 'a', 1)

  // the base url, based on bool forceAllLinksAbsolute (true: use absoluteBaseURL, false: use relativeBaseURL)
  const baseUrl = options.pageLink.forceAllLinksAbsolute
    ? options.pageLink.absoluteBaseURL
    : options.pageLink.relativeBaseURL

  // options for the urlJoin that's about to happen (if forceAllLinksAbsolute, toggle leadingSlash on. no trailing slash.)
  const joinOptions = {
    leadingSlash: options.pageLink.forceAllLinksAbsolute,
    trailingSlash: false,
  }

  // make href by joining the baseUrl, processedTarget, and (optional) uri suffix (with above options)
  let href = urlJoin(
    baseUrl,
    processedTarget,
    options.pageLink.uriSuffix,
    joinOptions,
  )
  // escape it
  href = escape(href)

  // * - merge in extra HTML attributes from the htmlAttributes function (or object)
  // temp var for the ones from user options
  const htmlAttrs = options.pageLink?.htmlAttributes
  let extraAttrs = {}
  // if htmlAttrs is a function, call it with some params available
  if (typeof htmlAttrs === 'function') {
    extraAttrs = htmlAttrs({
      originalHref: href,
      label: processedLabel,
    })
    // console.warn(
    //   `-- returned pageLink extraAttrs: ${JSON.stringify(extraAttrs, null, 2)}`,
    // )
    // else if htmlAttrs is an object, just use those
  } else if (htmlAttrs && typeof htmlAttrs === 'object') {
    extraAttrs = htmlAttrs
  }

  // * - merge the attributes
  const mergedAttrs = { href, ...extraAttrs }
  // for each attribute in mergedAttrs, set an attr in the token for it
  for (const [key, value] of Object.entries(mergedAttrs)) {
    tokenLinkOpen.attrSet(key, value)
  }

  // maybe do some link label markdown formatting
  if (options.pageLink.allowLinkLabelFormatting) {
    // render inline the processedLabel
    const htmlLabel = md.renderInline(processedLabel, state.env)

    // push html_inline token (tokenHtml) to hold the htmlLabel
    const tokenHtml = state.push('html_inline', '', 0)
    tokenHtml.content = htmlLabel
    // console.warn(`- htmlLabel: ${htmlLabel}`)
  } else {
    // or just push a text token with the raw processedLabel
    const tokenText = state.push('text', '', 0)
    tokenText.content = processedLabel
  }

  // push the link_close token
  state.push('link_close', 'a', -1)
  return true
}
