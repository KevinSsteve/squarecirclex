import { useState } from 'react';
import { api } from '../../config/api';

const EditPostModal = ({ post, onClose, onUpdate }) => {
  const [caption, setCaption] = useState(post.caption);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // Handle save
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      // Call API to update post
      await api.updatePost(post.post_id, { caption });
      
      // Notify parent to refresh
      onUpdate();
      onClose();
    } catch (err) {
      console.error('Error updating post:', err);
      setError(err.message || 'Failed to update post');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Check if caption has changed
  const hasChanges = caption !== post.caption;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Edit Post</h2>
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

          {/* Image Preview */}
          {post.image_url && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Image Preview
              </label>
              <img
                src={post.image_url}
                alt="Post content"
                className="w-full rounded-lg shadow-md"
              />
            </div>
          )}

          {/* Caption Editor */}
          <div className="mb-6">
            <label htmlFor="caption" className="block text-sm font-semibold text-gray-700 mb-2">
              Caption
            </label>
            <textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={8}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Enter your post caption..."
            />
            <div className="mt-2 text-sm text-gray-500">
              {caption.length} characters
            </div>
          </div>

          {/* Post Metadata (Read-only) */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Post Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Status:</span>
                <span className="ml-2 font-medium text-gray-900">{post.status}</span>
              </div>
              <div>
                <span className="text-gray-600">Platform:</span>
                <span className="ml-2 font-medium text-gray-900 capitalize">{post.platform}</span>
              </div>
              <div>
                <span className="text-gray-600">Content Pillar:</span>
                <span className="ml-2 font-medium text-gray-900">{post.content_pillar}</span>
              </div>
              <div>
                <span className="text-gray-600">Scheduled:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {new Date(post.scheduled_time).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditPostModal;
