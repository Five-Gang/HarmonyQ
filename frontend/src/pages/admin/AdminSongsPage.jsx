import { useState, useCallback } from 'react';
import {
  Plus, Search, Trash2, Edit3, Music2, Clock, Disc3,
  ChevronDown, MoreHorizontal, X, Filter, Download, BookOpen
} from 'lucide-react';
import { useSongs, useCreateSong, useDeleteSong, useUpdateSong } from '../../hooks/useSongs';
import { SearchBar, Modal, FormField, Pagination, Badge } from '../../components/ui/index.jsx';
import { SkeletonList, EmptyState, ErrorState } from '../../components/ui/LoadingStates.jsx';
import { extractAudioMetadata } from '../../utils/audioMetadata.js';
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

const emptySong = { title: '', artist: '', album: '', genre: 'Pop', duration: '', releaseYear: '', audioFile: null, coverImage: null, lyrics: '' };

export default function AdminSongsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showEditModal, setShowEditModal] = useState(null);
  const [newSong, setNewSong] = useState({ ...emptySong });
  const [openMenu, setOpenMenu] = useState(null);
  const [isExtractingMetadata, setIsExtractingMetadata] = useState(false);

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
  const updateSong = useUpdateSong();

  const songs = data?.songs || [];
  const pagination = data?.pagination;

  const handleSearch = useCallback((val) => { setSearch(val); setPage(1); }, []);

  const handleAudioFileChange = async (e) => {
    const audioFile = e.target.files[0];
    if (!audioFile) return;

    setNewSong((s) => ({ ...s, audioFile }));
    
    // Extract metadata from the audio file
    setIsExtractingMetadata(true);
    try {
      const metadata = await extractAudioMetadata(audioFile);
      setNewSong((s) => ({
        ...s,
        // Only update if field is empty
        title: s.title || metadata.title,
        artist: s.artist || metadata.artist,
        album: s.album || metadata.album,
        duration: s.duration || (metadata.duration ? metadata.duration.toString() : ''),
        releaseYear: s.releaseYear || (metadata.releaseYear ? metadata.releaseYear.toString() : ''),
      }));
      
      if (metadata.title || metadata.artist) {
        toast.success('Metadata extracted from audio file');
      }
    } catch (err) {
      console.error('Error extracting metadata:', err);
      toast.error('Failed to extract metadata');
    } finally {
      setIsExtractingMetadata(false);
    }
  };

  const handleCreateSong = async (e) => {
    e.preventDefault();
    if (!newSong.audioFile) {
      toast.error('Please select an audio file to upload');
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('title', newSong.title);
      formData.append('artist', newSong.artist);
      formData.append('album', newSong.album);
      formData.append('genre', newSong.genre);
      formData.append('duration', parseInt(newSong.duration));
      formData.append('releaseYear', parseInt(newSong.releaseYear));
      if (newSong.lyrics) {
        formData.append('lyrics', newSong.lyrics);
      }
      
      formData.append('audioFile', newSong.audioFile);
      if (newSong.coverImage) {
        formData.append('coverImage', newSong.coverImage);
      }

      await createSong.mutateAsync(formData);
      setShowAddModal(false);
      setNewSong({ ...emptySong });
    } catch (err) {
      // error handled by hook
    }
  };

  const handleEditSong = async (e) => {
    e.preventDefault();
    if (!showEditModal._id) return;

    try {
      const updateData = {
        title: showEditModal.title,
        artist: showEditModal.artist,
        album: showEditModal.album,
        genre: showEditModal.genre,
        lyrics: showEditModal.lyrics || '',
      };
      
      await updateSong.mutateAsync({ songId: showEditModal._id, data: updateData });
      setShowEditModal(null);
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
                    setShowEditModal({ ...song });
                  }}
                  className="p-2 rounded-lg text-slate-500 hover:text-accent-400 hover:bg-accent-500/10 transition-colors opacity-0 group-hover:opacity-100"
                  title="Edit song"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
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
          {/* Info message about automatic metadata extraction */}
          <div className="bg-brand-500/10 border border-brand-500/30 rounded-lg p-3 text-sm text-brand-300">
            💡 Metadata (title, artist, album, duration, year) is automatically extracted from the audio file. Edit any field as needed.
          </div>

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
            <FormField label="Audio File (.mp3/.wav) *" id="admin-audio">
              <div className="flex flex-col gap-2">
                <div className="relative">
                  <input
                    id="admin-audio"
                    type="file"
                    accept="audio/*"
                    className="input !p-2 cursor-pointer text-sm"
                    required
                    onChange={handleAudioFileChange}
                    disabled={isExtractingMetadata}
                  />
                  {isExtractingMetadata && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-brand-400 animate-pulse">
                      Extracting metadata...
                    </span>
                  )}
                </div>
                {newSong.audioFile && <span className="text-xs text-brand-400">Selected: {newSong.audioFile.name}</span>}
              </div>
            </FormField>
            <FormField label="Cover Image" id="admin-cover">
              <div className="flex flex-col gap-2">
                <input
                  id="admin-cover"
                  type="file"
                  accept="image/*"
                  className="input !p-2 cursor-pointer text-sm"
                  onChange={(e) => setNewSong((s) => ({ ...s, coverImage: e.target.files[0] }))}
                />
                {newSong.coverImage && <span className="text-xs text-brand-400">Selected: {newSong.coverImage.name}</span>}
              </div>
            </FormField>
          </div>

          {/* Lyrics */}
          <FormField label="Lyrics" id="admin-lyrics">
            <textarea
              id="admin-lyrics"
              className="input min-h-48 resize-none"
              placeholder="Paste song lyrics here (optional)..."
              value={newSong.lyrics}
              onChange={(e) => setNewSong((s) => ({ ...s, lyrics: e.target.value }))}
            />
          </FormField>

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
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading...</>
              ) : (
                <><Download className="w-4 h-4" /> Upload Song</>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Song Modal */}
      <Modal isOpen={!!showEditModal} onClose={() => setShowEditModal(null)} title="Edit Song" size="lg">
        {showEditModal && (
          <form onSubmit={handleEditSong} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Title" id="edit-title">
                <input
                  id="edit-title"
                  className="input"
                  value={showEditModal.title}
                  onChange={(e) => setShowEditModal((s) => ({ ...s, title: e.target.value }))}
                />
              </FormField>
              <FormField label="Artist" id="edit-artist">
                <input
                  id="edit-artist"
                  className="input"
                  value={showEditModal.artist}
                  onChange={(e) => setShowEditModal((s) => ({ ...s, artist: e.target.value }))}
                />
              </FormField>
              <FormField label="Album" id="edit-album">
                <input
                  id="edit-album"
                  className="input"
                  value={showEditModal.album}
                  onChange={(e) => setShowEditModal((s) => ({ ...s, album: e.target.value }))}
                />
              </FormField>
              <FormField label="Genre" id="edit-genre">
                <select
                  id="edit-genre"
                  className="input"
                  value={showEditModal.genre}
                  onChange={(e) => setShowEditModal((s) => ({ ...s, genre: e.target.value }))}
                >
                  {GENRES.map((g) => <option key={g}>{g}</option>)}
                </select>
              </FormField>
            </div>

            <FormField label="Lyrics" id="edit-lyrics">
              <textarea
                id="edit-lyrics"
                className="input min-h-48 resize-none"
                placeholder="Paste or edit song lyrics here..."
                value={showEditModal.lyrics || ''}
                onChange={(e) => setShowEditModal((s) => ({ ...s, lyrics: e.target.value }))}
              />
            </FormField>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowEditModal(null)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateSong.isPending}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-accent-500 to-brand-500 hover:from-accent-600 hover:to-brand-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 hover:shadow-glow active:scale-95 disabled:opacity-50"
              >
                <BookOpen className="w-4 h-4" />
                {updateSong.isPending ? 'Updating...' : 'Update Song'}
              </button>
            </div>
          </form>
        )}
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
