import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';

// --- Icons ---
const PrinterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9"></polyline>
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
    <rect x="6" y="14" width="12" height="8"></rect>
  </svg>
);

const ExternalLinkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline ml-1 text-blue-500">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
    <polyline points="15 3 21 3 21 9"></polyline>
    <line x1="10" y1="14" x2="21" y2="3"></line>
  </svg>
);

const HelpIcon = () => (
  <span className="text-blue-500 text-xs ml-1 cursor-pointer">?</span>
);

// --- Print Modal Component ---
interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  barcode: string;
}

const PrintModal: React.FC<PrintModalProps> = ({ isOpen, onClose, barcode }) => {
  const [width, setWidth] = useState(30);
  const [height, setHeight] = useState(20);
  const [copies, setCopies] = useState(1);
  const svgRef = useRef<SVGSVGElement>(null);

  // Render barcode in preview when modal opens
  useEffect(() => {
    if (isOpen && svgRef.current) {
      // @ts-ignore
      const jsBarcode = window.JsBarcode;
      if (jsBarcode) {
        try {
          jsBarcode(svgRef.current, barcode, {
            format: "CODE128",
            displayValue: true,
            fontSize: 14,
            margin: 0,
            textMargin: 0,
            width: 2,
            height: 25 
          });
        } catch (e) {
          console.error("Barcode generation error", e);
        }
      }
    }
  }, [isOpen, barcode, width, height]);

  if (!isOpen) return null;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=500,height=500');
    if (printWindow) {
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
              width: 100vw;
              height: 100vh;
              page-break-after: always;
              display: flex;
              justify-content: center;
              align-items: center;
              overflow: hidden;
              box-sizing: border-box;
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
          <script>
            function waitForImagesAndPrint() {
              const images = Array.from(document.images || []);
              if (images.length === 0) {
                window.focus();
                setTimeout(() => window.print(), 50);
                return;
              }
              let loaded = 0;
              const done = () => {
                if (loaded >= images.length) {
                  window.focus();
                  setTimeout(() => window.print(), 100);
                }
              };
              images.forEach(img => {
                if (img.complete) {
                  loaded++;
                  done();
                } else {
                  img.addEventListener('load', () => { loaded++; done(); });
                  img.addEventListener('error', () => { loaded++; done(); });
                }
              });
            }
            document.addEventListener('DOMContentLoaded', waitForImagesAndPrint);
          </script>
        </body>
        </html>
      `;
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
    }
    onClose();
  };

  const pxPerMm = 3.78;
  const previewWidth = width * pxPerMm;
  const previewHeight = height * pxPerMm;
  const paddingPx = 2 * pxPerMm;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-xl w-80 overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50 flex justify-between items-center">
          <h3 className="font-semibold text-gray-700">Print Barcode Label</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="text-sm text-gray-600 mb-2">
            Configure label size and copies.
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Width (mm)</label>
              <input 
                type="number" 
                value={width} 
                onChange={(e) => setWidth(Number(e.target.value))}
                className="w-full border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Height (mm)</label>
              <input 
                type="number" 
                value={height} 
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>
          
          <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Copies</label>
              <input 
                type="number" 
                min="1"
                value={copies} 
                onChange={(e) => setCopies(Math.max(1, Number(e.target.value)))}
                className="w-full border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
          </div>

          <div className="bg-gray-100 p-4 rounded flex justify-center items-center h-32 border border-dashed border-gray-300">
             <div 
               style={{ 
                 width: `${previewWidth}px`, 
                 height: `${previewHeight}px`,
                 maxHeight: '100%',
                 maxWidth: '100%',
                 aspectRatio: `${width}/${height}`,
                 paddingLeft: `${paddingPx}px`,
                 paddingRight: `${paddingPx}px`,
                 boxSizing: 'border-box'
               }} 
               className="bg-white border border-gray-400 shadow-sm flex items-center justify-center overflow-hidden transition-all duration-200"
             >
               <svg ref={svgRef} className="w-full h-full"></svg>
             </div>
          </div>
        </div>

        <div className="px-4 py-3 bg-gray-50 flex justify-end space-x-2">
          <button 
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded"
          >
            Cancel
          </button>
          <button 
            onClick={handlePrint}
            className="px-3 py-1.5 text-sm bg-teal-600 text-white rounded hover:bg-teal-700 flex items-center"
          >
            <span className="mr-2"><PrinterIcon /></span>
            Print
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Application Component ---
const App = () => {
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const barcodeValue = "013618331275";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b h-12 flex items-center px-4 justify-between">
        <div className="flex items-center space-x-6">
          <span className="font-bold text-teal-700 text-lg">Inventory</span>
          <div className="hidden md:flex space-x-4 text-sm text-gray-600">
            <span className="cursor-pointer hover:text-black">Overview</span>
            <span className="cursor-pointer hover:text-black">Operations</span>
            <span className="cursor-pointer hover:text-black font-medium text-gray-900">Products</span>
            <span className="cursor-pointer hover:text-black">Reporting</span>
            <span className="cursor-pointer hover:text-black">Configuration</span>
          </div>
        </div>
        <div className="flex items-center space-x-3 text-gray-500 text-sm">
           <div className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              <span>1</span>
           </div>
           <span>Evergreen Wares</span>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 bg-white">
        {/* Breadcrumb & Actions */}
        <div className="border-b px-4 py-2 bg-white">
            <div className="text-sm text-gray-500 mb-2">
                ... / <span className="text-teal-600 hover:underline cursor-pointer">Gerber 2-Piece Toddler Girls Floral Tops - Pink ...</span> / <span className="text-teal-600 hover:underline cursor-pointer">Product Vari...</span>
            </div>
            <div className="flex items-center justify-between">
                <div className="space-x-2">
                    <button className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded text-sm font-medium border border-gray-300">Update Quantity</button>
                    <button className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded text-sm font-medium border border-gray-300">Replenish</button>
                    <button className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded text-sm font-medium border border-gray-300">Print Labels</button>
                </div>
                <div className="flex items-center space-x-2 text-gray-400">
                    <span>1 / 6</span>
                    <button className="p-1 hover:bg-gray-100 rounded">&lt;</button>
                    <button className="p-1 hover:bg-gray-100 rounded">&gt;</button>
                </div>
            </div>
        </div>

        {/* Product Form */}
        <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex justify-between items-start mb-6">
                <div className="w-full">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        Gerber 2-Piece Toddler Girls Floral Tops - Pink + Purple
                    </h1>
                    <div className="flex items-center space-x-2 mb-4">
                        <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs font-semibold">Sizes: 12M</span>
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-semibold">Brand: Gerber</span>
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-semibold">Gender: Girl</span>
                    </div>
                    <p className="text-sm text-gray-600">
                        All general settings about this product are managed on <span className="text-teal-600 hover:underline cursor-pointer">the product template</span>.
                    </p>
                </div>
                <div className="w-32 h-32 border p-1 rounded">
                    <img src="https://images.unsplash.com/photo-1596870230751-ebdfce98ec42?auto=format&fit=crop&w=200&q=80" alt="Product" className="w-full h-full object-cover" />
                </div>
            </div>

            {/* Form Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                {/* Left Column */}
                <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase border-b pb-2 mb-4">Codes</h3>
                    
                    <div className="grid grid-cols-3 gap-4 mb-2 items-center">
                        <div className="col-span-1 odoo-label">Internal Reference</div>
                        <div className="col-span-2 odoo-value">-</div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-2 items-start">
                        <div className="col-span-1 odoo-label flex items-center">
                            Barcode <HelpIcon />
                        </div>
                        <div className="col-span-2">
                            <div className="odoo-value mb-1">{barcodeValue}</div>
                            
                            {/* --- THE EXTENSION FEATURE --- */}
                            <button 
                                onClick={() => setIsPrintModalOpen(true)}
                                className="inline-flex items-center px-2 py-1 bg-teal-50 text-teal-700 text-xs font-medium rounded border border-teal-200 hover:bg-teal-100 transition-colors"
                            >
                                <PrinterIcon />
                                <span className="ml-1">Print Barcode</span>
                            </button>
                            {/* ----------------------------- */}

                        </div>
                    </div>

                    <h3 className="text-xs font-bold text-gray-500 uppercase border-b pb-2 mb-4 mt-8">Logistics</h3>
                    
                    <div className="grid grid-cols-3 gap-4 mb-2 items-center">
                        <div className="col-span-1 odoo-label">Volume</div>
                        <div className="col-span-2 odoo-value flex justify-between">
                            <span>0.00</span>
                            <span className="text-gray-400">ft³</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-2 items-center">
                        <div className="col-span-1 odoo-label">Weight</div>
                        <div className="col-span-2 odoo-value flex justify-between">
                            <span>0.00</span>
                            <span className="text-gray-400">lb</span>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase border-b pb-2 mb-4">Pricing</h3>
                    
                    <div className="grid grid-cols-3 gap-4 mb-2 items-center">
                        <div className="col-span-1 odoo-label flex items-center">Sales Price <HelpIcon /></div>
                        <div className="col-span-2 odoo-value flex justify-between">
                             <span>31.99 $</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-2 items-center">
                        <div className="col-span-1 odoo-label flex items-center">Cost <HelpIcon /></div>
                        <div className="col-span-2 odoo-value flex justify-between">
                             <span>6.38 $</span>
                        </div>
                    </div>

                    <h3 className="text-xs font-bold text-gray-500 uppercase border-b pb-2 mb-4 mt-8">Sales</h3>
                    
                     <div className="grid grid-cols-3 gap-4 mb-2 items-center">
                        <div className="col-span-1 odoo-label">Tags</div>
                        <div className="col-span-2 odoo-value"></div>
                    </div>
                     <div className="grid grid-cols-3 gap-4 mb-2 items-center">
                        <div className="col-span-1 odoo-label">Variant Tags</div>
                        <div className="col-span-2 odoo-value"></div>
                    </div>
                     <div className="grid grid-cols-3 gap-4 mb-2 items-center">
                        <div className="col-span-1 odoo-label">Ribbon</div>
                        <div className="col-span-2 odoo-value">Sale</div>
                    </div>
                     <div className="grid grid-cols-3 gap-4 mb-2 items-center">
                        <div className="col-span-1 odoo-label">Variant Ribbon</div>
                        <div className="col-span-2 odoo-value"></div>
                    </div>
                </div>
            </div>

            <div className="mt-8">
                 <h3 className="text-xs font-bold text-gray-500 uppercase border-b pb-2 mb-4">Extra Variant Media</h3>
                 <button className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded text-sm font-medium border border-gray-300">Add Media</button>
            </div>
        </div>
      </main>

      <PrintModal 
        isOpen={isPrintModalOpen} 
        onClose={() => setIsPrintModalOpen(false)}
        barcode={barcodeValue}
      />
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
