const DataConfirmation = ({ data, onConfirm, onEdit }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-6">
          <h1 className="text-2xl font-bold">Review Your Information</h1>
          <p className="text-blue-100 text-sm mt-1">Please confirm that everything looks correct</p>
        </div>

        {/* Data Display */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Brand Name */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Brand Name</h3>
            <p className="text-lg text-gray-900">{data.brand_name}</p>
          </div>

          {/* Industry */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Industry</h3>
            <p className="text-lg text-gray-900">{data.industry}</p>
          </div>

          {/* Target Audience */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Target Audience</h3>
            <p className="text-lg text-gray-900">{data.target_audience}</p>
          </div>

          {/* Tone of Voice */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Tone of Voice</h3>
            <p className="text-lg text-gray-900">{data.tone_of_voice}</p>
          </div>

          {/* Visual Style */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Visual Style</h3>
            <p className="text-lg text-gray-900">{data.visual_style}</p>
          </div>

          {/* Content Pillars */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Content Pillars</h3>
            <div className="flex flex-wrap gap-2 mt-2">
              {data.content_pillars.map((pillar, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                >
                  {pillar}
                </span>
              ))}
            </div>
          </div>

          {/* Post Times */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Posting Times</h3>
            <div className="flex flex-wrap gap-2 mt-2">
              {data.post_times.map((time, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                >
                  {time}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
          <button
            onClick={onEdit}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Edit Information
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Looks Good!
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataConfirmation;
