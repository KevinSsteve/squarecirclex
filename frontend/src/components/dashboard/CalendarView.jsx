import PostCard from './PostCard';

const CalendarView = ({ posts, currentDate, onPostClick, onPreviousMonth, onNextMonth }) => {
  // Get month and year for display
  const monthYear = currentDate.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  // Group posts by date
  const groupPostsByDate = () => {
    const grouped = {};
    
    posts.forEach(post => {
      const date = new Date(post.scheduled_time).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(post);
    });
    
    // Sort posts within each date by scheduled_time
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => 
        new Date(a.scheduled_time) - new Date(b.scheduled_time)
      );
    });
    
    return grouped;
  };

  // Get calendar days for the month
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of month
    const firstDay = new Date(year, month, 1);
    // Last day of month
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from the first day of the week containing the first day of month
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    // End at the last day of the week containing the last day of month
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    
    const days = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const groupedPosts = groupPostsByDate();
  const calendarDays = getCalendarDays();
  const currentMonth = currentDate.getMonth();

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Calendar Header with Navigation */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <button
            onClick={onPreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Previous month"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h2 className="text-xl font-semibold text-gray-900">{monthYear}</h2>
          
          <button
            onClick={onNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Next month"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Day of Week Headers */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="px-2 py-3 text-center text-sm font-semibold text-gray-700">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, index) => {
          const dateKey = day.toISOString().split('T')[0];
          const dayPosts = groupedPosts[dateKey] || [];
          const isCurrentMonth = day.getMonth() === currentMonth;
          const isToday = day.toDateString() === new Date().toDateString();

          return (
            <div
              key={index}
              className={`min-h-[120px] border-r border-b border-gray-200 p-2 ${
                !isCurrentMonth ? 'bg-gray-50' : ''
              }`}
            >
              {/* Day Number */}
              <div className="flex justify-between items-start mb-2">
                <span
                  className={`text-sm font-medium ${
                    isToday
                      ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center'
                      : isCurrentMonth
                      ? 'text-gray-900'
                      : 'text-gray-400'
                  }`}
                >
                  {day.getDate()}
                </span>
                {dayPosts.length > 0 && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {dayPosts.length}
                  </span>
                )}
              </div>

              {/* Posts for this day */}
              <div className="space-y-1">
                {dayPosts.slice(0, 3).map(post => (
                  <PostCard
                    key={post.post_id}
                    post={post}
                    onClick={() => onPostClick(post)}
                    compact={true}
                  />
                ))}
                {dayPosts.length > 3 && (
                  <div className="text-xs text-gray-500 text-center py-1">
                    +{dayPosts.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {posts.length === 0 && (
        <div className="px-6 py-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No posts scheduled</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first post through the chat sidebar.
          </p>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
