import { KMLTable } from './components/KMLTable';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <h1 className="text-3xl font-bold text-gray-900">
            KML/KMZ File Viewer
          </h1>
          <p className="mt-2 text-gray-600">
            Upload KML or KMZ files to view their contents in a sortable, filterable table
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4">
        <div className="bg-white shadow rounded-lg">
          <KMLTable />
        </div>
      </main>

      <footer className="bg-white shadow mt-8">
        <div className="max-w-7xl mx-auto py-4 px-4 text-center text-gray-600">
          Drag and drop KML/KMZ files or click to select files
        </div>
      </footer>
    </div>
  );
}

export default App;
