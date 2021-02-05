/**
 * *boostrap-dark-5* `darkmode.js` -- the JavaScript module.
 *
 * ***class*** **DarkMode**
 *
 * Use this JS file, and its `darkmode` object, in your HTML to automatically capture `prefers-color-scheme` media query
 * events and also initialize the document root (`<HTML>` tag) with the user prefered color scheme.
 *
 * The `darkmode` object can also be used to drive a dark mode toggle event, with optional persistance
 * storage in either a cookie (if GDPR consent is given) or the browsers `localStorage` object.
 *
 * The module can be loaded into a html page using a standard script command.
 * ```html
 * <script src="darkmode.js"></script>
 * ```
 * This will create a variable `darkmode` that is an instace of the DarkMode class.
 *
 * @module DarkMode
 * @_author Vino Rodrigues
 */
class DarkMode {
  /** ***const*** -- Name of the cookie or localStorage->name when saving */
  static readonly DATA_KEY = "bs.prefers-color-scheme"

  /** ***const*** -- String used to identify light mode *(do not change)*, @see https://www.w3.org/TR/mediaqueries-5/#prefers-color-scheme */
  static readonly VALUE_LIGHT = "light"

  /** ***const*** -- String used to identify dark mode *(do not change)*, @see https://www.w3.org/TR/mediaqueries-5/#prefers-color-scheme */
  static readonly VALUE_DARK = "dark"

  /** ***const*** -- String used to identify light mode as a class in the `<HTML>` tag */
  static readonly CLASS_NAME_LIGHT = "light"

  /** ***const*** -- String used to identify dark mode as a class in the `<HTML>` tag */
  static readonly CLASS_NAME_DARK = "dark"

  /**
   * ***property***
   *
   * Used to get the current state, `true` when in dark mode, `false` when in light mode or when mode not set
   *
   * Can also be used to set the current mode *(with no persistance saving)*
   *
   * @example <caption>Get if page is in "Dark" mode</caption>
   * var myVal = darkmode.inDarkMode;
   *
   * @example <caption>Set the page to the "Dark" mode</caption>
   * darkmode.inDarkMode = true;
   *
   * @public
   * @type {boolean}
   */
  get inDarkMode() {
    return DarkMode.getColorScheme() == DarkMode.VALUE_DARK
  }

  set inDarkMode(val: boolean) {
    this.setDarkMode(val, false)
  }

  /** @private */
  private _hasGDPRConsent = false

  /**
   * Variable to store GDPR Consent.  This setting drives the persistance mechanism.
   *
   * Used in {@link #saveValue} to determin if a cookie or the `localStorage` object should be used.
   * * Set to `true` when GDPR Consent has been given to enable storage to cookie *(useful in Server-Side knowlage of user preference)*
   * * The setter takes care of swapping the cookie and localStorage if appropriate
   * * Default is `false`, thus storage will use the browsers localStorage object *(Note: No expiry is set)*
   *
   * @example <caption>Set once GDPR consent is given by the user</caption>
   * darkmode.hasGDPRConsent = true;
   */
  get hasGDPRConsent() {
    return this._hasGDPRConsent
  }

  set hasGDPRConsent(val: boolean) {
    this._hasGDPRConsent = val
    if (val) {
      // delete cookie if it exists
      const prior = DarkMode.readCookie(DarkMode.DATA_KEY)
      if (prior) {
        DarkMode.saveCookie(DarkMode.DATA_KEY, "", -1)
        localStorage.setItem(DarkMode.DATA_KEY, prior)
      }
    } else {
      // delete localStorage if it exists
      const prior = localStorage.getItem(DarkMode.DATA_KEY)
      if (prior) {
        localStorage.removeItem(DarkMode.DATA_KEY)
        DarkMode.saveCookie(DarkMode.DATA_KEY, prior)
      }
    }
  }

  /** Expiry time in days when saving and GDPR consent is give */
  cookieExpiry = 365;

  /** @private */
  private _dataSelector = "";

  /**
   * When set will use the given data selector instead of a class in the `<html>`tag
   *
   * @example <caption>Setting the dataSelector</caption>
   * // use the full name attribute, starting with "data-"
   * darkmode.dataSelector = "data-bs-theme";
   */
  get dataSelector(): string {
    return this._dataSelector
  }

  set dataSelector(val: string) {
    this._dataSelector = val
  }

  /**
   * Saves the instance of the documentRoot (i.e. `<html>` tag) when the object is created.
   */
  get documentRoot(): HTMLHtmlElement {
    return document.getElementsByTagName("html")[0]
  }

  /**
   * @constructor
   * The constructor intializes the `darkmode` object (that should be used as a singleton).
   */
  constructor() {
    document.addEventListener("DOMContentLoaded", function() {
      DarkMode.onDOMContentLoaded()
    })
  }

  /**
   * Writes a cookie, assumes SameSite = Strict & path = /
   *
   * @private
   * @param name -- Name of the cookie
   * @param value -- Value to be saved
   * @param days -- Number of days to expire the cookie
   * @returns {void}
   */
  static saveCookie(name: string, value = "", days = 365): void {
    let exp = ""
    if (days) {
      const date = new Date()
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000))
      exp = "; expires=" + date.toUTCString()
    }
    document.cookie = name + "=" + value + exp + "; SameSite=Strict; path=/"
  }

  /**
   * Save the current color-scheme mode
   *
   * @param {string} name -- Name of the cookie or localStorage->name, is dependant on {@link #hasGDPRConsent}
   * @param {string} value -- Should be one of `light` or `dark`
   * @param {number} days -- Number of days to expire the cookie when the cookie is used, ignored for `localStorage`
   * @returns {void}
   */
  private saveValue(name: string, value: string, days = this.cookieExpiry): void {
    if (this.hasGDPRConsent) {
      // use cookies
      DarkMode.saveCookie(name, value, days)
    } else {
      // use local storage
      localStorage.setItem(name, value)
    }
    return
  }

  /**
   * Reads a cookie
   * @private
   */
  static readCookie(name: string): string {
    const n = name + "="
    const parts = document.cookie.split(";")

    for(let i=0; i < parts.length; i++) {
      const part = parts[i].trim()
      if (part.startsWith(n)) {
        // found it
        return part.substring(n.length)
      }
    }
    return ""
  }

  /**
   * Retrieves the color-scheme last saved
   *
   * **NOTE:** is dependant on {@link #hasGDPRConsent}
   *
   * @param {string} name -- Name of the cookie or localStorage->name
   * @returns {string} -- The saved value, iether `light` or `dark`, or an empty string if not saved prior
   */
  readValue(name: string): string {
    if (this.hasGDPRConsent) {
      return DarkMode.readCookie(name)
    } else {
      const ret = localStorage.getItem(name)
      return ret ? ret : ""
    }
  }

  /**
   * Deletes the saved color-scheme
   *
   * **NOTE:** is dependant on {@link #hasGDPRConsent}
   *
   * @param {string} name
   * @returns {void} -- Nothing, erasure is assumed
   */
  eraseValue(name: string): void {
    if (this.hasGDPRConsent) {
      this.saveValue(name, "", -1)
    } else {
      localStorage.removeItem(name)
    }
  }

  /**
   * Queries the `<HTML>` tag for the current color-scheme
   *
   * *(This value is set prior via the {@link #setDarkMode}) function.)*
   *
   * @returns {string} -- The current value, iether `light` or `dark`, or an empty string if not saved prior
   */
  getSavedColorScheme(): string {
    const val = this.readValue(DarkMode.DATA_KEY)
    return val ? val : ""
  }

  /**
   * Queries the `prefers-color-scheme` media query for the current color-scheme
   *
   * *(This value is set prior via the {@link #setDarkMode}) function.)*
   *
   * @returns {string} -- The current value, iether `light` or `dark`, or an empty string if the media query is not supported
   */
  getPreferedColorScheme(): string {
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return DarkMode.VALUE_DARK
    } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
      return DarkMode.VALUE_LIGHT
    } else {
      return ""
    }
  }

  /**
   * Sets the color-scheme in the `<HTML>` tag as a class called either `light` or `dark`
   *
   * **Note:** This function will modify your document root element, i.e. the `<HTML>` tag
   *
   * Default behaviour when setting dark mode `true`
   *
   * ```html
   * <html lang="en" class="dark">
   * <!-- Note: the "light" class is removed -->
   * ```
   *
   * Default behaviour when setting dark mode `false`
   *
   * ```html
   * <html lang="en" class="light">
   * <!-- Note: the "dark" class is removed -->
   * ```
   *
   * Behaviour when setting dark mode `true`, and `dataSelector = "data-bs-theme"`
   *
   * ```html
   * <html lang="en" data-bs-theme="dark">
   * ```
   *
   * Behaviour when setting dark mode `false`, and `dataSelector = "data-bs-theme"`
   *
   * ```html
   * <html lang="en" data-bs-theme="light">
   * ```
   *
   * @example <caption>Set the color scheme to ***dark***, saving the state to the persistance mechanism</caption>
   * document.querySelector("#darkmode-on-button").onclick = function(e){
   *   darkmode.setDarkMode(true);  // save=true is default
   * }
   *
   * @example <caption>Set the color scheme to ***light***, but not saving the state</caption>
   * document.querySelector("#darkmode-off-button-no-save").onclick = function(e){
   *   darkmode.setDarkMode(false, false);
   * }
   *
   * @param {boolean} darkMode -- `true` for "dark", `false` for 'light'
   * @param {boolean} doSave -- If `true`, then will also call {@link #saveValue} to save that state
   * @returns {void} -- Nothing, assumes saved
   */
  setDarkMode(darkMode: boolean, doSave = true): void {
    if (!this._dataSelector) {
      if (!darkMode) {
        // light
        this.documentRoot.classList.remove(DarkMode.CLASS_NAME_DARK)
        this.documentRoot.classList.add(DarkMode.CLASS_NAME_LIGHT)
      } else {
        // dark
        this.documentRoot.classList.remove(DarkMode.CLASS_NAME_LIGHT)
        this.documentRoot.classList.add(DarkMode.CLASS_NAME_DARK)
      }
    } else {
      this.documentRoot.setAttribute(this._dataSelector, darkMode ? DarkMode.VALUE_DARK : DarkMode.VALUE_LIGHT)
    }

    if (doSave) this.saveValue(DarkMode.DATA_KEY, darkMode ? DarkMode.VALUE_DARK : DarkMode.VALUE_LIGHT)
  }

  /**
   * Toggles the color scheme in the `<HTML>` tag as a class called either `light` or `dark`
   * based on the inverse of it's prior state.
   *
   * When {@link #dataSelector} is set, this is set in the given data selector as the data value.
   *
   * *(See {@link #setDarkMode})*
   *
   * @example <caption>Bind an UI Element `click` event to toggle dark mode</caption>
   * document.querySelector("#darkmode-button").onclick = function(e){
   *   darkmode.toggleDarkMode();
   * }
   *
   * @returns {void} - Nothing, assumes success
   */
  toggleDarkMode(doSave = true): void {
    let dm
    if (!this._dataSelector) {
      dm = this.documentRoot.classList.contains(DarkMode.CLASS_NAME_DARK)
    } else {
      dm = this.documentRoot.getAttribute(this._dataSelector) == DarkMode.VALUE_DARK
    }
    this.setDarkMode( !dm, doSave )
  }

  /**
   * Clears the persistance state of the module and resets the document to the default mode.
   *
   * Calls {@link #eraseValue} to erase any saved value, and then
   * calls {@link #getPreferedColorScheme} to retrieve the `prefers-color-scheme` media query,
   * passing its value to {@link #setDarkMode} to reset the users preference.
   *
   * @example <caption>Bind a reset UI Element `click` event to reset the dark mode </caption>
   * document.querySelector("#darkmode-forget").onclick = function(e){
   *   darkmode.resetDarkMode();
   * }
   *
   * @returns {void} - Nothing, no error handling is performed.
   */
  resetDarkMode(): void {
    this.eraseValue(DarkMode.DATA_KEY)
    const dm = this.getPreferedColorScheme()
    if (dm) {
      this.setDarkMode( dm == DarkMode.VALUE_DARK, false )
    } else {
      // make good when `prefers-color-scheme` not supported
      if (!this._dataSelector) {
        this.documentRoot.classList.remove(DarkMode.CLASS_NAME_LIGHT)
        this.documentRoot.classList.remove(DarkMode.CLASS_NAME_DARK)
      } else {
        this.documentRoot.removeAttribute(this._dataSelector)
      }
    }
  }

  /**
   * Gets the current color-scheme from the document `<HTML>` tag
   *
   * @returns {string} -- The current value, iether `light` or `dark`, or an empty string if not present
   */
  static getColorScheme(): string {
    if (!darkmode.dataSelector) {
      if (darkmode.documentRoot.classList.contains(DarkMode.CLASS_NAME_DARK)) {
        return DarkMode.VALUE_DARK
      } else if (darkmode.documentRoot.classList.contains(DarkMode.CLASS_NAME_LIGHT)) {
        return DarkMode.VALUE_LIGHT
      } else {
        return ""
      }
    } else {
      const data = darkmode.documentRoot.getAttribute(darkmode.dataSelector)
      if ((data == DarkMode.VALUE_DARK) || (data == DarkMode.VALUE_LIGHT)) {
        return data
      } else {
        return ""
      }
    }
  }

  /**
   * ***static*** -- function called by the media query on change event.
   *
   * First retrieves any persistant/saved value, and if present ignores the event, but
   * if not set then triggers the {@link #setDarkMode} function to change the current mode.
   *
   * @returns {void} -- Nothing, assumes success
   */
  static updatePreferedColorSchemeEvent(): void {
    let dm = darkmode.getSavedColorScheme()
    if (!dm) {
      dm = darkmode.getPreferedColorScheme()
      if (dm) darkmode.setDarkMode( dm == DarkMode.VALUE_DARK, false )
    }
  }

  /**
   * ***static*** -- function called when the DOM finishes loading.
   *
   * Does all the DarkMode initialization, including:
   * * Loading any prior stored preference (GDPR consent is ***not*** assumed)
   * * else, honoring any `<HTML>` tag `class="dark|light"` that Server-Side may set
   * * else, honoring the browser / OS `prefers-color-scheme` preference
   * and setting the derived mode by calling {@link #setDarkMode}
   *
   * Followd by setting up the media query on change event
   *
   * ***Warning:*** This function is automatically called when loading this module.
   *
   * @returns {void}
   */
  static onDOMContentLoaded(): void {
    let pref = darkmode.readValue(DarkMode.DATA_KEY)
    if (!pref) {
      // user has not set pref. so get from `<HTML>` tag in case developer has set pref.
      pref = DarkMode.getColorScheme()
      if (!pref) {
        // when all else fails, get pref. from OS/browser
        pref = darkmode.getPreferedColorScheme()
      }
    }
    const dm = (pref == DarkMode.VALUE_DARK)

    // initalize the `HTML` tag
    darkmode.setDarkMode(dm, false)

    // update every time it changes
    if (window.matchMedia) {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener( "change", function() {
        DarkMode.updatePreferedColorSchemeEvent()
      })
    }
  }
}

/**
 * ***const*** -- This is the global instance (object) of the DarkMode class.
 */
const darkmode = new DarkMode()
