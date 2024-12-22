 import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { DataSource, DataRecord } from '../types/data-source';
import { dataSourceRegistry } from '../data-sources/registry';

interface DataTableProps {
  initialSource?: string;
  onSourceChange?: (sourceId: string) => void;
}

export const DataTable: React.FC<DataTableProps> = ({
  initialSource,
  onSourceChange,
}) => {
  const [selectedSource, setSelectedSource] = useState<DataSource | null>(null);
  const [data, setData] = useState<DataRecord[]>([]);
  const [columns, setColumns] = useState<Array<{
    id: string;
    header: string;
    type: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Load initial source if provided
  useEffect(() => {
    if (initialSource) {
      const source = dataSourceRegistry.get(initialSource);
      if (source) {
        setSelectedSource(source);
      }
    }
  }, [initialSource]);

  // Load columns when source changes
  useEffect(() => {
    if (selectedSource) {
      loadColumns();
    }
  }, [selectedSource]);

  const loadColumns = async () => {
    if (!selectedSource) return;

    try {
      const cols = await selectedSource.getColumns();
      setColumns(cols);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading columns');
      console.error('Error loading columns:', err);
    }
  };

  const loadData = async () => {
    if (!selectedSource) return;

    setIsLoading(true);
    setError(null);
    try {
      const result = await selectedSource.fetchData();
      setData(result.records);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading data');
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSourceChange = async (sourceId: string) => {
    const source = dataSourceRegistry.get(sourceId);
    if (source) {
      setSelectedSource(source);
      onSourceChange?.(sourceId);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const kmlSource = dataSourceRegistry.get('kml');
    if (kmlSource && 'setFile' in kmlSource) {
      await (kmlSource as any).setFile(files[0]);
      setSelectedSource(kmlSource);
      onSourceChange?.('kml');
    }
  };

  const filteredData = data.filter(record => 
    Object.values(record).some(value => 
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const renderCell = (value: any, type: string) => {
    if (type === 'geometry') {
      if (value?.type === 'Point') {
        return `${value.coordinates[1]}, ${value.coordinates[0]}`;
      }
      return 'Complex geometry';
    }
    return value?.toString() || '';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                {selectedSource?.metadata.name || 'Select Data Source'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {dataSourceRegistry.getAll().map(source => (
                <DropdownMenuItem
                  key={source.metadata.id}
                  onClick={() => handleSourceChange(source.metadata.id)}
                >
                  {source.metadata.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {selectedSource?.metadata.type === 'file' && (
            <Input
              type="file"
              onChange={handleFileUpload}
              accept=".kml,.kmz"
              className="max-w-sm"
            />
          )}

          <Button onClick={loadData} disabled={!selectedSource || isLoading}>
            {isLoading ? 'Loading...' : 'Load Data'}
          </Button>
        </div>

        <Input
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(column => (
                <TableHead key={column.id}>{column.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((record, idx) => (
              <TableRow key={record.id || idx}>
                {columns.map(column => (
                  <TableCell key={column.id}>
                    {renderCell(record[column.id], column.type)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-gray-500">
        Showing {filteredData.length} records
      </div>
    </div>
  );
};
