'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { MUTED_GRAY_BLUR_DATA_URL } from '@/lib/image';
import type { Photograph } from '@/lib/types';
import { usePrintDrawer } from './PrintDrawerProvider';

type Props = {
  photo: Photograph;
  onClose: () => void;
};

function getStoredLikes(imageCode: string): number {
  try {
    const map = JSON.parse(window.localStorage.getItem('imageLikes') ?? '{}') as Record<string, number>;
    return map[imageCode] ?? 0;
  } catch {
    return 0;
  }
}

function setStoredLikes(imageCode: string, count: number) {
  try {
    const map = JSON.parse(window.localStorage.getItem('imageLikes') ?? '{}') as Record<string, number>;
    map[imageCode] = count;
    window.localStorage.setItem('imageLikes', JSON.stringify(map));
  } catch {
    // ignore
  }
}

function getStoredComments(imageCode: string): string[] {
  try {
    const map = JSON.parse(window.localStorage.getItem('imageComments') ?? '{}') as Record<string, string[]>;
    return map[imageCode] ?? [];
  } catch {
    return [];
  }
}

function setStoredComments(imageCode: string, comments: string[]) {
  try {
    const map = JSON.parse(window.localStorage.getItem('imageComments') ?? '{}') as Record<string, string[]>;
    map[imageCode] = comments;
    window.localStorage.setItem('imageComments', JSON.stringify(map));
  } catch {
    // ignore
  }
}

function hasStoredLiked(imageCode: string): boolean {
  try {
    const set = JSON.parse(window.localStorage.getItem('likedImages') ?? '[]') as string[];
    return set.includes(imageCode);
  } catch {
    return false;
  }
}

function toggleStoredLiked(imageCode: string): boolean {
  try {
    const set = JSON.parse(window.localStorage.getItem('likedImages') ?? '[]') as string[];
    const liked = set.includes(imageCode);
    const next = liked ? set.filter((c) => c !== imageCode) : [...set, imageCode];
    window.localStorage.setItem('likedImages', JSON.stringify(next));
    return !liked;
  } catch {
    return false;
  }
}

export function ExpandedImagePanel({ photo, onClose }: Props) {
  const { openPrintDrawer } = usePrintDrawer();

  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState<string[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);

  // Load persisted state when photo changes
  useEffect(() => {
    setLikes(getStoredLikes(photo.imageCode));
    setLiked(hasStoredLiked(photo.imageCode));
    setComments(getStoredComments(photo.imageCode));
    setShowComments(false);
    setCommentInput('');
    setShareCopied(false);
  }, [photo.imageCode]);

  // Escape key to close
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function handleLike() {
    const nowLiked = toggleStoredLiked(photo.imageCode);
    const nextCount = nowLiked ? likes + 1 : Math.max(0, likes - 1);
    setStoredLikes(photo.imageCode, nextCount);
    setLikes(nextCount);
    setLiked(nowLiked);
  }

  function handleShare() {
    const url = `${window.location.origin}/archive?image=${encodeURIComponent(photo.imageCode)}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }).catch(() => {
      // fallback: select text
    });
  }

  function toggleComments() {
    setShowComments((v) => !v);
    if (!showComments) {
      setTimeout(() => commentInputRef.current?.focus(), 50);
    }
  }

  function submitComment(e: React.FormEvent) {
    e.preventDefault();
    const text = commentInput.trim();
    if (!text) return;
    const next = [...comments, text];
    setStoredComments(photo.imageCode, next);
    setComments(next);
    setCommentInput('');
  }

  return (
    <div className="flex flex-col">
      {/* Close bar */}
      <div className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-gray-500">
        <span>{photo.imageCode}</span>
        <button
          type="button"
          onClick={onClose}
          className="text-black hover:text-gray-500"
          aria-label="Close expanded view"
        >
          [ CLOSE ]
        </button>
      </div>

      {/* Image + detail side by side */}
      <div className="flex gap-5 items-start">

        {/* Left — image */}
        <div className="w-[55%] shrink-0">
          <div
            className="relative w-full bg-gray-200"
            style={{ aspectRatio: `${photo.aspectRatio}` }}
          >
            <Image onContextMenu={(event) => event.preventDefault()}
              src={photo.imageUrl}
              alt={photo.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 28vw, 470px"
              placeholder="blur"
              blurDataURL={MUTED_GRAY_BLUR_DATA_URL}
              draggable={false}
              className="select-none object-cover"
              priority
            />
          </div>
        </div>

        {/* Right — detail panel */}
        <div className="flex flex-1 flex-col min-w-0">

          {/* Actions */}
          <div className="flex items-center gap-4 font-mono text-[11px] uppercase tracking-[0.08em]">
            {/* Like */}
            <button
              type="button"
              onClick={handleLike}
              className={`flex items-center gap-1 transition-colors ${liked ? 'text-black' : 'text-gray-400 hover:text-black'}`}
              aria-label={liked ? 'Unlike' : 'Like'}
            >
              <span aria-hidden="true">{liked ? '♥' : '♡'}</span>
              {likes > 0 && <span>{likes}</span>}
            </button>

            {/* Comment */}
            <button
              type="button"
              onClick={toggleComments}
              className="flex items-center gap-1 text-gray-400 hover:text-black transition-colors"
              aria-label="Toggle comments"
            >
              <span aria-hidden="true">◎</span>
              {comments.length > 0 && <span>{comments.length}</span>}
            </button>

            {/* Share */}
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1 text-gray-400 hover:text-black transition-colors"
              aria-label="Copy share link"
            >
              <span aria-hidden="true">↗</span>
              <span>{shareCopied ? 'COPIED' : 'SHARE'}</span>
            </button>
          </div>

          {/* Title + location + description */}
          <div className="mt-4 border-t border-gray-200 pt-4">
            <h2 className="font-mono text-[13px] uppercase tracking-[0.16em] text-black">
              {photo.title}
            </h2>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-gray-500">
              {photo.location}
            </p>
            {photo.description && (
              <p className="mt-3 text-xs leading-relaxed text-gray-700">{photo.description}</p>
            )}
          </div>

          {/* Want Print */}
          {photo.isPrintAvailable && (
            <button
              type="button"
              onClick={() => openPrintDrawer(photo)}
              className="mt-5 w-full bg-black py-3 font-mono text-[11px] uppercase tracking-[0.12em] text-white hover:bg-gray-800"
            >
              [ WANT PRINT ]
            </button>
          )}

          {/* Comments section */}
          {showComments && (
            <div className="mt-5 border-t border-gray-200 pt-4">
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.12em] text-gray-500">
                COMMENTS
              </p>
              {comments.length === 0 && (
                <p className="mb-3 text-xs text-gray-400">No comments yet.</p>
              )}
              <ul className="mb-4 grid gap-2">
                {comments.map((c, i) => (
                  <li key={`${i}-${c.slice(0, 12)}`} className="border-l-2 border-gray-200 pl-2 text-xs leading-relaxed text-gray-700">
                    {c}
                  </li>
                ))}
              </ul>
              <form onSubmit={submitComment} className="flex gap-2">
                <input
                  ref={commentInputRef}
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 border border-black bg-white px-3 py-2 font-mono text-[11px] outline-none"
                  maxLength={280}
                />
                <button
                  type="submit"
                  className="bg-black px-4 py-2 font-mono text-[10px] uppercase tracking-[0.08em] text-white hover:bg-gray-800"
                >
                  POST
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
