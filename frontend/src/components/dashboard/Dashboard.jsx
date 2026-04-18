import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../config/api';
import { useDashboard } from '../../contexts/DashboardContext';
import { useChat } from '../../contexts/ChatContext';
import CalendarView from './CalendarView';
import PostDetailsModal from './PostDetailsModal';
import StatusFilter from './StatusFilter';
import ChatSidebar from '../chat/ChatSidebar';
import UserMenu from '../user/UserMenu';
import ViewToggleButton from '../game/ui/ViewToggleButton';
import viewToggle, { ViewMode } from '../game/utils/ViewToggle';

const Dashboard = () => {
  const navigate = useNavigate();
  const { refreshTrigger } = useDashboard();
  const { messages, isTyping, sendMessage } = useChat();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Calculate date range for current month view
  const getDateRange = () => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    return {
      start_date: start.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0],
    };
  };

  // Fetch posts from API
  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { start_date, end_date } = getDateRange();
      const params = {
        start_date,
        end_date,
      };
      
      // Add status filter if not 'all'
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      const response = await api.getPosts(params);
      setPosts(response.data.posts || []);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(err.message || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  // Fetch posts when filters or date changes
  useEffect(() => {
    fetchPosts();
  }, [statusFilter, currentDate, refreshTrigger]);
  
  // Check if user prefers game view and redirect (Phase 10, Task 64)
  useEffect(() => {
    if (viewToggle.isGameView() && viewToggle.isGameViewAvailable()) {
      console.log('[Dashboard] User prefers game view - redirecting');
      navigate('/app');
    }
  }, [navigate]);

  // Handle post click
  const handlePostClick = (post) => {
    setSelectedPost(post);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setSelectedPost(null);
  };

  // Handle month navigation
  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Refresh posts (called after chat actions)
  const refreshPosts = () => {
    fetchPosts();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Content Calendar</h1>
              <p className="mt-2 text-gray-600">Manage your scheduled social media posts</p>
            </div>
            <div className="flex items-center gap-4">
              {/* View Toggle Button (Phase 10, Task 64) */}
              <ViewToggleButton />
              <UserMenu />
            </div>
          </div>

          {/* Status Filter */}
          <StatusFilter
            currentFilter={statusFilter}
            onFilterChange={setStatusFilter}
          />

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            /* Calendar View */
            <CalendarView
              posts={posts}
              currentDate={currentDate}
              onPostClick={handlePostClick}
              onPreviousMonth={handlePreviousMonth}
              onNextMonth={handleNextMonth}
            />
          )}

          {/* Post Details Modal */}
          {selectedPost && (
            <PostDetailsModal
              post={selectedPost}
              onClose={handleCloseModal}
              onUpdate={refreshPosts}
            />
          )}
        </div>
      </div>

      {/* Chat Sidebar */}
      <ChatSidebar
        messages={messages}
        isTyping={isTyping}
        onSendMessage={sendMessage}
      />
    </div>
  );
};

export default Dashboard;
