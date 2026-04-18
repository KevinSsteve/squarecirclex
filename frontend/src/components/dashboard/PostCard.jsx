const PostCard = ({ post, onClick, compact = false }) => {
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
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
    linkedin: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
  };

  // Format time
  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Truncate caption for preview
  const truncateCaption = (text, maxLength = 60) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (compact) {
    // Compact view for calendar grid
    return (
      <button
        onClick={onClick}
        className={`w-full text-left p-2 rounded border ${statusColors[post.status]} hover:shadow-sm transition-shadow text-xs`}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium truncate flex-1">
            {formatTime(post.scheduled_time)}
          </span>
          {platformIcons[post.platform]}
        </div>
        <div className="text-gray-600 truncate text-[10px]">
          {truncateCaption(post.caption, 40)}
        </div>
      </button>
    );
  }

  // Full card view (for list views if needed)
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex gap-4">
        {/* Thumbnail */}
        {post.image_url && (
          <div className="flex-shrink-0">
            <img
              src={post.image_url}
              alt="Post thumbnail"
              className="w-20 h-20 object-cover rounded"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs font-medium border ${statusColors[post.status]}`}>
                {post.status}
              </span>
              <div className="flex items-center gap-1 text-gray-500">
                {platformIcons[post.platform]}
                <span className="text-xs capitalize">{post.platform}</span>
              </div>
            </div>
            <span className="text-sm text-gray-500">
              {formatTime(post.scheduled_time)}
            </span>
          </div>

          {/* Caption Preview */}
          <p className="text-sm text-gray-700 line-clamp-2">
            {post.caption}
          </p>

          {/* Content Pillar */}
          {post.content_pillar && (
            <div className="mt-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                {post.content_pillar}
              </span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
};

export default PostCard;
