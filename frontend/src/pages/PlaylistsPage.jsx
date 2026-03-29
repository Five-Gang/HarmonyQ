import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { ListMusic, Plus, Globe, Lock, Heart, ArrowDown, ArrowUp } from 'lucide-react';
import { useUserPlaylists, usePublicPlaylists, useFollowingPlaylists, useCreatePlaylist, useUpdatePlaylist } from '../hooks/usePlaylists';
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
  const [sortBy, setSortBy] = useState('recent'); // recent, songs, duration, name-asc, name-desc
  const [showSortMenu, setShowSortMenu] = useState(false);
  const { user } = useUser();
  const { data, isLoading, error, refetch } = useUserPlaylists(user?.id);
  const { data: publicData, isLoading: publicLoading } = usePublicPlaylists({ limit: 20 });
  const { data: followingData, isLoading: followingLoading } = useFollowingPlaylists({ limit: 20 });
  const { data: favoritesData, isLoading: favoritesLoading } = useFavorites(user?.id);
  const createPlaylist = useCreatePlaylist();
  const updatePlaylist = useUpdatePlaylist();

  const [showModal, setShowModal] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);

  const playlists = data?.playlists || [];
  const publicPlaylists = publicData?.playlists || [];
  const followingPlaylists = followingData?.playlists || [];
  const favoriteSongIds = favoritesData?.favoriteSongIds || [];

  // Sort function
  const sortPlaylists = (items) => {
    const sorted = [...items];
    switch (sortBy) {
      case 'songs':
        return sorted.sort((a, b) => (b.songIds?.length || 0) - (a.songIds?.length || 0));
      case 'duration':
        return sorted.sort((a, b) => {
          // This would need song data, for now sort by count as proxy
          return (b.songIds?.length || 0) - (a.songIds?.length || 0);
        });
      case 'name-asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      case 'recent':
      default:
        return sorted.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }
  };

  const sortedPlaylists = sortPlaylists(playlists);
  const sortedPublicPlaylists = sortPlaylists(publicPlaylists);
  const sortedFollowingPlaylists = sortPlaylists(followingPlaylists);

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
          onClick={() => setActiveTab('following')}
          className={tabClasses('following')}
        >
          <Heart className="w-5 h-5" />
          Following
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
          {/* Sort Controls */}
          {playlists.length > 0 && (
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm text-muted">Sort by:</span>
              <div className="relative">
                <button
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 transition text-sm"
                >
                  {sortBy === 'recent' && 'Recently Modified'}
                  {sortBy === 'songs' && 'Song Count'}
                  {sortBy === 'duration' && 'Duration'}
                  {sortBy === 'name-asc' && 'A to Z'}
                  {sortBy === 'name-desc' && 'Z to A'}
                  {sortBy === 'recent' && <ArrowDown className="w-4 h-4" />}
                  {sortBy !== 'recent' && sortBy.includes('asc') && <ArrowUp className="w-4 h-4" />}
                  {sortBy !== 'recent' && sortBy.includes('desc') && <ArrowDown className="w-4 h-4" />}
                </button>

                {showSortMenu && (
                  <div className="absolute z-50 top-full mt-2 right-0 bg-slate-900 border border-slate-700 rounded-lg shadow-lg py-2 w-48">
                    <button
                      onClick={() => { setSortBy('recent'); setShowSortMenu(false); }}
                      className={`block w-full text-left px-4 py-2 text-sm transition ${
                        sortBy === 'recent' ? 'bg-accent-500/10 text-accent-400' : 'hover:bg-slate-800 text-foreground'
                      }`}
                    >
                      Recently Modified
                    </button>
                    <button
                      onClick={() => { setSortBy('songs'); setShowSortMenu(false); }}
                      className={`block w-full text-left px-4 py-2 text-sm transition ${
                        sortBy === 'songs' ? 'bg-accent-500/10 text-accent-400' : 'hover:bg-slate-800 text-foreground'
                      }`}
                    >
                      Most Songs
                    </button>
                    <button
                      onClick={() => { setSortBy('name-asc'); setShowSortMenu(false); }}
                      className={`block w-full text-left px-4 py-2 text-sm transition ${
                        sortBy === 'name-asc' ? 'bg-accent-500/10 text-accent-400' : 'hover:bg-slate-800 text-foreground'
                      }`}
                    >
                      A to Z
                    </button>
                    <button
                      onClick={() => { setSortBy('name-desc'); setShowSortMenu(false); }}
                      className={`block w-full text-left px-4 py-2 text-sm transition ${
                        sortBy === 'name-desc' ? 'bg-accent-500/10 text-accent-400' : 'hover:bg-slate-800 text-foreground'
                      }`}
                    >
                      Z to A
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

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
              {sortedPlaylists.map((pl) => (
                <PlaylistCard key={pl._id} playlist={pl} onEdit={openEdit} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Public Playlists Tab */}
      {activeTab === 'public-playlists' && (
        <>
          {/* Sort Controls */}
          {publicPlaylists.length > 0 && (
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm text-muted">Sort by:</span>
              <div className="relative">
                <button
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 transition text-sm"
                >
                  {sortBy === 'recent' && 'Recently Modified'}
                  {sortBy === 'songs' && 'Song Count'}
                  {sortBy === 'duration' && 'Duration'}
                  {sortBy === 'name-asc' && 'A to Z'}
                  {sortBy === 'name-desc' && 'Z to A'}
                  {sortBy === 'recent' && <ArrowDown className="w-4 h-4" />}
                  {sortBy !== 'recent' && sortBy.includes('asc') && <ArrowUp className="w-4 h-4" />}
                  {sortBy !== 'recent' && sortBy.includes('desc') && <ArrowDown className="w-4 h-4" />}
                </button>

                {showSortMenu && (
                  <div className="absolute z-50 top-full mt-2 right-0 bg-slate-900 border border-slate-700 rounded-lg shadow-lg py-2 w-48">
                    <button
                      onClick={() => { setSortBy('recent'); setShowSortMenu(false); }}
                      className={`block w-full text-left px-4 py-2 text-sm transition ${
                        sortBy === 'recent' ? 'bg-accent-500/10 text-accent-400' : 'hover:bg-slate-800 text-foreground'
                      }`}
                    >
                      Recently Modified
                    </button>
                    <button
                      onClick={() => { setSortBy('songs'); setShowSortMenu(false); }}
                      className={`block w-full text-left px-4 py-2 text-sm transition ${
                        sortBy === 'songs' ? 'bg-accent-500/10 text-accent-400' : 'hover:bg-slate-800 text-foreground'
                      }`}
                    >
                      Most Songs
                    </button>
                    <button
                      onClick={() => { setSortBy('name-asc'); setShowSortMenu(false); }}
                      className={`block w-full text-left px-4 py-2 text-sm transition ${
                        sortBy === 'name-asc' ? 'bg-accent-500/10 text-accent-400' : 'hover:bg-slate-800 text-foreground'
                      }`}
                    >
                      A to Z
                    </button>
                    <button
                      onClick={() => { setSortBy('name-desc'); setShowSortMenu(false); }}
                      className={`block w-full text-left px-4 py-2 text-sm transition ${
                        sortBy === 'name-desc' ? 'bg-accent-500/10 text-accent-400' : 'hover:bg-slate-800 text-foreground'
                      }`}
                    >
                      Z to A
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

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
              {sortedPublicPlaylists.map((pl) => (
                <PlaylistCard key={pl._id} playlist={pl} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Following Playlists Tab */}
      {activeTab === 'following' && (
        <>
          {/* Sort Controls */}
          {followingPlaylists.length > 0 && (
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm text-muted">Sort by:</span>
              <div className="relative">
                <button
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 transition text-sm"
                >
                  {sortBy === 'recent' && 'Recently Modified'}
                  {sortBy === 'songs' && 'Song Count'}
                  {sortBy === 'duration' && 'Duration'}
                  {sortBy === 'name-asc' && 'A to Z'}
                  {sortBy === 'name-desc' && 'Z to A'}
                  {sortBy === 'recent' && <ArrowDown className="w-4 h-4" />}
                  {sortBy !== 'recent' && sortBy.includes('asc') && <ArrowUp className="w-4 h-4" />}
                  {sortBy !== 'recent' && sortBy.includes('desc') && <ArrowDown className="w-4 h-4" />}
                </button>

                {showSortMenu && (
                  <div className="absolute z-50 top-full mt-2 right-0 bg-slate-900 border border-slate-700 rounded-lg shadow-lg py-2 w-48">
                    <button
                      onClick={() => { setSortBy('recent'); setShowSortMenu(false); }}
                      className={`block w-full text-left px-4 py-2 text-sm transition ${
                        sortBy === 'recent' ? 'bg-accent-500/10 text-accent-400' : 'hover:bg-slate-800 text-foreground'
                      }`}
                    >
                      Recently Modified
                    </button>
                    <button
                      onClick={() => { setSortBy('songs'); setShowSortMenu(false); }}
                      className={`block w-full text-left px-4 py-2 text-sm transition ${
                        sortBy === 'songs' ? 'bg-accent-500/10 text-accent-400' : 'hover:bg-slate-800 text-foreground'
                      }`}
                    >
                      Most Songs
                    </button>
                    <button
                      onClick={() => { setSortBy('name-asc'); setShowSortMenu(false); }}
                      className={`block w-full text-left px-4 py-2 text-sm transition ${
                        sortBy === 'name-asc' ? 'bg-accent-500/10 text-accent-400' : 'hover:bg-slate-800 text-foreground'
                      }`}
                    >
                      A to Z
                    </button>
                    <button
                      onClick={() => { setSortBy('name-desc'); setShowSortMenu(false); }}
                      className={`block w-full text-left px-4 py-2 text-sm transition ${
                        sortBy === 'name-desc' ? 'bg-accent-500/10 text-accent-400' : 'hover:bg-slate-800 text-foreground'
                      }`}
                    >
                      Z to A
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {followingLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : followingPlaylists.length === 0 ? (
            <EmptyState
              icon={Heart}
              title="No playlists followed yet"
              description="Follow public playlists to see them here!"
            />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sortedFollowingPlaylists.map((pl) => (
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
