import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { ListMusic, Plus, Globe, Lock, Heart } from 'lucide-react';
import { useUserPlaylists, usePublicPlaylists, useCreatePlaylist, useUpdatePlaylist } from '../hooks/usePlaylists';
import { useSongs } from '../hooks/useSongs';
import { useFavorites } from '../hooks/useUser';
import { PlaylistCard } from '../components/playlists/PlaylistCard.jsx';
import { SongCard } from '../components/songs/SongCard.jsx';
import { Modal, FormField } from '../components/ui/index.jsx';
import { SkeletonCard, EmptyState, ErrorState } from '../components/ui/LoadingStates.jsx';

const INITIAL_FORM = { name: '', description: '', isPublic: false };

function FavoritesGrid({ favoriteSongIds }) {
  const { data: songsData, isLoading } = useSongs({
    limit: 100,
    search: undefined,
  });

  const allSongs = songsData?.songs || [];
  const favoriteSongs = allSongs.filter((song) => favoriteSongIds.includes(song._id));

  if (isLoading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (favoriteSongs.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="No favorite songs found"
        description="Your loved songs will appear here."
      />
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {favoriteSongs.map((song) => (
        <SongCard key={song._id} song={song} />
      ))}
    </div>
  );
}

export default function PlaylistsPage() {
  const [activeTab, setActiveTab] = useState('my-playlists');
  const { user } = useUser();
  const { data, isLoading, error, refetch } = useUserPlaylists(user?.id);
  const { data: publicData, isLoading: publicLoading } = usePublicPlaylists({ limit: 20 });
  const { data: favoritesData, isLoading: favoritesLoading } = useFavorites(user?.id);
  const createPlaylist = useCreatePlaylist();
  const updatePlaylist = useUpdatePlaylist();

  const [showModal, setShowModal] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);

  const playlists = data?.playlists || [];
  const publicPlaylists = publicData?.playlists || [];
  const favoriteSongIds = favoritesData?.favoriteSongIds || [];

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

  const tabClasses = (tab) => `px-6 py-3 font-medium transition-all flex items-center gap-2 ${
    activeTab === tab
      ? 'text-accent-400 border-b-2 border-accent-400'
      : 'text-muted hover:text-foreground'
  }`;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Playlists</h1>
          <p className="text-muted mt-1">Create and explore playlists</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" /> New Playlist
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-800 flex gap-8">
        <button
          onClick={() => setActiveTab('my-playlists')}
          className={tabClasses('my-playlists')}
        >
          <ListMusic className="w-5 h-5" />
          My Playlists
        </button>
        <button
          onClick={() => setActiveTab('public-playlists')}
          className={tabClasses('public-playlists')}
        >
          <Globe className="w-5 h-5" />
          Browse Public
        </button>
        <button
          onClick={() => setActiveTab('favorites')}
          className={tabClasses('favorites')}
        >
          <Heart className="w-5 h-5" />
          Favorites
        </button>
      </div>

      {/* My Playlists Tab */}
      {activeTab === 'my-playlists' && (
        <>
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
        </>
      )}

      {/* Public Playlists Tab */}
      {activeTab === 'public-playlists' && (
        <>
          {publicLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : publicPlaylists.length === 0 ? (
            <EmptyState
              icon={Globe}
              title="No public playlists yet"
              description="Create a public playlist and share your music taste with others!"
              action={<button onClick={openCreate} className="btn-primary">Create Public Playlist</button>}
            />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {publicPlaylists.map((pl) => (
                <PlaylistCard key={pl._id} playlist={pl} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Favorites Tab */}
      {activeTab === 'favorites' && (
        <>
          {favoritesLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : favoriteSongIds.length === 0 ? (
            <EmptyState
              icon={Heart}
              title="No favorite songs yet"
              description="Heart songs while playing to add them to your favorites."
            />
          ) : (
            <FavoritesGrid favoriteSongIds={favoriteSongIds} />
          )}
        </>
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
