import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { User, Settings, Clock, Heart, Palette, Bell, Save, CheckCircle, Music } from 'lucide-react';
import { useUserProfile, useUpdateProfile, useUpdatePreferences, useListeningHistory } from '../hooks/useUser';
import { Badge } from '../components/ui/index.jsx';
import { LoadingSpinner, ErrorState, SkeletonList } from '../components/ui/LoadingStates.jsx';
import { clsx } from 'clsx';

const GENRES = [
  'Pop', 'Rock', 'Hip-Hop', 'R&B', 'Jazz', 'Classical',
  'Electronic', 'Country', 'Latin', 'Reggae', 'Blues',
  'Folk', 'Indie', 'Metal', 'Punk', 'Soul', 'Funk', 'Alternative', 'K-Pop', 'Other',
];

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'preferences', label: 'Preferences', icon: Heart },
  { id: 'history', label: 'History', icon: Clock },
];

export default function ProfilePage() {
  const { user: clerkUser } = useUser();
  const clerkUserId = clerkUser?.id;
  const [activeTab, setActiveTab] = useState('profile');
  const [historyWithSongs, setHistoryWithSongs] = useState([]);
  const [loadingHistorySongs, setLoadingHistorySongs] = useState(false);

  const { data: profileData, isLoading, error } = useUserProfile(clerkUserId);
  const updateProfile = useUpdateProfile();
  const updatePreferences = useUpdatePreferences();
  const { data: historyData, isLoading: historyLoading } = useListeningHistory(clerkUserId);

  const profile = profileData?.data;

  const [profileForm, setProfileForm] = useState(null);
  const [selectedGenres, setSelectedGenres] = useState(null);
  const [saved, setSaved] = useState(false);

  // Fetch song details for history
  useEffect(() => {
    const fetchSongDetails = async () => {
      if (!historyData?.history || historyData.history.length === 0) {
        setHistoryWithSongs([]);
        return;
      }

      setLoadingHistorySongs(true);
      try {
        const enrichedHistory = await Promise.all(
          historyData.history.map(async (entry) => {
            try {
              const response = await fetch(`/api/songs/${entry.songId}`);
              const result = await response.json();
              const song = result.song || result.data;
              return { ...entry, song };
            } catch (err) {
              console.error(`Failed to fetch song ${entry.songId}:`, err);
              return { ...entry, song: null };
            }
          })
        );
        setHistoryWithSongs(enrichedHistory);
      } catch (err) {
        console.error('Error enriching history:', err);
        setHistoryWithSongs(historyData.history);
      } finally {
        setLoadingHistorySongs(false);
      }
    };

    if (activeTab === 'history') {
      fetchSongDetails();
    }
  }, [historyData, activeTab]);

  // Init forms from profile data
  if (profile && !profileForm) {
    setProfileForm({ displayName: profile.displayName || '', bio: profile.bio || '' });
  }
  if (profile && !selectedGenres) {
    setSelectedGenres(profile.preferences?.favoriteGenres || []);
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    await updateProfile.mutateAsync({ clerkUserId, data: profileForm });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSavePreferences = async () => {
    await updatePreferences.mutateAsync({
      clerkUserId,
      preferences: { ...profile?.preferences, favoriteGenres: selectedGenres },
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleGenre = (genre) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  if (error) return <ErrorState message={error.message} />;
  if (isLoading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="page-title">Profile & Settings</h1>
        <p className="text-muted mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile Header */}
      <div className="card p-6 flex items-center gap-4">
        <img
          src={clerkUser?.imageUrl}
          alt="Avatar"
          className="w-16 h-16 rounded-full border-2 border-brand-500/40 object-cover"
        />
        <div>
          <h2 className="text-xl font-bold text-white">{profile?.displayName || clerkUser?.fullName}</h2>
          <p className="text-slate-400 text-sm">{clerkUser?.primaryEmailAddress?.emailAddress}</p>
          <Badge variant="brand" className="mt-1">{profile?.role || 'user'}</Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 gap-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={clsx(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-all',
              activeTab === id
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            )}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'profile' && profileForm && (
        <form onSubmit={handleSaveProfile} className="card p-6 space-y-4 animate-slide-up">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Display Name</label>
            <input
              className="input"
              maxLength={100}
              value={profileForm.displayName}
              onChange={(e) => setProfileForm((f) => ({ ...f, displayName: e.target.value }))}
              placeholder="Your display name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Bio</label>
            <textarea
              className="input resize-none"
              rows={4}
              maxLength={500}
              value={profileForm.bio}
              onChange={(e) => setProfileForm((f) => ({ ...f, bio: e.target.value }))}
              placeholder="Tell us about yourself..."
            />
            <p className="text-xs text-slate-500 mt-1">{profileForm.bio.length}/500</p>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={updateProfile.isPending} className="btn-primary">
              {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Profile</>}
            </button>
          </div>
        </form>
      )}

      {activeTab === 'preferences' && selectedGenres !== null && (
        <div className="card p-6 space-y-6 animate-slide-up">
          <div>
            <h3 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
              <Heart className="w-4 h-4 text-accent-400" /> Favorite Genres
            </h3>
            <p className="text-slate-400 text-sm mb-4">Select genres you love — we use this to personalize recommendations.</p>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((genre) => (
                <button
                  key={genre}
                  type="button"
                  onClick={() => toggleGenre(genre)}
                  className={clsx(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-all border',
                    selectedGenres.includes(genre)
                      ? 'bg-brand-500 border-brand-500 text-white shadow-glow'
                      : 'bg-surface-2 border-white/10 text-slate-400 hover:border-brand-500/50 hover:text-brand-400'
                  )}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <p className="text-sm text-slate-400">{selectedGenres.length} genres selected</p>
            <button onClick={handleSavePreferences} disabled={updatePreferences.isPending} className="btn-primary">
              {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Preferences</>}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="animate-slide-up space-y-4">
          <div className="card p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-brand-600/20">
              <Clock className="w-6 h-6 text-brand-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {historyData?.totalListeningTime
                  ? `${Math.floor(historyData.totalListeningTime / 3600)}h ${Math.floor((historyData.totalListeningTime % 3600) / 60)}m`
                  : '0h 0m'}
              </p>
              <p className="text-slate-400 text-sm">Total listening time</p>
            </div>
          </div>

          {historyLoading || loadingHistorySongs ? <SkeletonList count={5} /> : historyWithSongs.length === 0 ? (
            <div className="card p-8 text-center">
              <Clock className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No listening history yet. Start playing some songs!</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              {historyWithSongs.slice(0, 20).map((entry, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-white/5 last:border-0 hover:bg-surface-2 transition-colors">
                  {/* Song Cover */}
                  <div className="w-10 h-10 rounded-lg bg-surface-3 flex-shrink-0 overflow-hidden">
                    {entry.song?.coverUrl || entry.song?.coverArt ? (
                      <img
                        src={entry.song.coverUrl || entry.song.coverArt}
                        alt={entry.song.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Music className="w-5 h-5 text-slate-600" />
                      </div>
                    )}
                  </div>
                  {/* Song Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">
                      {entry.song?.title || 'Unknown Song'}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {entry.song?.artist || 'Unknown Artist'}
                    </p>
                  </div>
                  {/* Date & Duration */}
                  <div className="text-right text-xs text-slate-500 flex-shrink-0">
                    <p>{new Date(entry.playedAt).toLocaleDateString()}</p>
                    <p>{Math.round(entry.duration / 60)} min</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
