import { useState } from 'react';
import { api } from '../../config/api';
import EditPostModal from './EditPostModal';

const PostDetailsModal = ({ post, onClose, onUpdate }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Status badge colors
  const statusColors = {
    Draft: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
    Published: 'bg-green-100 text-green-800 border-green-200',
    Failed: 'bg-red-100 text-red-800 border-red-200',
  };

  // Platform icons
  const platformIcons = {
    instagram: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
    linkedin: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
  };

  // Format date and time
  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }),
    };
  };

  const { date, time } = formatDateTime(post.scheduled_time);

  // Handle delete
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      setIsDeleting(true);
      setError(null);
      await api.deletePost(post.post_id);
      onUpdate(); // Refresh the posts list
      onClose(); // Close the modal
    } catch (err) {
      console.error('Error deleting post:', err);
      setError(err.message || 'Failed to delete post');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle regenerate
  const handleRegenerate = async () => {
    if (!window.confirm('Regenerate this post? This will create new content while keeping the same schedule.')) {
      return;
    }

    try {
      setIsRegenerating(true);
      setError(null);
      await api.regeneratePost(post.post_id);
      onUpdate(); // Refresh the posts list
      onClose(); // Close the modal
    } catch (err) {
      console.error('Error regenerating post:', err);
      setError(err.message || 'Failed to regenerate post');
    } finally {
      setIsRegenerating(false);
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Post Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Status and Platform */}
          <div className="flex items-center gap-3 mb-6">
            <span className={`px-3 py-1 rounded-lg text-sm font-medium border ${statusColors[post.status]}`}>
              {post.status}
            </span>
            <div className="flex items-center gap-2 text-gray-600">
              {platformIcons[post.platform]}
              <span className="text-sm capitalize font-medium">{post.platform}</span>
            </div>
          </div>

          {/* Image */}
          {post.image_url && (
            <div className="mb-6">
              <img
                src={post.image_url}
                alt="Post content"
                className="w-full rounded-lg shadow-md"
              />
            </div>
          )}

          {/* Caption */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Caption</h3>
            <p className="text-gray-900 whitespace-pre-wrap">{post.caption}</p>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Scheduled Time */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Scheduled For</h3>
              <p className="text-gray-900">{date}</p>
              <p className="text-gray-600 text-sm">{time}</p>
            </div>

            {/* Content Pillar */}
            {post.content_pillar && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Content Pillar</h3>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700">
                  {post.content_pillar}
                </span>
              </div>
            )}

            {/* Published At */}
            {post.published_at && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Published At</h3>
                <p className="text-gray-900">
                  {formatDateTime(post.published_at).date}
                </p>
                <p className="text-gray-600 text-sm">
                  {formatDateTime(post.published_at).time}
                </p>
              </div>
            )}

            {/* Error Message */}
            {post.error_message && (
              <div className="md:col-span-2">
                <h3 className="text-sm font-semibold text-red-700 mb-1">Error</h3>
                <p className="text-red-600 text-sm">{post.error_message}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            {/* Edit button */}
            <button
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              onClick={() => setShowEditModal(true)}
            >
              Edit Post
            </button>

            {/* Regenerate button */}
            {(post.status === 'Draft' || post.status === 'Scheduled') && (
              <button
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRegenerating ? 'Regenerating...' : 'Regenerate'}
              </button>
            )}

            {/* Delete button */}
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>

        {/* Edit Modal */}
        {showEditModal && (
          <EditPostModal
            post={post}
            onClose={() => setShowEditModal(false)}
            onUpdate={onUpdate}
          />
        )}
      </div>
    </div>
  );
};

export default PostDetailsModal;
