import { DataTable } from './components/DataTable';

function App() {
  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Data Viewer</h1>
        <p className="text-muted-foreground mt-2">
          View and analyze data from multiple sources including USGS feeds and KML/KMZ files.
        </p>
      </div>
      
      <DataTable />
    </div>
  );
}

export default App;
