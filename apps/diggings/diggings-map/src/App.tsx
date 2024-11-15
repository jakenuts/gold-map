import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MapProvider } from './context/MapContext';
import Map from './components/Map';
import ControlPanel from './components/ControlPanel';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

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
          <div className="w-screen h-screen flex overflow-hidden">
            <aside className="w-80 h-full p-4 bg-white shadow-lg z-10 flex flex-col">
              <h1 className="text-2xl font-bold mb-6">California Mining Claims Map</h1>
              <ControlPanel />
            </aside>
            <main className="flex-1 relative">
              <ErrorBoundary>
                <Map />
              </ErrorBoundary>
            </main>
          </div>
        </MapProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
