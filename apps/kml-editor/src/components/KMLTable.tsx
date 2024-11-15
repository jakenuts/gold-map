import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  createColumnHelper,
  flexRender,
  ColumnDef,
  FilterFn,
} from '@tanstack/react-table';
import { KMLService, PlacemarkData } from '../services/kmlService';

const columnHelper = createColumnHelper<PlacemarkData>();

export const KMLTable: React.FC = () => {
  const [data, setData] = useState<PlacemarkData[]>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columns, setColumns] = useState<ColumnDef<PlacemarkData, any>[]>([]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      const allData: PlacemarkData[] = [];
      for (let i = 0; i < files.length; i++) {
        const fileData = await KMLService.parseFile(files[i]);
        allData.push(...fileData);
      }

      // Dynamically create columns based on the data
      if (allData.length > 0) {
        const sampleData = allData[0];
        const newColumns = Object.keys(sampleData)
          .filter(key => typeof sampleData[key] !== 'number') // Filter out number keys
          .map(key => 
            columnHelper.accessor((row: PlacemarkData) => row[key], {
              id: key,
              header: key.charAt(0).toUpperCase() + key.slice(1),
              cell: info => info.getValue()?.toString() || '',
            })
          );
        setColumns(newColumns);
      }

      setData(allData);
    } catch (error) {
      console.error('Error parsing file:', error);
      alert('Error parsing file. Please ensure it is a valid KML/KMZ file.');
    }
  };

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
      <div className="mb-4">
        <input
          type="file"
          onChange={handleFileUpload}
          multiple
          accept=".kml,.kmz"
          className="mb-4 p-2 border rounded"
        />
        <input
          type="text"
          value={globalFilter}
          onChange={e => setGlobalFilter(e.target.value)}
          placeholder="Search all columns..."
          className="p-2 border rounded w-full"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-4 py-2 border-b bg-gray-50 text-left cursor-pointer"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {{
                      asc: ' 🔼',
                      desc: ' 🔽',
                    }[header.column.getIsSorted() as string] ?? null}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-4 py-2 border-b">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        Total rows: {table.getRowModel().rows.length}
      </div>
    </div>
  );
};
