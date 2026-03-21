import { useParams, useNavigate, Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { ArrowLeft, ListMusic, Globe, Lock, Plus, Music, Edit, Trash2, Play, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { usePlaylist } from '../hooks/usePlaylists';
import { useRemoveSongFromPlaylist, useReorderSongs, useUpdatePlaylist } from '../hooks/usePlaylists';
import { useSongs } from '../hooks/useSongs';
import { useAddSongsToPlaylist } from '../hooks/usePlaylists';
import { usePlayer } from '../context/PlayerContext';
import { SongRow } from '../components/songs/SongCard.jsx';
import { Modal, SearchBar, Badge } from '../components/ui/index.jsx';
import { SkeletonList, EmptyState, ErrorState, LoadingSpinner } from '../components/ui/LoadingStates.jsx';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import SortableSongItem from '../components/songs/SortableSongItem';

export default function PlaylistDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const { playPlaylist, addToQueue, currentPlaylistId } = usePlayer();
  const [showAddSongs, setShowAddSongs] = useState(false);
  const [songSearch, setSongSearch] = useState('');
  const [playlistSongs, setPlaylistSongs] = useState([]);
  const [isFetchingSongs, setIsFetchingSongs] = useState(false);
  const [songPage, setSongPage] = useState(1);
  const [showEditImage, setShowEditImage] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const SONGS_PER_PAGE = 50;

  // Setup sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      distance: 8,
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data, isLoading, error } = usePlaylist(id);
  const removeSong = useRemoveSongFromPlaylist();
  const addSongs = useAddSongsToPlaylist();
  const reorderSongs = useReorderSongs();
  const updatePlaylist = useUpdatePlaylist();

  // Fetch songs for the modal - increased limit with pagination
  const { data: songSearchData, isLoading: searchLoading } = useSongs({
    search: songSearch || undefined,
    limit: songSearch ? 50 : SONGS_PER_PAGE * songPage, // Show more songs when paginating, fewer when searching
  });

  // Reset pagination when search changes
  useEffect(() => {
    setSongPage(1);
  }, [songSearch]);

  // Initialize image URL from playlist
  useEffect(() => {
    if (data?.data?.coverImage) {
      setImageUrl(data.data.coverImage);
    }
  }, [data?.data?.coverImage]);

  // Fetch full song data for all songs in the playlist
  useEffect(() => {
    const fetchPlaylistSongs = async () => {
      if (!data?.data?.songIds || data.data.songIds.length === 0) {
        setPlaylistSongs([]);
        return;
      }

      setIsFetchingSongs(true);
      try {
        // Fetch all songs and filter by IDs in the playlist
        const allSongs = [];
        const batchSize = 50;
        
        for (let i = 0; i < data.data.songIds.length; i += batchSize) {
          const response = await fetch('/api/songs?limit=100');
          const result = await response.json();
          allSongs.push(...(result.songs || []));
        }

        // Filter songs that are in this playlist and maintain order
        const playlistSongIds = data.data.songIds;
        const filteredSongs = playlistSongIds
          .map(id => allSongs.find(song => song._id === id))
          .filter(song => song); // Remove any undefined entries

        setPlaylistSongs(filteredSongs);
      } catch (err) {
        console.error('Error fetching playlist songs:', err);
        toast.error('Failed to load playlist songs');
      } finally {
        setIsFetchingSongs(false);
      }
    };

    fetchPlaylistSongs();
  }, [data?.data?.songIds]);

  const playlist = data?.data;
  const isOwner = playlist?.clerkUserId === user?.id;
  const searchResults = songSearchData?.songs || [];

  const handleRemoveSong = (songId) => {
    removeSong.mutate({ playlistId: id, songId });
  };

  const handleAddSong = async (songId) => {
    // Add song via mutation (this will invalidate and refetch the playlist)
    addSongs.mutate({ id, songIds: [songId] }, {
      onSuccess: async () => {
        // If this playlist is currently playing, fetch and add the song to the queue
        if (currentPlaylistId === id) {
          try {
            const response = await fetch(`/api/songs/${songId}`);
            const result = await response.json();
            const songToAdd = result.song || result.data;
            
            if (songToAdd && songToAdd.songUrl) {
              addToQueue([songToAdd], id);
            }
          } catch (err) {
            console.error('Failed to add song to queue:', err);
          }
        }
      }
    });
  };

  const handlePlayAll = () => {
    if (playlistSongs.length === 0) {
      toast.error('No songs to play');
      return;
    }
    playPlaylist(playlistSongs, id); // Pass playlistId
    toast.success(`Playing ${playlistSongs.length} songs`);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    // Find indices
    const oldIndex = playlistSongs.findIndex(song => song._id === active.id);
    const newIndex = playlistSongs.findIndex(song => song._id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Update local state for immediate UI feedback
    const newOrder = arrayMove(playlistSongs, oldIndex, newIndex);
    setPlaylistSongs(newOrder);

    // Call API to persist the new order
    const newSongIds = newOrder.map(song => song._id);
    reorderSongs.mutate({ playlistId: id, songIds: newSongIds });
  };

  const handleImageFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result;
      setImageUrl(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveImage = () => {
    if (!imageUrl) {
      toast.error('No image to save');
      return;
    }

    updatePlaylist.mutate({ id, data: { coverImage: imageUrl } }, {
      onSuccess: () => {
        setShowEditImage(false);
        toast.success('Playlist image updated!');
      }
    });
  };

  const handleRemoveImage = () => {
    updatePlaylist.mutate({ id, data: { coverImage: null } }, {
      onSuccess: () => {
        setImageUrl('');
        setShowEditImage(false);
        toast.success('Playlist image removed');
      }
    });
  };

  if (error) return (
    <ErrorState message={error.message} onRetry={() => navigate('/playlists')} />
  );

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <LoadingSpinner size="lg" />
    </div>
  );

  if (!playlist) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back */}
      <button onClick={() => navigate('/playlists')} className="btn-ghost">
        <ArrowLeft className="w-4 h-4" /> Back to Playlists
      </button>

      {/* Header */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Cover */}
          <div className="w-full sm:w-44 h-44 flex-shrink-0 bg-gradient-to-br from-brand-900 to-accent-600/30 rounded-2xl flex items-center justify-center overflow-hidden relative group">
            {imageUrl ? (
              <img src={imageUrl} alt="Playlist cover" className="w-full h-full object-cover" />
            ) : (
              <ListMusic className="w-16 h-16 text-brand-400/50" />
            )}
            {isOwner && (
              <button
                onClick={() => setShowEditImage(true)}
                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit className="w-6 h-6 text-white" />
              </button>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {playlist.isPublic ? (
                <Badge variant="success"><Globe className="w-3 h-3 mr-1" />Public</Badge>
              ) : (
                <Badge variant="muted"><Lock className="w-3 h-3 mr-1" />Private</Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{playlist.name}</h1>
            {playlist.description && <p className="text-slate-400 mb-4">{playlist.description}</p>}
            <p className="text-slate-500 text-sm">{playlistSongs.length} songs</p>

            <div className="flex gap-2 mt-4 flex-wrap">
              {playlistSongs.length > 0 && (
                <button onClick={handlePlayAll} className="btn-primary">
                  <Play className="w-4 h-4" /> Play All
                </button>
              )}
              {isOwner && (
                <button onClick={() => setShowAddSongs(true)} className="btn-secondary">
                  <Plus className="w-4 h-4" /> Add Songs
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Song List */}
      <div>
        <h2 className="section-title mb-4">Songs</h2>
        {playlistSongs.length === 0 ? (
          <EmptyState
            icon={Music}
            title="No songs yet"
            description={isOwner ? 'Add songs to this playlist.' : 'This playlist is empty.'}
            action={isOwner && (
              <button onClick={() => setShowAddSongs(true)} className="btn-primary">
                Add Songs
              </button>
            )}
          />
        ) : isFetchingSongs ? (
          <SkeletonList count={5} />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={playlistSongs.map(song => song._id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {playlistSongs.map((song, i) => (
                  <SortableSongItem
                    key={song._id}
                    song={song}
                    index={i}
                    isOwner={isOwner}
                    onRemove={() => handleRemoveSong(song._id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Add Songs Modal */}
      <Modal isOpen={showAddSongs} onClose={() => setShowAddSongs(false)} title="Add Songs" size="lg">
        <div className="space-y-4">
          <SearchBar value={songSearch} onChange={setSongSearch} placeholder="Search songs..." />
          
          {/* Song count info */}
          <div className="text-xs text-slate-400">
            {songSearch ? 'Search results' : `Showing songs${searchResults.length > 0 ? ` (${Math.min(searchResults.length, SONGS_PER_PAGE * songPage)} of ${searchResults.length} available)` : ''}`}
          </div>

          <div className="max-h-96 overflow-y-auto space-y-1">
            {searchLoading ? (
              <LoadingSpinner className="mx-auto" />
            ) : searchResults.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                {songSearch ? 'No songs found matching your search' : 'No songs available'}
              </div>
            ) : (
              searchResults.map((song) => (
                <div key={song._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-2 transition-colors">
                  <Music className="w-8 h-8 text-slate-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{song.title}</p>
                    <p className="text-xs text-slate-400 truncate">{song.artist}</p>
                  </div>
                  <button
                    onClick={() => handleAddSong(song._id)}
                    disabled={playlist.songIds?.includes(song._id) || addSongs.isPending}
                    className={`btn-${playlist.songIds?.includes(song._id) ? 'secondary' : 'primary'} text-xs py-1.5 px-3`}
                  >
                    {playlist.songIds?.includes(song._id) ? 'Added' : 'Add'}
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Load More button */}
          {!songSearch && searchResults.length > 0 && searchResults.length >= SONGS_PER_PAGE * songPage && (
            <button
              onClick={() => setSongPage(p => p + 1)}
              disabled={searchLoading}
              className="w-full btn-secondary text-sm"
            >
              {searchLoading ? 'Loading...' : 'Load More'}
            </button>
          )}
        </div>
      </Modal>

      {/* Edit Image Modal */}
      <Modal isOpen={showEditImage} onClose={() => setShowEditImage(false)} title="Edit Playlist Image" size="md">
        <div className="space-y-4">
          {/* Image Preview */}
          {imageUrl && (
            <div className="w-full h-48 rounded-xl overflow-hidden bg-surface-1 flex items-center justify-center">
              <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}

          {/* File Upload Option */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Upload Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageFileUpload}
              className="w-full px-4 py-2 rounded-xl bg-surface-1 text-slate-300 text-sm file:bg-brand-600 file:text-white file:border-0 file:rounded file:mr-2"
            />
            <p className="text-xs text-slate-500">Max 5MB. Supported: JPG, PNG, GIF, WebP</p>
          </div>

          {/* URL Input Option */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Or Paste Image URL</label>
            <input
              type="text"
              value={imageUrl && imageUrl.startsWith('http') ? imageUrl : ''}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-2 rounded-xl bg-surface-1 text-slate-300 text-sm border border-surface-2 focus:border-brand-500 outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            {imageUrl && (
              <button
                onClick={handleRemoveImage}
                disabled={updatePlaylist.isPending}
                className="flex-1 btn-ghost text-red-400 hover:bg-red-500/10"
              >
                Remove
              </button>
            )}
            <button
              onClick={() => setShowEditImage(false)}
              className="flex-1 btn-ghost"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveImage}
              disabled={updatePlaylist.isPending || !imageUrl}
              className="flex-1 btn-primary"
            >
              {updatePlaylist.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
