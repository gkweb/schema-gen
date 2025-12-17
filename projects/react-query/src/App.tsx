import { useState } from 'react';
import { PetList } from './components/PetList';
import { CreatePetForm } from './components/CreatePetForm';
import { PetDetails } from './components/PetDetails';
import { HealthStatus } from './components/HealthStatus';
import { FileUpload } from './components/FileUpload';

/**
 * Main App component demonstrating React Query v5 hooks usage
 *
 * This app showcases all the generated hooks from the petstore API:
 * - Query hooks (useListPets, useGetPet, etc.)
 * - Mutation hooks (useCreatePet, useUpdatePet, useDeletePet, etc.)
 * - Query key usage for cache invalidation
 * - Query options for prefetching
 * - FormData mutations for file uploads
 */
export default function App() {
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <header style={{ marginBottom: '30px' }}>
        <h1>Petstore - React Query v5 Demo</h1>
        <p>Integration test project for @schema-gen/plugin-react-query-v5</p>
      </header>

      <div style={{ marginBottom: '20px' }}>
        <HealthStatus />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Pets</h2>
            <button onClick={() => setShowCreateForm(!showCreateForm)}>
              {showCreateForm ? 'Cancel' : 'Add Pet'}
            </button>
          </div>

          {showCreateForm && (
            <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc' }}>
              <CreatePetForm onSuccess={() => setShowCreateForm(false)} />
            </div>
          )}

          <PetList onSelectPet={setSelectedPetId} selectedPetId={selectedPetId} />
        </section>

        <section>
          <h2>Details</h2>
          {selectedPetId ? (
            <PetDetails petId={selectedPetId} onClose={() => setSelectedPetId(null)} />
          ) : (
            <p>Select a pet to view details</p>
          )}
        </section>
      </div>

      <section style={{ marginTop: '30px' }}>
        <h2>File Upload</h2>
        <FileUpload />
      </section>
    </div>
  );
}
