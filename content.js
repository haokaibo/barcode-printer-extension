// --- configuration ---
const PRINT_BUTTON_TEXT = "Print Barcode";
const GENERATE_BUTTON_TEXT = "Generate Barcode";
const DEFAULT_BARCODE = "123456789012";
const STORAGE_KEY = "lastGeneratedBarcode";

// --- Main Execution ---
function init() {
    // Use a mutation observer to handle dynamic content (Odoo is a heavy SPA)
    const observer = new MutationObserver((mutations) => {
        // Debounce slightly if needed, but usually safe to run
        scanAndInject();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Initial scan
    scanAndInject();
}

function scanAndInject() {
    // Strategy 1: Standard Odoo Field Detection (Works for Odoo 14, 15, 16, 17+)
    // Odoo fields usually have a name="field_name" attribute on the widget container
    const odooFields = document.querySelectorAll('[name="barcode"]');

    odooFields.forEach(field => {
        // Skip if we already injected the button
        if (field.querySelector('.barcode-container')) return;

        // Determine the barcode value
        // 1. Check for input (Edit mode)
        const input = field.querySelector('input');
        // 2. Check for text content (Read-only mode)
        const textContent = field.textContent.trim();

        const value = input ? input.value : textContent;

        if (input || (value && value !== '-' && value.length > 0)) {
            // If the field is a div element, inject both Print and Generate buttons
            // Otherwise (e.g. span, td), inject only the Print button
            const showGenerate = field.tagName === 'DIV';
            injectButtons(field, value || '', showGenerate);
        }
    });

    // Strategy 2: Fallback for Mock App or custom views without name="barcode"
    // Only runs if we didn't find standard fields, to prevent duplicates
    if (odooFields.length === 0) {
        const allElements = document.getElementsByTagName('*');
        for (let el of allElements) {
            // Find label "Barcode"
            if (el.children.length === 0 && el.textContent.trim() === "Barcode") {
                // Navigate up to find the row/grid container
                let container = el.closest('.grid') || el.parentElement?.parentElement;
                if (container) {
                    // Try to find the value container.
                    // In the mock it was .odoo-value, in others it might be the last child
                    const valueDiv = container.querySelector('.odoo-value') || container.children[1];

                    if (valueDiv && !valueDiv.querySelector('.barcode-container')) {
                        const val = valueDiv.textContent.trim();
                        if (val && val !== "Barcode" && val !== '-') { // specific check to ensure we didn't grab the label itself
                            injectButtons(valueDiv, val, false);
                        }
                    }
                }
            }
        }
    }
}

function createPrintButton(field) {
    const btn = document.createElement('button');
    btn.className = 'barcode-btn';
    btn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
        </svg>
        <span>${PRINT_BUTTON_TEXT}</span>
    `;

    btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Read the latest barcode value at click time
        const input = field.querySelector('input');
        const barcode = input ? input.value : field.textContent.trim();
        openPrintModal(barcode);
    };

    return btn;
}

function createGenerateButton() {
    const btn = document.createElement('button');
    btn.className = 'barcode-btn';
    btn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
        </svg>
        <span>${GENERATE_BUTTON_TEXT}</span>
    `;

    btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        generateBarcode();
    };

    return btn;
}

function injectButtons(container, barcode, showGenerate) {
    // Create a wrapper to ensure it sits on a new line (block level)
    const wrapper = document.createElement('div');
    wrapper.className = 'barcode-container';

    wrapper.appendChild(createPrintButton(container));

    if (showGenerate) {
        wrapper.appendChild(createGenerateButton());
    }

    container.appendChild(wrapper);
}

// --- Modal Logic ---
function openPrintModal(barcode) {
    // Remove existing modal if present
    const existing = document.getElementById('barcode-printer-modal');
    if (existing) existing.remove();

    // Default values
    let width = 30;
    let height = 20;
    let copies = 1;

    // Create Modal DOM
    const modal = document.createElement('div');
    modal.id = 'barcode-printer-modal';
    modal.className = 'bp-modal-overlay';

    modal.innerHTML = `
        <div class="bp-modal">
            <div class="bp-header">
                <h3>Print Barcode Label</h3>
                <button id="bp-close">&times;</button>
            </div>
            <div class="bp-body">
                <p class="bp-subtitle">Configure label size and copies.</p>

                <div class="bp-grid">
                    <div>
                        <label>WIDTH (MM)</label>
                        <input type="number" id="bp-width" value="${width}">
                    </div>
                    <div>
                        <label>HEIGHT (MM)</label>
                        <input type="number" id="bp-height" value="${height}">
                    </div>
                </div>

                <div class="bp-row">
                    <label>COPIES</label>
                    <input type="number" id="bp-copies" value="${copies}" min="1">
                </div>

                <div class="bp-preview-container">
                    <div id="bp-preview-box" class="bp-preview-box">
                        <img id="bp-preview-img" alt="Barcode Preview" />
                    </div>
                </div>
            </div>
            <div class="bp-footer">
                <button id="bp-cancel">Cancel</button>
                <button id="bp-print" class="bp-btn-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                    Print
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // References
    const inputs = {
        width: modal.querySelector('#bp-width'),
        height: modal.querySelector('#bp-height'),
        copies: modal.querySelector('#bp-copies'),
        previewBox: modal.querySelector('#bp-preview-box'),
        previewImg: modal.querySelector('#bp-preview-img')
    };

    // Event Handlers
    const updatePreview = () => {
        const w = parseFloat(inputs.width.value) || 30;
        const h = parseFloat(inputs.height.value) || 20;

        // 1mm ~ 3.78px for screen
        const pxPerMm = 3.78;
        const paddingPx = 2 * pxPerMm; // 2mm margin

        inputs.previewBox.style.width = `${w * pxPerMm}px`;
        inputs.previewBox.style.height = `${h * pxPerMm}px`;
        inputs.previewBox.style.paddingLeft = `${paddingPx}px`;
        inputs.previewBox.style.paddingRight = `${paddingPx}px`;
        inputs.previewBox.style.boxSizing = 'border-box';

        // Use an external API for the preview image
        inputs.previewImg.src = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${barcode}&scale=3&height=12&includetext&paddingwidth=0&paddingheight=0`;
    };

    const handlePrint = () => {
        const w = inputs.width.value;
        const h = inputs.height.value;
        const c = inputs.copies.value;

        performPrint(barcode, w, h, c);
        modal.remove();
    };

    inputs.width.oninput = updatePreview;
    inputs.height.oninput = updatePreview;

    modal.querySelector('#bp-close').onclick = () => modal.remove();
    modal.querySelector('#bp-cancel').onclick = () => modal.remove();
    modal.querySelector('#bp-print').onclick = handlePrint;

    // Initial render
    updatePreview();
}

function performPrint(barcode, width, height, copies) {
    const printWindow = window.open('', '_blank', 'width=500,height=500');
    if (!printWindow) {
        alert('Please allow popups to print.');
        return;
    }

    const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${barcode}&scale=3&height=12&includetext&paddingwidth=0&paddingheight=0`;

    const pagesHtml = Array.from({ length: copies }).map(() => `
        <div class="page">
          <img src="${barcodeUrl}" alt="${barcode}" />
        </div>
    `).join('');

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Print Barcode</title>
          <style>
            @page {
              size: ${width}mm ${height}mm;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100%;
            }
            .page {
              /* Use viewport units to fill the print page regardless of the selected paper size */
              width: 100vw;
              height: 100vh;
              page-break-after: always;
              display: flex;
              justify-content: center;
              align-items: center;
              overflow: hidden;
              box-sizing: border-box;
              /* Optional: Add small margin to prevent cut-off on some printers */
              padding: 2mm;
            }
            .page:last-child {
              page-break-after: auto;
            }
            img {
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
              display: block;
            }
          </style>
        </head>
                <body>
                    ${pagesHtml}
                </body>
                </html>
        `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();

    // Call print() from the opener instead of injecting inline scripts into the
    // new window (CSP may block inline scripts). Wait for images to load, then
    // bring up the print dialog. Do NOT auto-close so the user can change options.
    const tryPrint = () => {
        try {
            const imgs = Array.from(printWindow.document.images || []);
            if (imgs.length === 0) {
                printWindow.focus();
                printWindow.print();
                return;
            }
            let loaded = 0;
            const done = () => {
                if (loaded >= imgs.length) {
                    printWindow.focus();
                    setTimeout(() => printWindow.print(), 100);
                }
            };
            imgs.forEach(img => {
                if (img.complete) {
                    loaded++;
                    done();
                } else {
                    img.addEventListener('load', () => { loaded++; done(); });
                    img.addEventListener('error', () => { loaded++; done(); });
                }
            });
        } catch (e) {
            // If cross-window access fails for any reason, fallback to a delayed print
            setTimeout(() => {
                try { printWindow.focus(); printWindow.print(); } catch (err) { }
            }, 300);
        }
    };

    // Start checking shortly after write/close to allow resources to begin loading.
    setTimeout(tryPrint, 50);
}

function generateBarcode() {
    const odooFields = document.querySelectorAll('[name="barcode"]');

    // Retrieve the last generated barcode from chrome storage
    chrome.storage.local.get(STORAGE_KEY, (result) => {
        const lastBarcode = result[STORAGE_KEY] || DEFAULT_BARCODE;

        // Increment the barcode by 1
        // Parse as a number, add 1, and pad back to the same length
        const barcodeNum = BigInt(lastBarcode) + 1n;
        const newBarcode = barcodeNum.toString().padStart(lastBarcode.length, '0');

        odooFields.forEach(field => {
            // Only works in Edit mode where the barcode is an input
            const input = field.querySelector('input[type="text"]');
            if (input) {
                input.value = newBarcode;
                // Dispatch input event so Odoo picks up the change
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });

        // Store the new barcode for next time
        chrome.storage.local.set({ [STORAGE_KEY]: newBarcode }, () => {
            console.log(`Barcode generated: ${newBarcode} (previous: ${lastBarcode})`);
        });
    });
}

// Start
init();
