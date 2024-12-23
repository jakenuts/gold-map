import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
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
  const [selectedRecord, setSelectedRecord] = useState<DataRecord | null>(null);

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
    Object.entries(record).some(([key, value]) => 
      key !== '_allProperties' && // Exclude _allProperties from search
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const renderCell = (value: any, type: string) => {
    if (type === 'geometry') {
      if (value?.type === 'Point') {
        return `${value.coordinates[1].toFixed(6)}, ${value.coordinates[0].toFixed(6)}`;
      }
      return 'No location';
    }
    return value?.toString() || '';
  };

  const renderPropertyTable = (record: DataRecord) => {
    if (!record._allProperties) return null;

    return (
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">All Properties</h3>
        <div className="max-h-96 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(record._allProperties)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell className="font-medium">{key}</TableCell>
                    <TableCell>{value?.toString() || ''}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
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
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
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
              <TableHead>Actions</TableHead>
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
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedRecord(selectedRecord?.id === record.id ? null : record)}
                  >
                    {selectedRecord?.id === record.id ? 'Hide Details' : 'View Details'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedRecord && renderPropertyTable(selectedRecord)}

      <div className="text-sm text-gray-500">
        Showing {filteredData.length} records
      </div>
    </div>
  );
};
