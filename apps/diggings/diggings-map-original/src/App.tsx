import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Map from './components/Map';
import ControlPanel from './components/ControlPanel';
import { MapProvider } from './context/MapContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MapProvider>
        <div className="flex flex-col h-full">
          <header className="bg-gray-800 text-white p-4 shadow-lg z-10">
            <h1 className="text-xl font-bold">California Mining Claims Map</h1>
          </header>
          <main className="flex-1 relative">
            <Map />
            <ControlPanel />
          </main>
        </div>
      </MapProvider>
    </QueryClientProvider>
  );
}

export default App;
