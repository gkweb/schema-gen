import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { PetList, PetDetail, PetCreate, PetEdit, Store } from './components';

/**
 * Main App component demonstrating React Query v5 hooks usage
 *
 * This app showcases all the generated hooks from the Petstore v3 API:
 * - Query hooks (useFindPetsByStatus, useGetPetById, useGetInventory, etc.)
 * - Mutation hooks (useAddPet, useUpdatePet, useDeletePet, usePlaceOrder, etc.)
 * - Query key usage for cache invalidation
 * - Query options for prefetching
 */
export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <header className="app-header">
          <h1>Petstore - React Query v5</h1>
          <nav className="app-nav">
            <NavLink to="/pets">Pets</NavLink>
            <NavLink to="/store">Store</NavLink>
          </nav>
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Navigate to="/pets" replace />} />
            <Route path="/pets" element={<PetList />} />
            <Route path="/pets/new" element={<PetCreate />} />
            <Route path="/pets/:id" element={<PetDetail />} />
            <Route path="/pets/:id/edit" element={<PetEdit />} />
            <Route path="/store" element={<Store />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
