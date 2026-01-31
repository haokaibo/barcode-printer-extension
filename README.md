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
