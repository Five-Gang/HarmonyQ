import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { ListMusic, Plus, Globe, Lock } from 'lucide-react';
import { useUserPlaylists, useCreatePlaylist, useUpdatePlaylist } from '../hooks/usePlaylists';
import { PlaylistCard } from '../components/playlists/PlaylistCard.jsx';
import { Modal, FormField } from '../components/ui/index.jsx';
import { SkeletonCard, EmptyState, ErrorState } from '../components/ui/LoadingStates.jsx';

const INITIAL_FORM = { name: '', description: '', isPublic: false };

export default function PlaylistsPage() {
  const { user } = useUser();
  const { data, isLoading, error, refetch } = useUserPlaylists(user?.id);
  const createPlaylist = useCreatePlaylist();
  const updatePlaylist = useUpdatePlaylist();

  const [showModal, setShowModal] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);

  const playlists = data?.playlists || [];

  const openCreate = () => {
    setEditingPlaylist(null);
    setForm(INITIAL_FORM);
    setShowModal(true);
  };

  const openEdit = (pl) => {
    setEditingPlaylist(pl);
    setForm({ name: pl.name, description: pl.description || '', isPublic: pl.isPublic });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingPlaylist) {
      await updatePlaylist.mutateAsync({ id: editingPlaylist._id, data: form });
    } else {
      await createPlaylist.mutateAsync(form);
    }
    setShowModal(false);
    setForm(INITIAL_FORM);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">My Playlists</h1>
          <p className="text-muted mt-1">{playlists.length} playlist{playlists.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" /> New Playlist
        </button>
      </div>

      {error ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : playlists.length === 0 ? (
        <EmptyState
          icon={ListMusic}
          title="No playlists yet"
          description="Create your first playlist to start organizing your music."
          action={<button onClick={openCreate} className="btn-primary">Create Playlist</button>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {playlists.map((pl) => (
            <PlaylistCard key={pl._id} playlist={pl} onEdit={openEdit} />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingPlaylist ? 'Edit Playlist' : 'Create Playlist'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Name*" id="pl-name">
            <input
              id="pl-name"
              className="input"
              required
              maxLength={200}
              placeholder="My Awesome Playlist"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </FormField>
          <FormField label="Description" id="pl-desc">
            <textarea
              id="pl-desc"
              className="input resize-none"
              rows={3}
              maxLength={1000}
              placeholder="Optional description..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </FormField>

          {/* Privacy Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-surface-2 border border-white/5">
            <div className="flex items-center gap-3">
              {form.isPublic ? (
                <Globe className="w-5 h-5 text-emerald-400" />
              ) : (
                <Lock className="w-5 h-5 text-slate-500" />
              )}
              <div>
                <p className="text-sm font-medium text-white">{form.isPublic ? 'Public' : 'Private'}</p>
                <p className="text-xs text-slate-400">
                  {form.isPublic ? 'Anyone can view this playlist' : 'Only you can see this'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, isPublic: !f.isPublic }))}
              className={`relative inline-flex w-11 h-6 rounded-full transition-colors duration-200 ${
                form.isPublic ? 'bg-emerald-500' : 'bg-surface-4'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                  form.isPublic ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              type="submit"
              disabled={createPlaylist.isPending || updatePlaylist.isPending}
              className="btn-primary flex-1"
            >
              {(createPlaylist.isPending || updatePlaylist.isPending) ? 'Saving...' : (editingPlaylist ? 'Save Changes' : 'Create')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
