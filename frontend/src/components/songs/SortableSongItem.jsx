import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';

export default function SortableSongItem({ song, index, isOwner, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: song._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        'flex items-center gap-4 p-4 rounded-xl transition-all duration-200 group',
        isDragging
          ? 'bg-brand-600/30 shadow-lg z-10'
          : 'bg-surface-1 hover:bg-surface-2'
      )}
    >
      {isOwner && (
        <div
          {...attributes}
          {...listeners}
          className="text-slate-500 hover:text-slate-300 cursor-grab active:cursor-grabbing transition-colors"
        >
          <GripVertical className="w-5 h-5" />
        </div>
      )}
      {!isOwner && <span className="w-6 text-center text-sm text-slate-500">{index + 1}</span>}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{song.title}</p>
        <p className="text-xs text-slate-400 truncate">{song.artist}</p>
      </div>
      {isOwner && (
        <button
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
