import { useState, useCallback, useMemo } from 'react';
import {
  ListMusic, Search, Filter, X, Eye, EyeOff,
  Music2, Users, CheckCircle, AlertCircle, MoreVertical, Lock, Unlock, 
  User, Copy, ExternalLink, Clock, Calendar, History, Trash2
} from 'lucide-react';
import { useAdminPlaylists, useSetPlaylistStatus, useDeletePlaylistAdmin } from '../../hooks/usePlaylists';
import { SearchBar, Pagination, Badge, Modal } from '../../components/ui/index.jsx';
import { SkeletonList, EmptyState, ErrorState } from '../../components/ui/LoadingStates.jsx';
import toast from 'react-hot-toast';

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Recently Created' },
  { value: 'updatedAt', label: 'Recently Updated' },
  { value: 'followerCount', label: 'Most Followers' },
  { value: 'name', label: 'Alphabetical' },
];

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getTimeAgo(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function AdminPlaylistsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterPublic, setFilterPublic] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [openMenu, setOpenMenu] = useState(null);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [selectedPlaylists, setSelectedPlaylists] = useState(new Set());
  const [bulkAction, setBulkAction] = useState(null);
  const [auditPlaylist, setAuditPlaylist] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { data, isLoading, error, refetch } = useAdminPlaylists({
    page,
    limit: 15,
    search: search || undefined,
    isPublic: filterPublic ? filterPublic === 'public' : undefined,
    isActive: filterActive ? filterActive === 'active' : undefined,
    sortBy,
    sortOrder,
  });

  const setPlaylistStatus = useSetPlaylistStatus();
  const deletePlaylistAdmin = useDeletePlaylistAdmin();

  const playlists = data?.playlists || [];
  const pagination = data?.pagination;

  // Calculate owner statistics from all playlists
  const ownerStats = useMemo(() => {
    const stats = {};
    playlists.forEach((playlist) => {
      if (!stats[playlist.clerkUserId]) {
        stats[playlist.clerkUserId] = {
          totalPlaylists: 0,
          totalSongs: 0,
          totalFollowers: 0,
          publicCount: 0,
          inactiveCount: 0,
        };
      }
      stats[playlist.clerkUserId].totalPlaylists += 1;
      stats[playlist.clerkUserId].totalSongs += playlist.songIds?.length || 0;
      stats[playlist.clerkUserId].totalFollowers += playlist.followerCount || 0;
      if (playlist.isPublic) stats[playlist.clerkUserId].publicCount += 1;
      if (!playlist.isActive) stats[playlist.clerkUserId].inactiveCount += 1;
    });
    return stats;
  }, [playlists]);

  const handleSearch = useCallback((val) => {
    setSearch(val);
    setPage(1);
  }, []);

  const handleToggleActive = async (playlist) => {
    try {
      await setPlaylistStatus.mutateAsync({
        id: playlist._id,
        data: { isActive: !playlist.isActive }
      });
      setOpenMenu(null);
    } catch (err) {
      // error handled by hook
    }
  };

  const handleTogglePublic = async (playlist) => {
    try {
      await setPlaylistStatus.mutateAsync({
        id: playlist._id,
        data: { isPublic: !playlist.isPublic }
      });
      setOpenMenu(null);
    } catch (err) {
      // error handled by hook
    }
  };

  const handleDeletePlaylist = async (playlist) => {
    try {
      await deletePlaylistAdmin.mutateAsync(playlist._id);
      setDeleteConfirm(null);
      setOpenMenu(null);
    } catch (err) {
      // error handled by hook
    }
  };

  const handleSelectPlaylist = (playlistId) => {
    const newSelected = new Set(selectedPlaylists);
    if (newSelected.has(playlistId)) {
      newSelected.delete(playlistId);
    } else {
      newSelected.add(playlistId);
    }
    setSelectedPlaylists(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedPlaylists.size === playlists.length) {
      setSelectedPlaylists(new Set());
    } else {
      setSelectedPlaylists(new Set(playlists.map(p => p._id)));
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedPlaylists.size === 0) {
      toast.error('No playlists selected');
      return;
    }

    const playlistsToUpdate = playlists.filter(p => selectedPlaylists.has(p._id));
    let updateData = {};

    switch (action) {
      case 'activate':
        updateData = { isActive: true };
        break;
      case 'deactivate':
        updateData = { isActive: false };
        break;
      case 'makePublic':
        updateData = { isPublic: true };
        break;
      case 'makePrivate':
        updateData = { isPublic: false };
        break;
      default:
        return;
    }

    try {
      setBulkAction('loading');
      await Promise.all(
        playlistsToUpdate.map(p => setPlaylistStatus.mutateAsync({ id: p._id, data: updateData }))
      );
      setSelectedPlaylists(new Set());
      setBulkAction(null);
      toast.success(`${playlistsToUpdate.length} playlist(s) updated`);
    } catch (err) {
      setBulkAction(null);
      // error handled by hook
    }
  };

  const hasActiveFilters = search || filterPublic || filterActive || sortBy !== 'createdAt';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Playlist Management</h1>
          <p className="text-slate-400 mt-1">
            {pagination?.total?.toLocaleString() || '0'} playlists • View and moderate user playlists
          </p>
        </div>
      </div>

      {/* Analytics Summary Cards */}
      {!isLoading && playlists.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-brand-500/10 to-brand-500/5 border border-brand-500/20 rounded-xl p-4 hover:border-brand-500/40 transition-colors">
            <p className="text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wider">Total Playlists</p>
            <p className="text-3xl font-bold text-brand-400">{pagination?.total.toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-accent-500/10 to-accent-500/5 border border-accent-500/20 rounded-xl p-4 hover:border-accent-500/40 transition-colors">
            <p className="text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wider">Public</p>
            <p className="text-3xl font-bold text-accent-400">
              {playlists.filter(p => p.isPublic).length}
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-xl p-4 hover:border-purple-500/40 transition-colors">
            <p className="text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wider">Total Songs</p>
            <p className="text-3xl font-bold text-purple-400">
              {playlists.reduce((sum, p) => sum + (p.songIds?.length || 0), 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20 rounded-xl p-4 hover:border-cyan-500/40 transition-colors">
            <p className="text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wider">Avg Followers</p>
            <p className="text-3xl font-bold text-cyan-400">
              {Math.round(playlists.reduce((sum, p) => sum + (p.followerCount || 0), 0) / playlists.length).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Search + Filter bar */}
      <div className="flex flex-col gap-3">
        {/* Search */}
        <SearchBar
          value={search}
          onChange={handleSearch}
          placeholder="Search by playlist name or owner..."
          className="flex-1"
        />

        {/* Filters - Single Row */}
        <div className="flex gap-2 items-center">
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider px-2 py-1.5 whitespace-nowrap">Filters:</span>
          
          {/* Public/Private Filter */}
          <select
            value={filterPublic}
            onChange={(e) => {
              setFilterPublic(e.target.value);
              setPage(1);
            }}
            className="input text-sm px-2.5 py-1.5 bg-surface-1 border border-white/10 rounded-lg hover:border-white/20 transition-colors flex-1 min-w-0"
          >
            <option value="">All (Public & Private)</option>
            <option value="public">Public Only</option>
            <option value="private">Private Only</option>
          </select>

          {/* Active/Inactive Filter */}
          <select
            value={filterActive}
            onChange={(e) => {
              setFilterActive(e.target.value);
              setPage(1);
            }}
            className="input text-sm px-2.5 py-1.5 bg-surface-1 border border-white/10 rounded-lg hover:border-white/20 transition-colors flex-1 min-w-0"
          >
            <option value="">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="input text-sm px-2.5 py-1.5 bg-surface-1 border border-white/10 rounded-lg hover:border-white/20 transition-colors flex-1 min-w-0"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Sort Order */}
          <select
            value={sortOrder}
            onChange={(e) => {
              setSortOrder(e.target.value);
              setPage(1);
            }}
            className="input text-sm px-2.5 py-1.5 bg-surface-1 border border-white/10 rounded-lg hover:border-white/20 transition-colors flex-1 min-w-0"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Active filters */}
      {hasActiveFilters && (
        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Filters:</span>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs border border-brand-500/30 hover:bg-brand-500/30 transition-colors"
              >
                🔍 "{search}" <X className="w-3 h-3" />
              </button>
            )}
            {filterPublic && (
              <button
                onClick={() => setFilterPublic('')}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-500/20 text-accent-300 text-xs border border-accent-500/30 hover:bg-accent-500/30 transition-colors"
              >
                {filterPublic === 'public' ? '👁️ Public' : '🔒 Private'} <X className="w-3 h-3" />
              </button>
            )}
            {filterActive && (
              <button
                onClick={() => setFilterActive('')}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs border border-purple-500/30 hover:bg-purple-500/30 transition-colors"
              >
                {filterActive === 'active' ? '✓ Active' : '⊘ Inactive'} <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <button
            onClick={() => {
              setSearch('');
              setFilterPublic('');
              setFilterActive('');
              setSortBy('createdAt');
              setSortOrder('desc');
              setPage(1);
            }}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors font-semibold"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Bulk Actions Toolbar */}
      {selectedPlaylists.size > 0 && (
        <div className="bg-gradient-to-r from-accent-500/15 to-accent-500/10 border border-accent-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent-500/30 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-accent-300" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                {selectedPlaylists.size} playlist{selectedPlaylists.size !== 1 ? 's' : ''} selected
              </p>
              <p className="text-xs text-slate-400">Apply bulk actions below</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleBulkAction('activate')}
              disabled={bulkAction === 'loading'}
              className="px-3 py-1.5 bg-green-500/20 text-green-300 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:border-green-500/50"
            >
              ✓ Activate
            </button>
            <button
              onClick={() => handleBulkAction('deactivate')}
              disabled={bulkAction === 'loading'}
              className="px-3 py-1.5 bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:border-red-500/50"
            >
              ⊘ Deactivate
            </button>
            <button
              onClick={() => handleBulkAction('makePublic')}
              disabled={bulkAction === 'loading'}
              className="px-3 py-1.5 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:border-blue-500/50"
            >
              👁️ Make Public
            </button>
            <button
              onClick={() => handleBulkAction('makePrivate')}
              disabled={bulkAction === 'loading'}
              className="px-3 py-1.5 bg-slate-500/20 text-slate-300 hover:bg-slate-500/30 border border-slate-500/30 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:border-slate-500/50"
            >
              🔒 Make Private
            </button>
            <button
              onClick={() => {
                setSelectedPlaylists(new Set());
                setBulkAction(null);
              }}
              disabled={bulkAction === 'loading'}
              className="px-3 py-1.5 bg-surface-2 text-slate-400 hover:text-slate-200 hover:bg-surface-3 border border-white/10 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ✕ Clear
            </button>
          </div>
        </div>
      )}

      {/* Playlists Content */}
      {error ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : isLoading ? (
        <SkeletonList count={10} />
      ) : playlists.length === 0 ? (
        <EmptyState
          icon={ListMusic}
          title="No playlists found"
          description={hasActiveFilters ? 'Try adjusting your filters.' : 'No playlists in the system yet.'}
        />
      ) : (
        <div className="space-y-3">
          {/* Table Header - Desktop */}
          <div className="hidden md:grid md:grid-cols-[40px_1.5fr_1.3fr_0.8fr_0.8fr_0.8fr_100px] gap-0 px-0 py-0 bg-gradient-to-r from-surface-2 to-surface-1 rounded-t-xl text-xs font-bold text-slate-300 uppercase tracking-widest overflow-hidden">
            <div className="px-4 py-4 flex items-center justify-center border-r border-white/[0.08]">
              <input
                type="checkbox"
                checked={selectedPlaylists.size === playlists.length && playlists.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded cursor-pointer accent-accent-500 hover:accent-accent-400 transition-all"
                title="Select all playlists on this page"
              />
            </div>
            <div className="px-4 py-4">Playlist</div>
            <div className="px-4 py-4">Owner</div>
            <div className="px-4 py-4 text-center">Status</div>
            <div className="px-4 py-4 text-center">Songs</div>
            <div className="px-4 py-4 text-center">Followers</div>
            <div className="px-4 py-4 text-center">Actions</div>
          </div>

          {/* Playlist Rows */}
          <div className="rounded-xl bg-surface-1 border border-white/5 overflow-hidden shadow-xl">
            {playlists.map((playlist, idx) => (
              <div
                key={playlist._id}
                className={`hidden md:grid md:grid-cols-[40px_1.5fr_1.3fr_0.8fr_0.8fr_0.8fr_100px] gap-0 items-center ${
                  idx !== playlists.length - 1 ? '' : ''
                } hover:bg-accent-500/5 transition-colors duration-150 group ${
                  selectedPlaylists.has(playlist._id) ? 'bg-accent-500/10' : ''
                }`}
              >
                {/* Checkbox */}
                <div className="px-4 py-4 flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={selectedPlaylists.has(playlist._id)}
                    onChange={() => handleSelectPlaylist(playlist._id)}
                    className="w-4 h-4 rounded cursor-pointer accent-accent-500 hover:accent-accent-400 transition-all"
                    title="Select this playlist"
                  />
                </div>

                {/* Playlist Info */}
                <div className="px-4 py-4 flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-500/20 to-accent-500/20 flex items-center justify-center flex-shrink-0">
                    <ListMusic className="w-4 h-4 text-accent-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">{playlist.name}</p>
                    <p className="text-xs text-slate-500 truncate">{playlist.description || '—'}</p>
                  </div>
                </div>

                {/* Owner */}
                <div className="px-4 py-4 min-w-0">
                  <button
                    onClick={() => setSelectedOwner(playlist.clerkUserId)}
                    className="text-xs text-accent-400 hover:text-accent-300 truncate font-mono hover:underline transition-colors w-full text-left"
                    title={playlist.clerkUserId}
                  >
                    {playlist.clerkUserId.substring(0, 24)}...
                  </button>
                </div>

                {/* Status */}
                <div className="px-4 py-4">
                  <div className="flex flex-col gap-2">
                    {!playlist.isActive && (
                      <Badge
                        icon={AlertCircle}
                        label="Inactive"
                        color="red"
                        size="sm"
                      />
                    )}
                    <Badge
                      icon={playlist.isPublic ? Eye : EyeOff}
                      label={playlist.isPublic ? 'Public' : 'Private'}
                      color={playlist.isPublic ? 'blue' : 'slate'}
                      size="sm"
                    />
                  </div>
                </div>

                {/* Songs Count */}
                <div className="px-4 py-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-slate-300">
                    <Music2 className="w-4 h-4 text-accent-400" />
                    <span className="text-sm font-semibold">{playlist.songIds?.length || 0}</span>
                  </div>
                </div>

                {/* Followers Count */}
                <div className="px-4 py-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-slate-300">
                    <Users className="w-4 h-4 text-brand-400" />
                    <span className="text-sm font-semibold">{(playlist.followerCount || 0).toLocaleString()}</span>
                  </div>
                </div>

                {/* Actions Menu */}
                <div className="px-4 py-4 flex items-center justify-center">
                  <button
                    onClick={() => setOpenMenu(openMenu === playlist._id ? null : playlist._id)}
                    className="p-2 rounded-lg text-slate-500 hover:text-accent-400 hover:bg-accent-500/10 transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {/* Dropdown Menu */}
                  {openMenu === playlist._id && (
                    <div className="absolute right-0 top-full mt-1 bg-surface-2 border border-white/10 rounded-lg shadow-lg z-10 min-w-48">
                      <button
                        onClick={() => {
                          setAuditPlaylist(playlist);
                          setOpenMenu(null);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-surface-3 hover:text-white transition-colors border-b border-white/5 flex items-center gap-2"
                      >
                        <History className="w-4 h-4" />
                        Audit Info
                      </button>

                      <button
                        onClick={() => handleTogglePublic(playlist)}
                        disabled={setPlaylistStatus.isPending}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-surface-3 hover:text-white transition-colors border-b border-white/5 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {playlist.isPublic ? (
                          <>
                            <Lock className="w-4 h-4" />
                            Make Private
                          </>
                        ) : (
                          <>
                            <Unlock className="w-4 h-4" />
                            Make Public
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleToggleActive(playlist)}
                        disabled={setPlaylistStatus.isPending}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-surface-3 hover:text-white transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {playlist.isActive ? (
                          <>
                            <AlertCircle className="w-4 h-4" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Activate
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setDeleteConfirm(playlist)}
                        disabled={deletePlaylistAdmin.isPending}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-colors border-t border-white/5 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                        Permanently Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* Mobile Summary */}
                <div className="md:hidden flex flex-wrap gap-2 col-span-1 items-start">
                  <input
                    type="checkbox"
                    checked={selectedPlaylists.has(playlist._id)}
                    onChange={() => handleSelectPlaylist(playlist._id)}
                    className="w-4 h-4 rounded cursor-pointer mt-0.5"
                  />
                  <div className="flex flex-wrap gap-2 flex-1">
                    <Badge
                      icon={playlist.isPublic ? Eye : EyeOff}
                      label={playlist.isPublic ? 'Public' : 'Private'}
                      color={playlist.isPublic ? 'blue' : 'slate'}
                      size="sm"
                    />
                    {!playlist.isActive && (
                      <Badge icon={AlertCircle} label="Inactive" color="red" size="sm" />
                    )}
                    <span className="text-xs text-slate-400">
                      {(playlist.songIds?.length || 0)} songs • {(playlist.followerCount || 0)} followers
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile View - Card Layout */}
          <div className="md:hidden space-y-3">
            {playlists.map((playlist) => (
              <div
                key={playlist._id}
                className={`bg-surface-1 border border-white/5 rounded-xl p-4 space-y-3 hover:bg-surface-2 transition-colors ${
                  selectedPlaylists.has(playlist._id) ? 'border-accent-500/50 bg-accent-500/5' : ''
                }`}
              >
                {/* Header with Checkbox */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedPlaylists.has(playlist._id)}
                    onChange={() => handleSelectPlaylist(playlist._id)}
                    className="w-4 h-4 rounded cursor-pointer accent-accent-500 mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{playlist.name}</p>
                    <p className="text-xs text-slate-500 truncate">{playlist.description || '—'}</p>
                  </div>
                  <button
                    onClick={() => setOpenMenu(openMenu === playlist._id ? null : playlist._id)}
                    className="p-2 rounded-lg text-slate-500 hover:text-accent-400 hover:bg-accent-500/10 transition-colors flex-shrink-0"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-surface-2 rounded-lg p-2.5 border border-white/5">
                    <p className="text-slate-400 mb-1">Songs</p>
                    <p className="text-lg font-bold text-white flex items-center gap-1">
                      <Music2 className="w-3 h-3 text-accent-400" />
                      {playlist.songIds?.length || 0}
                    </p>
                  </div>
                  <div className="bg-surface-2 rounded-lg p-2.5 border border-white/5">
                    <p className="text-slate-400 mb-1">Followers</p>
                    <p className="text-lg font-bold text-white flex items-center gap-1">
                      <Users className="w-3 h-3 text-brand-400" />
                      {(playlist.followerCount || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap gap-2">
                  {!playlist.isActive && (
                    <Badge icon={AlertCircle} label="Inactive" color="red" size="sm" />
                  )}
                  <Badge
                    icon={playlist.isPublic ? Eye : EyeOff}
                    label={playlist.isPublic ? 'Public' : 'Private'}
                    color={playlist.isPublic ? 'blue' : 'slate'}
                    size="sm"
                  />
                </div>

                {/* Menu Options */}
                {openMenu === playlist._id && (
                  <div className="border-t border-white/5 pt-3 flex flex-col gap-2">
                    <button
                      onClick={() => {
                        setAuditPlaylist(playlist);
                        setOpenMenu(null);
                      }}
                      className="text-left px-3 py-2 bg-surface-2 text-slate-300 hover:text-white rounded-lg transition-colors text-xs font-semibold flex items-center gap-2"
                    >
                      <History className="w-3 h-3" />
                      Audit Info
                    </button>
                    <button
                      onClick={() => handleTogglePublic(playlist)}
                      disabled={setPlaylistStatus.isPending}
                      className="text-left px-3 py-2 bg-surface-2 text-slate-300 hover:text-white rounded-lg transition-colors text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
                    >
                      {playlist.isPublic ? (
                        <>
                          <Lock className="w-3 h-3" />
                          Make Private
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3 h-3" />
                          Make Public
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleToggleActive(playlist)}
                      disabled={setPlaylistStatus.isPending}
                      className="text-left px-3 py-2 bg-surface-2 text-slate-300 hover:text-white rounded-lg transition-colors text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
                    >
                      {playlist.isActive ? (
                        <>
                          <AlertCircle className="w-3 h-3" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          Activate
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(playlist)}
                      disabled={deletePlaylistAdmin.isPending}
                      className="text-left px-3 py-2 bg-red-500/10 text-red-300 hover:bg-red-500/20 rounded-lg transition-colors text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && !error && playlists.length > 0 && pagination && (
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-1 border border-white/5 rounded-lg px-5 py-4">
          <p className="text-sm text-slate-400 order-2 sm:order-1">
            Showing <span className="font-semibold text-white">{((page - 1) * pagination.limit + 1).toLocaleString()}</span> to{' '}
            <span className="font-semibold text-white">{Math.min(page * pagination.limit, pagination.total).toLocaleString()}</span> of{' '}
            <span className="font-semibold text-white">{pagination.total.toLocaleString()}</span> playlists
          </p>

          <div className="flex items-center gap-2 order-1 sm:order-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-2 text-slate-300 hover:text-white hover:bg-surface-3 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-sm"
            >
              ← Previous
            </button>

            <div className="flex items-center gap-1 px-3 py-2 text-sm">
              <span className="text-slate-400">Page</span>
              <span className="font-semibold text-white bg-surface-2 px-2.5 py-1 rounded">{page}</span>
              <span className="text-slate-400">of</span>
              <span className="font-semibold text-white bg-surface-2 px-2.5 py-1 rounded">{pagination.totalPages}</span>
            </div>

            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= pagination.totalPages || playlists.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-500/20 text-accent-300 hover:text-accent-200 hover:bg-accent-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-slate-500 font-semibold text-sm"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* No Results Message */}
      {!isLoading && !error && playlists.length === 0 && pagination && pagination.total === 0 && page > 1 && (
        <div className="text-center py-8 bg-surface-1 border border-white/5 rounded-lg">
          <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-300 font-semibold mb-2">No more playlists</p>
          <p className="text-slate-500 text-sm mb-4">You've reached the end of the list</p>
          <button
            onClick={() => setPage(1)}
            className="px-4 py-2 bg-accent-500/20 text-accent-300 hover:bg-accent-500/30 rounded-lg text-sm font-semibold transition-colors"
          >
            Go to First Page
          </button>
        </div>
      )}

      {/* Audit Info Modal */}
      {auditPlaylist && (
        <Modal
          isOpen={!!auditPlaylist}
          onClose={() => setAuditPlaylist(null)}
          title="Playlist Audit Information"
          size="lg"
        >
          <div className="space-y-6">
            {/* Playlist Name */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Playlist Name</label>
              <p className="text-lg font-semibold text-white">{auditPlaylist.name}</p>
            </div>

            {/* Playlist ID */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Playlist ID</label>
              <div className="flex items-center gap-2 bg-surface-2 rounded-lg p-3">
                <p className="text-sm font-mono text-slate-300 break-all flex-1">{auditPlaylist._id}</p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(auditPlaylist._id);
                    toast.success('Copied to clipboard');
                  }}
                  className="p-2 hover:bg-surface-3 rounded transition-colors"
                  title="Copy ID"
                >
                  <Copy className="w-4 h-4 text-slate-400 hover:text-white transition-colors" />
                </button>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Timeline</label>
              <div className="space-y-3">
                {/* Created */}
                <div className="bg-surface-2 rounded-lg p-4 flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-3 h-3 rounded-full bg-green-500 mt-2" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">Created</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(auditPlaylist.createdAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {getTimeAgo(auditPlaylist.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">
                      {Math.floor((new Date() - new Date(auditPlaylist.createdAt)) / (1000 * 60 * 60 * 24))} days old
                    </p>
                  </div>
                </div>

                {/* Last Updated */}
                <div className="bg-surface-2 rounded-lg p-4 flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mt-2" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">Last Updated</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(auditPlaylist.updatedAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {getTimeAgo(auditPlaylist.updatedAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">
                      {Math.floor((new Date() - new Date(auditPlaylist.updatedAt)) / (1000 * 60))} minutes ago
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Owner Info */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Owner</label>
              <div className="flex items-center gap-2 bg-surface-2 rounded-lg p-3">
                <User className="w-4 h-4 text-slate-400" />
                <p className="text-sm font-mono text-slate-300 break-all flex-1">{auditPlaylist.clerkUserId}</p>
              </div>
            </div>

            {/* Status Information */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-2 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">Status</p>
                <Badge
                  icon={auditPlaylist.isActive ? CheckCircle : AlertCircle}
                  label={auditPlaylist.isActive ? 'Active' : 'Inactive'}
                  color={auditPlaylist.isActive ? 'green' : 'red'}
                  size="sm"
                />
              </div>
              <div className="bg-surface-2 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">Visibility</p>
                <Badge
                  icon={auditPlaylist.isPublic ? Eye : EyeOff}
                  label={auditPlaylist.isPublic ? 'Public' : 'Private'}
                  color={auditPlaylist.isPublic ? 'blue' : 'slate'}
                  size="sm"
                />
              </div>
            </div>

            {/* Content Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-2 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">Total Songs</p>
                <p className="text-2xl font-bold text-white">{auditPlaylist.songIds?.length || 0}</p>
              </div>
              <div className="bg-surface-2 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">Followers</p>
                <p className="text-2xl font-bold text-white">{(auditPlaylist.followerCount || 0).toLocaleString()}</p>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setAuditPlaylist(null)}
              className="w-full px-4 py-2 bg-accent-500/20 text-accent-300 rounded-lg hover:bg-accent-500/30 transition-colors text-sm font-semibold mt-4"
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* Owner Info Modal */}
      {selectedOwner && ownerStats[selectedOwner] && (
        <Modal
          isOpen={!!selectedOwner}
          onClose={() => setSelectedOwner(null)}
          title="Owner Information"
        >
          <div className="space-y-6">
            {/* Owner ID */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">User ID</label>
              <div className="flex items-center gap-2 bg-surface-2 rounded-lg p-3">
                <p className="text-sm font-mono text-slate-300 break-all flex-1">{selectedOwner}</p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedOwner);
                    toast.success('Copied to clipboard');
                  }}
                  className="p-2 hover:bg-surface-3 rounded transition-colors"
                  title="Copy ID"
                >
                  <Copy className="w-4 h-4 text-slate-400 hover:text-white transition-colors" />
                </button>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-2 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">Total Playlists</p>
                <p className="text-2xl font-bold text-white">{ownerStats[selectedOwner].totalPlaylists}</p>
              </div>
              <div className="bg-surface-2 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">Total Songs</p>
                <p className="text-2xl font-bold text-white">{ownerStats[selectedOwner].totalSongs.toLocaleString()}</p>
              </div>
              <div className="bg-surface-2 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">Total Followers</p>
                <p className="text-2xl font-bold text-white">{ownerStats[selectedOwner].totalFollowers.toLocaleString()}</p>
              </div>
              <div className="bg-surface-2 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">Public Playlists</p>
                <p className="text-2xl font-bold text-white">{ownerStats[selectedOwner].publicCount}</p>
              </div>
            </div>

            {/* Status Warning */}
            {ownerStats[selectedOwner].inactiveCount > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-300">Inactive Playlists</p>
                  <p className="text-xs text-red-200">{ownerStats[selectedOwner].inactiveCount} playlist(s) are inactive</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t border-white/5">
              <button
                onClick={() => {
                  setSearch(selectedOwner);
                  setSelectedOwner(null);
                  setPage(1);
                }}
                className="flex-1 px-4 py-2 bg-accent-500/20 text-accent-300 rounded-lg hover:bg-accent-500/30 transition-colors text-sm font-semibold"
              >
                View All Playlists
              </button>
              <button
                onClick={() => setSelectedOwner(null)}
                className="flex-1 px-4 py-2 bg-surface-2 text-slate-300 rounded-lg hover:bg-surface-3 transition-colors text-sm font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <Modal
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          title="Permanently Delete Playlist?"
        >
          <div className="space-y-6">
            {/* Warning */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-300">This action cannot be undone</p>
                <p className="text-xs text-red-200 mt-1">
                  The playlist "{deleteConfirm.name}" and all its data will be permanently removed from the system.
                </p>
              </div>
            </div>

            {/* Playlist Info */}
            <div className="bg-surface-2 rounded-lg p-4 space-y-2">
              <p className="text-sm">
                <span className="text-slate-500">Playlist:</span>
                <span className="text-white font-semibold ml-2">{deleteConfirm.name}</span>
              </p>
              <p className="text-sm">
                <span className="text-slate-500">Songs:</span>
                <span className="text-white font-semibold ml-2">{deleteConfirm.songIds?.length || 0}</span>
              </p>
              <p className="text-sm">
                <span className="text-slate-500">Followers:</span>
                <span className="text-white font-semibold ml-2">{deleteConfirm.followerCount || 0}</span>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-white/5">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deletePlaylistAdmin.isPending}
                className="flex-1 px-4 py-2.5 bg-surface-2 text-slate-300 rounded-lg hover:bg-surface-3 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeletePlaylist(deleteConfirm)}
                disabled={deletePlaylistAdmin.isPending}
                className="flex-1 px-4 py-2.5 bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30 rounded-lg transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {deletePlaylistAdmin.isPending ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
