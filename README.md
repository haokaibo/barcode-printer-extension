# Odoo Barcode Printer Extension

This is a Chrome Extension that adds a "Print Barcode" button to Odoo product pages (and the mock application).

## Installation

1.  Download all files (`manifest.json`, `content.js`, `styles.css`) to a single folder on your computer.
2.  Open Chrome and navigate to `chrome://extensions/`.
3.  Enable **Developer mode** (top right switch).
4.  Click **Load unpacked** (top left).
5.  Select the folder where you saved the files.
6.  The extension is now active. Go to your page and refresh to see the button.

## Features

*   **Live Injection**: Finds "Barcode" fields automatically.
*   **Customizable**: Set width, height, and number of copies.
*   **Preview**: See a visual preview of the label layout.
*   **Print**: Generates a print-ready window with correct page breaks and margins.
*   **2mm Margins**: Enforces 2mm left/right margins on the printed label.

## Customizing the Barcode Starting Value

The extension assigns a barcode number to each printed label. It starts from a
**default barcode** and increments by 1 for every subsequent print.

### Changing `DEFAULT_BARCODE`

The default starting value lives at the top of `content.js`:

```js
const DEFAULT_BARCODE = "123456789012";
```

To change where numbering begins:

1.  Open `content.js` in your editor.
2.  Edit the `DEFAULT_BARCODE` string to the numeric value you want (keep the
    length to control zero-padding, e.g. `"00123456789012"`).
3.  If the extension is already loaded in Chrome via **Load unpacked**, click
    the refresh icon on the extension card in `chrome://extensions/` (or
    reload the Odoo/product page) so the new value takes effect.

> The first generated barcode will be `DEFAULT_BARCODE + 1`, since the code
> increments the stored/previous value.

### Changing the Last Generated Barcode in Chrome DevTools

The extension persists the last generated barcode in Chrome's
`chrome.storage.local` under the key `lastGeneratedBarcode`. You can inspect or
override it manually without editing source:

1.  Visit the Odoo / product page.
2.  Open **Chrome DevTools** (press <kbd>F12</kbd> or <kbd>Ctrl+Shift+I</kbd> /
    <kbd>Cmd+Option+I</kbd>).
3.  Click the **Application** tab (in DevTools' top bar, between "Network" and
    "Lighthouse"; on narrow windows it may be under the `≫` overflow menu).
4.  In the left pane, expand **Storage** ▸ **Local**, or use the
    **Manifest storage** section.
5.  Find the key **`lastGeneratedBarcode`** and edit its value to whatever
    barcode number you want the next print to continue from. The code will then
    compute `value + 1` for the next label.
6.  (Optional) To fully reset to the hardcoded `DEFAULT_BARCODE`, select
    `lastGeneratedBarcode` and press the <kbd>Delete</kbd> key, then reload the
    page.

> The increment logic uses `BigInt(value) + 1n`, so very long numeric strings
> are handled without overflow — just keep them numeric.
