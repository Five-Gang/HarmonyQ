import { useState, useCallback } from 'react';
import { Music, Filter, Grid, List, SlidersHorizontal, X } from 'lucide-react';
import { useSongs } from '../hooks/useSongs';
import { useUserPlaylists } from '../hooks/usePlaylists';
import { useAddSongsToPlaylist } from '../hooks/usePlaylists';
import { useUser } from '@clerk/clerk-react';
import { SongCard, SongRow } from '../components/songs/SongCard.jsx';
import { SearchBar, Select, Modal, Pagination, FormField, Badge } from '../components/ui/index.jsx';
import { SkeletonCard, SkeletonList, EmptyState, ErrorState } from '../components/ui/LoadingStates.jsx';

const GENRES = [
  'Pop', 'Rock', 'Hip-Hop', 'R&B', 'Jazz', 'Classical',
  'Electronic', 'Country', 'Latin', 'Reggae', 'Blues',
  'Folk', 'Indie', 'Metal', 'Punk', 'Soul', 'Funk', 'Alternative', 'K-Pop', 'Other',
];

const SORT_OPTIONS = [
  { value: 'createdAt_desc', label: 'Newest First' },
  { value: 'createdAt_asc', label: 'Oldest First' },
  { value: 'playCount_desc', label: 'Most Played' },
  { value: 'releaseYear_desc', label: 'Latest Release' },
  { value: 'title_asc', label: 'Title A-Z' },
  { value: 'artist_asc', label: 'Artist A-Z' },
];

export default function SongsPage() {
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.roles?.includes('admin');

  const [view, setView] = useState('grid');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [sort, setSort] = useState('createdAt_desc');
  const [showFilters, setShowFilters] = useState(false);
  const [addToPlaylistSong, setAddToPlaylistSong] = useState(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState('');

  const [sortBy, sortOrder] = sort.split('_');

  const { data, isLoading, error, refetch } = useSongs({
    page,
    limit: 12,
    search: search || undefined,
    genre: selectedGenre || undefined,
    sortBy,
    sortOrder,
  });

  const { data: playlistsData } = useUserPlaylists(user?.id);
  const addSongs = useAddSongsToPlaylist();

  const songs = data?.songs || [];
  const pagination = data?.pagination;

  const handleAddToPlaylist = (song) => setAddToPlaylistSong(song);

  const handleConfirmAddToPlaylist = async () => {
    if (!selectedPlaylist || !addToPlaylistSong) return;
    await addSongs.mutateAsync({ id: selectedPlaylist, songIds: [addToPlaylistSong._id] });
    setAddToPlaylistSong(null);
    setSelectedPlaylist('');
  };



  const handleSearch = useCallback((val) => { setSearch(val); setPage(1); }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Song Browser</h1>
          <p className="text-muted mt-1">{pagination?.total?.toLocaleString() || '—'} songs available</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView(v => v === 'grid' ? 'list' : 'grid')}
            className="btn-ghost"
          >
            {view === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar value={search} onChange={handleSearch} placeholder="Search songs, artists, albums..." className="flex-1" />
        <Select
          value={sort}
          onChange={setSort}
          options={SORT_OPTIONS}
          className="sm:w-48"
        />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-ghost gap-2 ${showFilters ? 'bg-brand-500/15 text-brand-400' : ''}`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {selectedGenre && <Badge variant="brand">{selectedGenre}</Badge>}
        </button>
      </div>

      {/* Genre Filters */}
      {showFilters && (
        <div className="card p-4 animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-white">Filter by Genre</p>
            {selectedGenre && (
              <button onClick={() => setSelectedGenre('')} className="btn-ghost text-xs gap-1">
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((g) => (
              <button
                key={g}
                onClick={() => { setSelectedGenre(selectedGenre === g ? '' : g); setPage(1); }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  selectedGenre === g
                    ? 'bg-brand-500 border-brand-500 text-white'
                    : 'bg-surface-2 border-white/5 text-slate-400 hover:border-brand-500/50 hover:text-brand-400'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {error ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : isLoading ? (
        view === 'grid' ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : <SkeletonList />
      ) : songs.length === 0 ? (
        <EmptyState
          icon={Music}
          title="No songs found"
          description={search ? `No results for "${search}"` : 'No songs match your filters.'}
          action={<button onClick={() => { setSearch(''); setSelectedGenre(''); }} className="btn-secondary">Clear filters</button>}
        />
      ) : view === 'grid' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {songs.map((song) => (
            <SongCard key={song._id} song={song} onAddToPlaylist={handleAddToPlaylist} />
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          {songs.map((song, i) => (
            <SongRow key={song._id} song={song} index={i} onAddToPlaylist={handleAddToPlaylist} />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={pagination?.totalPages || 1} onPageChange={setPage} />

      {/* Add to Playlist Modal */}
      <Modal isOpen={!!addToPlaylistSong} onClose={() => setAddToPlaylistSong(null)} title="Add to Playlist" size="sm">
        {addToPlaylistSong && (
          <div className="space-y-4">
            <div className="card p-3 flex items-center gap-3">
              <Music className="w-8 h-8 text-brand-400" />
              <div>
                <p className="text-sm font-medium text-white">{addToPlaylistSong.title}</p>
                <p className="text-xs text-slate-400">{addToPlaylistSong.artist}</p>
              </div>
            </div>
            <select
              value={selectedPlaylist}
              onChange={(e) => setSelectedPlaylist(e.target.value)}
              className="input"
            >
              <option value="">Select a playlist...</option>
              {playlistsData?.playlists?.map((pl) => (
                <option key={pl._id} value={pl._id}>{pl.name}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button onClick={() => setAddToPlaylistSong(null)} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={handleConfirmAddToPlaylist}
                disabled={!selectedPlaylist || addSongs.isPending}
                className="btn-primary flex-1"
              >
                {addSongs.isPending ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
