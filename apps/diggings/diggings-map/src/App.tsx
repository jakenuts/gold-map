import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Map from './components/Map';
import ControlPanel from './components/ControlPanel';
import { MapProvider } from './context/MapContext';
import ErrorBoundary from './components/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000,
    }
  }
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <MapProvider>
          <div className="flex flex-col h-full">
            <header className="bg-gray-800 text-white p-4 shadow-lg z-10">
              <h1 className="text-2xl font-bold">California Mining Claims Map</h1>
            </header>
            <main className="flex-1 relative">
              <ErrorBoundary>
                <Map />
              </ErrorBoundary>
              <ControlPanel />
            </main>
          </div>
        </MapProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
