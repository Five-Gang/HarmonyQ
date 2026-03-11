import { useState, useCallback } from 'react';
import {
  Plus, Search, Trash2, Edit3, Music2, Clock, Disc3,
  ChevronDown, MoreHorizontal, X, Filter, Download
} from 'lucide-react';
import { useSongs, useCreateSong, useDeleteSong } from '../../hooks/useSongs';
import { SearchBar, Modal, FormField, Pagination, Badge } from '../../components/ui/index.jsx';
import { SkeletonList, EmptyState, ErrorState } from '../../components/ui/LoadingStates.jsx';
import toast from 'react-hot-toast';

const GENRES = [
  'Pop', 'Rock', 'Hip-Hop', 'R&B', 'Jazz', 'Classical',
  'Electronic', 'Country', 'Latin', 'Reggae', 'Blues',
  'Folk', 'Indie', 'Metal', 'Punk', 'Soul', 'Funk', 'Alternative', 'K-Pop', 'Other',
];

const genreColors = {
  Pop: '#3b82f6', Rock: '#ef4444', 'Hip-Hop': '#f59e0b', 'R&B': '#a855f7',
  Jazz: '#06b6d4', Classical: '#6366f1', Electronic: '#22d3ee', Country: '#f97316',
  Latin: '#ec4899', Reggae: '#10b981', Blues: '#6366f1', Folk: '#84cc16',
  Indie: '#e879f9', Metal: '#dc2626', Punk: '#f472b6', Soul: '#8b5cf6',
  Funk: '#fbbf24', Alternative: '#14b8a6', 'K-Pop': '#f43f5e', Other: '#64748b',
};

function formatDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const emptySong = { title: '', artist: '', album: '', genre: 'Pop', duration: '', releaseYear: '' };

export default function AdminSongsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [newSong, setNewSong] = useState({ ...emptySong });
  const [openMenu, setOpenMenu] = useState(null);

  const { data, isLoading, error, refetch } = useSongs({
    page,
    limit: 15,
    search: search || undefined,
    genre: selectedGenre || undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const createSong = useCreateSong();
  const deleteSong = useDeleteSong();

  const songs = data?.songs || [];
  const pagination = data?.pagination;

  const handleSearch = useCallback((val) => { setSearch(val); setPage(1); }, []);

  const handleCreateSong = async (e) => {
    e.preventDefault();
    try {
      await createSong.mutateAsync({
        ...newSong,
        duration: parseInt(newSong.duration),
        releaseYear: parseInt(newSong.releaseYear),
      });
      setShowAddModal(false);
      setNewSong({ ...emptySong });
    } catch (err) {
      // error handled by hook
    }
  };

  const handleDeleteSong = async () => {
    if (!showDeleteModal) return;
    try {
      await deleteSong.mutateAsync(showDeleteModal._id);
      setShowDeleteModal(null);
    } catch (err) {
      // error handled by hook
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Song Management</h1>
          <p className="text-slate-400 mt-1">
            {pagination?.total?.toLocaleString() || '0'} songs in catalog
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-500 to-accent-500 hover:from-brand-600 hover:to-accent-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 hover:shadow-glow active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Add Song
        </button>
      </div>

      {/* Search + Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar
          value={search}
          onChange={handleSearch}
          placeholder="Search by title, artist, or album..."
          className="flex-1"
        />
        <div className="relative">
          <select
            value={selectedGenre}
            onChange={(e) => { setSelectedGenre(e.target.value); setPage(1); }}
            className="input appearance-none cursor-pointer pr-8 sm:w-44"
          >
            <option value="">All Genres</option>
            {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        </div>
      </div>

      {/* Active filters */}
      {(search || selectedGenre) && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500">Filters:</span>
          {search && (
            <button onClick={() => setSearch('')} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-500/15 text-brand-300 text-xs border border-brand-500/20 hover:bg-brand-500/25 transition-colors">
              Search: "{search}" <X className="w-3 h-3" />
            </button>
          )}
          {selectedGenre && (
            <button onClick={() => setSelectedGenre('')} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent-500/15 text-accent-300 text-xs border border-accent-500/20 hover:bg-accent-500/25 transition-colors">
              {selectedGenre} <X className="w-3 h-3" />
            </button>
          )}
          <button onClick={() => { setSearch(''); setSelectedGenre(''); }} className="text-xs text-slate-500 hover:text-white transition-colors">
            Clear all
          </button>
        </div>
      )}

      {/* Songs Table */}
      {error ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : isLoading ? (
        <SkeletonList count={10} />
      ) : songs.length === 0 ? (
        <EmptyState
          icon={Music2}
          title="No songs found"
          description={search || selectedGenre ? 'Try adjusting your filters.' : 'Add your first song to get started.'}
          action={
            <button onClick={() => setShowAddModal(true)} className="btn-primary">
              <Plus className="w-4 h-4" /> Add Song
            </button>
          }
        />
      ) : (
        <div className="rounded-2xl bg-surface-1 border border-white/5 overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_1fr_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-white/5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Song</span>
            <span className="hidden md:block">Album</span>
            <span className="hidden lg:block">Genre</span>
            <span className="hidden sm:block text-right">Duration</span>
            <span className="hidden sm:block text-right">Plays</span>
            <span className="text-right">Actions</span>
          </div>

          {/* Table Rows */}
          {songs.map((song, i) => (
            <div
              key={song._id}
              className="grid grid-cols-[1fr_1fr_auto_auto_auto_auto] gap-4 items-center px-5 py-3 border-b border-white/[0.03] hover:bg-surface-2/50 transition-colors group"
            >
              {/* Song info */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-surface-3 to-surface-4 flex items-center justify-center flex-shrink-0">
                  <Music2 className="w-4 h-4 text-slate-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{song.title}</p>
                  <p className="text-xs text-slate-400 truncate">{song.artist}</p>
                </div>
              </div>

              {/* Album */}
              <p className="text-sm text-slate-400 truncate hidden md:block">{song.album || 'Single'}</p>

              {/* Genre */}
              <span className="hidden lg:block">
                <span
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
                  style={{
                    backgroundColor: `${genreColors[song.genre] || '#64748b'}15`,
                    borderColor: `${genreColors[song.genre] || '#64748b'}30`,
                    color: genreColors[song.genre] || '#64748b',
                  }}
                >
                  {song.genre}
                </span>
              </span>

              {/* Duration */}
              <p className="text-sm text-slate-400 text-right font-mono hidden sm:block">
                {formatDuration(song.duration)}
              </p>

              {/* Plays */}
              <p className="text-sm text-slate-400 text-right hidden sm:block">
                {(song.playCount || 0).toLocaleString()}
              </p>

              {/* Actions */}
              <div className="flex items-center justify-end gap-1">
                <button
                  onClick={() => {
                    setShowDeleteModal(song);
                  }}
                  className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete song"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={pagination?.totalPages || 1} onPageChange={setPage} />

      {/* Add Song Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Song" size="lg">
        <form onSubmit={handleCreateSong} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Title *" id="admin-title">
              <input
                id="admin-title"
                className="input"
                required
                placeholder="e.g. Blinding Lights"
                value={newSong.title}
                onChange={(e) => setNewSong((s) => ({ ...s, title: e.target.value }))}
              />
            </FormField>
            <FormField label="Artist *" id="admin-artist">
              <input
                id="admin-artist"
                className="input"
                required
                placeholder="e.g. The Weeknd"
                value={newSong.artist}
                onChange={(e) => setNewSong((s) => ({ ...s, artist: e.target.value }))}
              />
            </FormField>
            <FormField label="Album" id="admin-album">
              <input
                id="admin-album"
                className="input"
                placeholder="e.g. After Hours (optional)"
                value={newSong.album}
                onChange={(e) => setNewSong((s) => ({ ...s, album: e.target.value }))}
              />
            </FormField>
            <FormField label="Genre *" id="admin-genre">
              <select
                id="admin-genre"
                className="input"
                value={newSong.genre}
                onChange={(e) => setNewSong((s) => ({ ...s, genre: e.target.value }))}
              >
                {GENRES.map((g) => <option key={g}>{g}</option>)}
              </select>
            </FormField>
            <FormField label="Duration (seconds) *" id="admin-duration">
              <input
                id="admin-duration"
                type="number"
                className="input"
                required
                min="1"
                placeholder="e.g. 200"
                value={newSong.duration}
                onChange={(e) => setNewSong((s) => ({ ...s, duration: e.target.value }))}
              />
            </FormField>
            <FormField label="Release Year *" id="admin-year">
              <input
                id="admin-year"
                type="number"
                className="input"
                required
                min="1900"
                max="2026"
                placeholder="e.g. 2020"
                value={newSong.releaseYear}
                onChange={(e) => setNewSong((s) => ({ ...s, releaseYear: e.target.value }))}
              />
            </FormField>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              type="submit"
              disabled={createSong.isPending}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-brand-500 to-accent-500 hover:from-brand-600 hover:to-accent-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 hover:shadow-glow active:scale-95 disabled:opacity-50"
            >
              {createSong.isPending ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...</>
              ) : (
                <><Plus className="w-4 h-4" /> Create Song</>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!showDeleteModal} onClose={() => setShowDeleteModal(null)} title="Delete Song" size="sm">
        {showDeleteModal && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-red-500/10 border border-red-500/20 p-4">
              <Trash2 className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-slate-300">
                Are you sure you want to delete <strong className="text-white">"{showDeleteModal.title}"</strong> by {showDeleteModal.artist}? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(null)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={handleDeleteSong}
                disabled={deleteSong.isPending}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50"
              >
                {deleteSong.isPending ? 'Deleting...' : 'Delete Song'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
