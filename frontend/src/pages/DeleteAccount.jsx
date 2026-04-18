import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../config/api';

const DeleteAccount = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [confirmation, setConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [deletionSummary, setDeletionSummary] = useState(null);

  const handleDelete = async () => {
    if (confirmation !== 'DELETE MY ACCOUNT') {
      setError('Please type the exact confirmation phrase');
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await api.deleteAccount({ confirmation });
      setDeletionSummary(response.data.summary);

      // Wait 3 seconds to show summary, then logout and redirect
      setTimeout(async () => {
        await logout();
        navigate('/login');
      }, 3000);

    } catch (err) {
      console.error('Delete account error:', err);
      setError(err.response?.data?.error || 'Failed to delete account. Please try again.');
      setIsDeleting(false);
    }
  };

  if (deletionSummary) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Deleted Successfully</h2>
            <p className="text-gray-600 mb-6">
              Your account and all associated data have been permanently deleted.
            </p>

            {/* Deletion Summary */}
            <div className="bg-gray-50 rounded-lg p-6 text-left mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Deletion Summary:</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Brands deleted:</span>
                  <span className="font-medium">{deletionSummary.brands_deleted}</span>
                </div>
                <div className="flex justify-between">
                  <span>Posts deleted:</span>
                  <span className="font-medium">{deletionSummary.posts_deleted}</span>
                </div>
                <div className="flex justify-between">
                  <span>Logs deleted:</span>
                  <span className="font-medium">{deletionSummary.logs_deleted}</span>
                </div>
                <div className="flex justify-between">
                  <span>Scheduled rules deleted:</span>
                  <span className="font-medium">{deletionSummary.rules_deleted}</span>
                </div>
                <div className="flex justify-between">
                  <span>Images deleted:</span>
                  <span className="font-medium">{deletionSummary.s3_objects_deleted}</span>
                </div>
                <div className="flex justify-between">
                  <span>Secrets deleted:</span>
                  <span className="font-medium">{deletionSummary.secrets_deleted}</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-500">
              Redirecting to login page...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Delete Account</h1>
          <p className="text-gray-600">
            This action cannot be undone. Please read carefully.
          </p>
        </div>

        {/* Warning Box */}
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Warning: Permanent Deletion</h3>
              <p className="mt-2 text-sm text-red-700">
                Deleting your account will permanently remove all your data. This action cannot be reversed.
              </p>
            </div>
          </div>
        </div>

        {/* What Will Be Deleted */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">What will be deleted:</h2>
          <ul className="space-y-3">
            {[
              { icon: '🏢', text: 'All your brands and brand settings' },
              { icon: '📝', text: 'All your posts (published and scheduled)' },
              { icon: '📅', text: 'All your content calendar data' },
              { icon: '🖼️', text: 'All your uploaded images' },
              { icon: '🔗', text: 'All your social media connections' },
              { icon: '📊', text: 'All your automation logs and analytics' },
              { icon: '🔐', text: 'All your stored credentials and secrets' }
            ].map((item, index) => (
              <li key={index} className="flex items-start">
                <span className="text-2xl mr-3">{item.icon}</span>
                <span className="text-gray-700 pt-1">{item.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* User Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600">
            You are about to delete the account for:
          </p>
          <p className="text-lg font-semibold text-gray-900 mt-1">
            {user?.email}
          </p>
        </div>

        {/* Confirmation Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type <span className="font-bold text-red-600">DELETE MY ACCOUNT</span> to confirm:
          </label>
          <input
            type="text"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="DELETE MY ACCOUNT"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            disabled={isDeleting}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={() => navigate('/dashboard')}
            disabled={isDeleting}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={confirmation !== 'DELETE MY ACCOUNT' || isDeleting}
            className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isDeleting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Deleting...
              </>
            ) : (
              'Delete My Account'
            )}
          </button>
        </div>

        {/* Additional Info */}
        <p className="mt-6 text-xs text-center text-gray-500">
          Need help? Contact support before deleting your account.
        </p>
      </div>
    </div>
  );
};

export default DeleteAccount;
