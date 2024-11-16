import { KMLTable } from './components/KMLTable';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">
            KML/KMZ File Viewer
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Upload KML or KMZ files to view their contents in a sortable, filterable table
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow">
            <KMLTable />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
