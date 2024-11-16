import React, { useState, useCallback, DragEvent } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  createColumnHelper,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import { KMLService, PlacemarkData } from '../services/kmlService';

const columnHelper = createColumnHelper<PlacemarkData>();

export const KMLTable: React.FC = () => {
  const [data, setData] = useState<PlacemarkData[]>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columns, setColumns] = useState<ColumnDef<PlacemarkData, any>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsLoading(true);
    setError(null);
    try {
      const allData: PlacemarkData[] = [];
      for (let i = 0; i < files.length; i++) {
        const fileData = await KMLService.parseFile(files[i]);
        allData.push(...fileData);
      }

      if (allData.length === 0) {
        throw new Error('No valid data found in the provided files');
      }

      // Dynamically create columns based on the data
      const sampleData = allData[0];
      const newColumns = Object.keys(sampleData).map(key => 
        columnHelper.accessor((row: PlacemarkData) => row[key], {
          id: key,
          header: key.charAt(0).toUpperCase() + key.slice(1),
          cell: info => info.getValue()?.toString() || '',
        })
      );
      setColumns(newColumns);
      setData(allData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error processing files');
      console.error('Error processing files:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(event.target.files);
  };

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    processFiles(event.dataTransfer.files);
  }, []);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  return (
    <div className="p-4">
      <div 
        className={`
          relative mb-6 p-12 border-2 border-dashed rounded-lg text-center transition-all duration-200
          ${isDragging ? 'border-blue-500 bg-blue-50 scale-102' : 'border-gray-300'}
          ${isLoading ? 'opacity-50 pointer-events-none' : 'hover:border-blue-400 hover:bg-gray-50'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          onChange={handleFileUpload}
          multiple
          accept=".kml,.kmz"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          id="file-upload"
        />
        <div className="pointer-events-none">
          {isLoading ? (
            <div className="flex flex-col items-center space-y-4">
              <svg className="animate-spin h-10 w-10 text-blue-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-blue-600 text-lg font-medium">Processing files...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <svg className="h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3 3m0 0l-3-3m3 3V6" />
              </svg>
              <div>
                <p className="text-lg text-blue-600 font-medium">
                  Click to browse or drag and drop files here
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  KML and KMZ files supported
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 rounded-r flex items-center">
          <svg className="h-5 w-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {data.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <input
              type="text"
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
              placeholder="Search all columns..."
              className="w-full p-2 border rounded hover:border-blue-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th
                        key={header.id}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div className="flex items-center space-x-1">
                          <span>{flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}</span>
                          <span>
                            {{
                              asc: ' 🔼',
                              desc: ' 🔽',
                            }[header.column.getIsSorted() as string] ?? null}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t bg-gray-50 text-sm text-gray-500">
            Total rows: {table.getRowModel().rows.length}
          </div>
        </div>
      )}
    </div>
  );
};
