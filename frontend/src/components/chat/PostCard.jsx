import { useState } from 'react';

const PostCard = ({ content, imageUrl, onPublish, onSchedule }) => {
  const [showFullCaption, setShowFullCaption] = useState(false);

  // Parse the content to extract caption and hashtags
  const parseContent = (text) => {
    const lines = text.split('\n');
    let caption = '';
    let hashtags = '';
    let inCaption = false;
    let inHashtags = false;

    for (const line of lines) {
      if (line.includes('📝 LEGENDA') || line.includes('LEGENDA:')) {
        inCaption = true;
        inHashtags = false;
        continue;
      }
      if (line.includes('🏷️ HASHTAGS') || line.includes('HASHTAGS:')) {
        inHashtags = true;
        inCaption = false;
        continue;
      }
      if (line.includes('🎨 DESCRIÇÃO DA IMAGEM') || line.includes('DESCRIÇÃO:')) {
        break;
      }

      if (inCaption && line.trim()) {
        caption += line.trim() + ' ';
      }
      if (inHashtags && line.trim()) {
        hashtags += line.trim() + ' ';
      }
    }

    return {
      caption: caption.trim(),
      hashtags: hashtags.trim()
    };
  };

  const { caption, hashtags } = parseContent(content);
  const captionPreview = caption.length > 150 ? caption.substring(0, 150) + '...' : caption;

  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden max-w-2xl hover:shadow-xl transition-shadow">
      {/* Image Section */}
      {imageUrl && (
        <div className="relative">
          <img 
            src={imageUrl} 
            alt="Generated Post" 
            className="w-full h-auto object-cover"
          />
          <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold shadow-lg">
            ✓ Gerado
          </div>
        </div>
      )}

      {/* Content Section */}
      <div className="p-4">
        {/* Caption */}
        <div className="mb-3">
          <div className="flex items-center mb-1">
            <span className="text-sm font-semibold text-gray-900">📝 Legenda</span>
          </div>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">
            {showFullCaption ? caption : captionPreview}
          </p>
          {caption.length > 150 && (
            <button
              onClick={() => setShowFullCaption(!showFullCaption)}
              className="text-purple-600 hover:text-purple-700 text-xs font-medium mt-1"
            >
              {showFullCaption ? 'Mostrar menos' : 'Ler mais'}
            </button>
          )}
        </div>

        {/* Hashtags */}
        {hashtags && (
          <div className="mb-3">
            <div className="flex items-center mb-1">
              <span className="text-xs font-semibold text-gray-700">🏷️ Hashtags</span>
            </div>
            <p className="text-purple-600 text-xs">
              {hashtags}
            </p>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-gray-200 my-3"></div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onPublish}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105 flex items-center justify-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Publicar no Instagram
          </button>
          <button
            onClick={onSchedule}
            className="flex-1 bg-white text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold border-2 border-gray-300 hover:border-purple-400 hover:text-purple-600 transition-all flex items-center justify-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Agendar
          </button>
        </div>

        {/* Info Footer */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            💡 Dica: Você pode editar a legenda antes de publicar
          </p>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
