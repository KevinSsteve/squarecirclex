import { useState } from 'react';

const PostContentCard = ({ postContent, imageUrl, onGenerateImage }) => {
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState(imageUrl || null);

  const { caption, hashtags, image_description } = postContent;
  const captionPreview = caption && caption.length > 150 ? caption.substring(0, 150) + '...' : caption;

  const handleGenerateImage = async () => {
    setIsGeneratingImage(true);
    try {
      const url = await onGenerateImage(image_description);
      if (url) {
        setGeneratedImageUrl(url);
      }
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden max-w-2xl hover:shadow-xl transition-shadow">
      {/* Image Section - Clean Tech Aesthetic */}
      <div className="relative bg-gray-50 min-h-[200px] flex items-center justify-center">
        {generatedImageUrl ? (
          // Success State: Show generated image
          <img 
            src={generatedImageUrl} 
            alt="Generated Post" 
            className="w-full object-cover"
          />
        ) : (
          // Empty State: Show generate button
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-gray-400 mb-4">Imagem não gerada</p>
            {image_description && (
              <button
                onClick={handleGenerateImage}
                disabled={isGeneratingImage}
                className="bg-gray-900 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {isGeneratingImage ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Gerando...
                  </>
                ) : (
                  <>
                    Gerar imagem ✨
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content Section - Pure White Background */}
      <div className="p-4 bg-white select-none">
        {/* Caption */}
        {caption && (
          <div className="mb-3">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm select-none">
              {showFullCaption ? caption : captionPreview}
            </p>
            {caption.length > 150 && (
              <button
                onClick={() => setShowFullCaption(!showFullCaption)}
                className="text-gray-600 hover:text-gray-900 text-xs font-medium mt-1"
              >
                {showFullCaption ? 'Mostrar menos' : 'Ler mais'}
              </button>
            )}
          </div>
        )}

        {/* Hashtags */}
        {hashtags && hashtags.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1 select-none">
              {Array.isArray(hashtags) ? hashtags.map((tag, index) => (
                <span key={index} className="text-gray-600 text-xs select-none">
                  {tag}
                </span>
              )) : (
                <span className="text-gray-600 text-xs select-none">
                  {hashtags}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons - Below Card */}
      <div className="px-4 pb-4 bg-white flex gap-2">
        <button className="flex-1 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all">
          Copiar
        </button>
        <button className="flex-1 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-all shadow-sm">
          Publicar
        </button>
        <button className="flex-1 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all">
          Agendar
        </button>
      </div>
    </div>
  );
};

export default PostContentCard;