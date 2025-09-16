import React, { useState, useRef } from 'react';
import { Upload, Download, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { useInventory } from '../../hooks/useInventory';

export const ImportExportPage: React.FC = () => {
  const { items, addItem } = useInventory();
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{ success: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportToCSV = () => {
    const headers = [
      'Name', 'Category', 'Manufacturer', 'Pattern', 'Year', 'Quantity',
      'Purchase Price', 'Current Value', 'Condition', 'Location', 'Description'
    ];
    
    const csvContent = [
      headers.join(','),
      ...items.map(item => [
        `"${item.item_name}"`,
        `"${item.category}"`,
        `"${item.manufacturer}"`,
        `"${item.pattern}"`,
        item.year_manufactured || '',
        item.quantity || 1,
        item.purchase_price,
        item.current_value,
        `"${item.condition}"`,
        `"${item.location}"`,
        `"${item.description}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `collection-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    const data = {
      collection: items,
      exportedAt: new Date().toISOString(),
      totalItems: items.length,
      categories: {
        milk_glass: items.filter(item => item.category === 'milk_glass').length,
        jadite: items.filter(item => item.category === 'jadite').length,
      }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `collection-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResults(null);

    try {
      const text = await file.text();
      let data: any[];

      if (file.name.endsWith('.csv')) {
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        data = lines.slice(1).filter(line => line.trim()).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          return headers.reduce((obj, header, index) => {
            obj[header.toLowerCase().replace(/\s+/g, '_')] = values[index] || '';
            return obj;
          }, {} as any);
        });
      } else if (file.name.endsWith('.json')) {
        const jsonData = JSON.parse(text);
        data = Array.isArray(jsonData) ? jsonData : jsonData.collection || jsonData.items || [];
      } else {
        throw new Error('Unsupported file format. Please use CSV or JSON.');
      }

      let successCount = 0;
      const errors: string[] = [];

      for (const [index, row] of data.entries()) {
        try {
          const itemData = {
            item_name: row.name || `Imported Item ${index + 1}`,
            category: (row.category === 'jadite' ? 'jadite' : 'milk_glass') as 'milk_glass' | 'jadite',
            manufacturer: row.manufacturer || '',
            pattern: row.pattern || '',
            year_manufactured: row.year_manufactured ? Number(row.year_manufactured) : null,
            quantity: row.quantity ? Number(row.quantity) : 1,
            purchase_price: Number(row.purchase_price) || 0,
            current_value: Number(row.current_value) || 0,
            location: row.location || '',
            description: row.description || '',
            condition: (row.condition as any) || 'good',
            photo_url: null,
          };

          const result = await addItem(itemData);
          if (result?.error) {
            errors.push(`Row ${index + 1}: ${result.error}`);
          } else {
            successCount++;
          }
        } catch (err: any) {
          errors.push(`Row ${index + 1}: ${err.message}`);
        }
      }

      setImportResults({ success: successCount, errors });
    } catch (error: any) {
      setImportResults({ success: 0, errors: [error.message] });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Import & Export</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Backup your collection or import items in bulk
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Export Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center mb-4">
              <Download className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Export Data</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Download your collection data in various formats for backup or external use.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={exportToCSV}
                className="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-green-600 dark:text-green-400 mr-3" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">CSV Format</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Compatible with Excel and other spreadsheet applications
                    </p>
                  </div>
                </div>
                <Download className="h-4 w-4 text-gray-400" />
              </button>

              <button
                onClick={exportToJSON}
                className="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">JSON Format</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Complete backup with metadata for re-import
                    </p>
                  </div>
                </div>
                <Download className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Import Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center mb-4">
              <Upload className="h-6 w-6 text-green-600 dark:text-green-400 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Import Data</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Import items from a CSV or JSON file. Supported columns: Name, Category, Manufacturer, Pattern, Year, Quantity, Purchase Price, Current Value, Condition, Location, Description.
            </p>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  Drag and drop your file here, or click to browse
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importing}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white rounded-lg transition-colors"
                >
                  {importing ? 'Importing...' : 'Choose File'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </div>

              {importResults && (
                <div className={`p-4 rounded-lg border ${
                  importResults.errors.length > 0 
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' 
                    : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                }`}>
                  <div className="flex items-start">
                    {importResults.errors.length > 0 ? (
                      <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 mr-3" />
                    )}
                    <div className="flex-1">
                      <p className={`font-medium ${
                        importResults.errors.length > 0 
                          ? 'text-yellow-800 dark:text-yellow-200' 
                          : 'text-green-800 dark:text-green-200'
                      }`}>
                        Import completed: {importResults.success} items successfully imported
                      </p>
                      {importResults.errors.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-1">
                            {importResults.errors.length} errors occurred:
                          </p>
                          <ul className="text-sm text-yellow-600 dark:text-yellow-400 space-y-1">
                            {importResults.errors.slice(0, 5).map((error, index) => (
                              <li key={index}>• {error}</li>
                            ))}
                            {importResults.errors.length > 5 && (
                              <li>• ... and {importResults.errors.length - 5} more errors</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};