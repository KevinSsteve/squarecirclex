import { useState } from 'react';

const ContentPlanCard = ({ planData }) => {
  const [expandedItems, setExpandedItems] = useState({});
  const [selectedItems, setSelectedItems] = useState({});
  const [generatingItems, setGeneratingItems] = useState({});
  const [generatingImages, setGeneratingImages] = useState({});
  const [generatedContent, setGeneratedContent] = useState({});

  const API_URL = import.meta.env.VITE_API_URL;

  // BULLETPROOF JSON sanitization utility - handles conversational text around JSON
  const sanitizeAndExtractJSON = (rawData) => {
    // CRITICAL FIX: If already an object, return it directly (no double parsing!)
    if (typeof rawData === 'object' && rawData !== null) {
      return rawData;
    }

    // If not a string, can't process
    if (typeof rawData !== 'string') {
      console.error('[SILENT] Invalid input to sanitizeAndExtractJSON:', typeof rawData);
      return null;
    }

    try {
      let cleanedText = rawData.trim();

      // Step 1: Extract JSON from markdown code blocks
      const markdownJsonMatch = cleanedText.match(/```json\s*([\s\S]*?)\s*```/);
      if (markdownJsonMatch) {
        cleanedText = markdownJsonMatch[1].trim();
        console.log('[SILENT] Extracted JSON from markdown block');
      } else {
        // Extract JSON from generic code blocks
        const codeBlockMatch = cleanedText.match(/```\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
          cleanedText = codeBlockMatch[1].trim();
          console.log('[SILENT] Extracted JSON from code block');
        }
      }

      // Step 2: CRITICAL FIX - Find JSON object boundaries using REGEX
      // This handles conversational text before/after the JSON
      // Pattern: Find first { and last } in the string
      const firstBrace = cleanedText.indexOf('{');
      const lastBrace = cleanedText.lastIndexOf('}');
      
      if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
        console.error('[SILENT] No valid JSON object found in response');
        console.error('[SILENT] Text sample:', cleanedText.substring(0, 200));
        return null;
      }

      // Extract ONLY the JSON object - ignore everything before/after
      const jsonString = cleanedText.substring(firstBrace, lastBrace + 1);
      console.log('[SILENT] Extracted JSON string length:', jsonString.length);

      // Step 3: Parse the extracted JSON
      const parsed = JSON.parse(jsonString);
      console.log('[SILENT] JSON parsed successfully');
      return parsed;
    } catch (error) {
      console.error('[SILENT] JSON parsing failed:', error.message);
      console.error('[SILENT] Raw data sample:', rawData.substring(0, 300));
      return null;
    }
  };

  const toggleExpand = (index) => {
    setExpandedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const toggleSelect = (index) => {
    setSelectedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // STEP 1: Generate text only (Claude) - Silent background fetch
  // CRITICAL: This function is 100% isolated from parent chat state
  const handleGenerate = async (e, index, item) => {
    e.preventDefault();
    e.stopPropagation();
    
    setGeneratingItems(prev => ({ ...prev, [index]: true }));
    setExpandedItems(prev => ({ ...prev, [index]: true }));

    try {
      // Get Cognito token
      const { fetchAuthSession } = await import('aws-amplify/auth');
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();

      if (!token) {
        throw new Error('No authentication token available');
      }

      // Construct prompt for text-only generation
      const prompt = `Crie apenas a legenda e hashtags para o post. Tema: ${item.theme}. Objetivo: ${item.objective}. Dia: ${item.day}. NÃO gere a imagem ainda.`;

      // CRITICAL: Direct HTTP POST - NO parent chat involvement
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: prompt,
          conversation_history: [],
          skip_image_generation: true, // Backend flag to skip Titan
          silent_mode: true // Don't save to chat history
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();

      // CRITICAL BUG FIX: Unpack the envelope FIRST
      // The API returns { response: "...", generated_content: {...}, ... }
      // We need to extract the STRING from responseData.response before parsing
      
      let postContent = null;
      
      // Option 1: Backend already parsed and returned structured data
      if (responseData.generated_content) {
        postContent = responseData.generated_content;
      } else if (responseData.post_content) {
        postContent = responseData.post_content;
      } else if (responseData.response && typeof responseData.response === 'string') {
        // Option 2: Backend returned JSON string in response field
        // CRITICAL: Extract the STRING first, then sanitize
        const responseString = responseData.response;
        const sanitized = sanitizeAndExtractJSON(responseString);
        
        if (sanitized && sanitized.post_content) {
          postContent = sanitized.post_content;
        } else if (sanitized && sanitized.generated_content) {
          postContent = sanitized.generated_content;
        }
      }

      if (!postContent) {
        console.error('[SILENT] Failed to extract post content. Response data:', responseData);
        throw new Error('Failed to extract post content from response');
      }

      // Store generated text with placeholder for image
      setGeneratedContent(prev => ({
        ...prev,
        [index]: {
          caption: postContent.caption || '',
          hashtags: postContent.hashtags || [],
          imageDescription: postContent.image_description || '',
          imageUrl: null, // No image yet - will be generated on demand
          hasImage: false
        }
      }));

      // Text generation complete

    } catch (error) {
      console.error('[SILENT] Error generating text:', error);
      
      setGeneratedContent(prev => ({
        ...prev,
        [index]: {
          caption: `❌ Erro ao gerar texto: ${error.message}`,
          hashtags: [],
          imageDescription: '',
          imageUrl: null,
          hasImage: false
        }
      }));
    } finally {
      setGeneratingItems(prev => ({ ...prev, [index]: false }));
    }
  };

  // STEP 2: Generate image only (Titan) - Lazy on-demand
  const handleGenerateImage = async (e, index, item) => {
    e.preventDefault();
    e.stopPropagation();
    
    const content = generatedContent[index];
    if (!content) {
      console.error('[SILENT] No generated content available');
      return;
    }

    // CRITICAL FALLBACK: If LLM omitted image_description, construct one dynamically
    const imageDescription = content.imageDescription || 
      `Uma imagem profissional, moderna e limpa para redes sociais ilustrando: ${item.theme} - ${item.objective}`;
    
    setGeneratingImages(prev => ({ ...prev, [index]: true }));

    try {
      const { fetchAuthSession } = await import('aws-amplify/auth');
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();

      if (!token) {
        throw new Error('No authentication token available');
      }

      // SILENT API CALL - Dedicated image generation endpoint
      const response = await fetch(`${API_URL}/chat/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          image_description: imageDescription,
          silent_mode: true
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();

      // CRITICAL: /chat/generate-image returns flat object (no envelope)
      // Response structure: { image_url: "...", message: "..." }
      if (!responseData.image_url) {
        throw new Error('No image_url in response');
      }

      // Update content with real image URL
      setGeneratedContent(prev => ({
        ...prev,
        [index]: {
          ...prev[index],
          imageUrl: responseData.image_url,
          hasImage: true
        }
      }));

      // Image generation complete

    } catch (error) {
      console.error('[SILENT] Error generating image:', error);
      
      // Show error but keep the text content
      setGeneratedContent(prev => ({
        ...prev,
        [index]: {
          ...prev[index],
          imageUrl: null,
          hasImage: false,
          imageError: error.message
        }
      }));
    } finally {
      setGeneratingImages(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleSchedule = (e, index, item) => {
    e.preventDefault();
    e.stopPropagation();
    // Internal notification - no parent involvement
    // TODO: Implement scheduling logic
  };

  const handlePublish = (e, index, item) => {
    e.preventDefault();
    e.stopPropagation();
    // Internal notification - no parent involvement
    // TODO: Implement publish logic
  };

  const handleImplementAll = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Internal notification - no parent involvement
    // TODO: Implement batch generation logic
  };

  // Calculate progress - only count posts with images as "ready"
  const totalPosts = planData.length;
  const readyPosts = Object.values(generatedContent).filter(content => content && content.hasImage).length;
  const progressPercent = totalPosts > 0 ? (readyPosts / totalPosts) * 100 : 0;

  // Day abbreviations
  const getDayAbbr = (day) => {
    const abbr = {
      'Segunda-feira': 'Seg',
      'Terça-feira': 'Ter',
      'Quarta-feira': 'Qua',
      'Quinta-feira': 'Qui',
      'Sexta-feira': 'Sex',
      'Sábado': 'Sáb',
      'Domingo': 'Dom'
    };
    return abbr[day] || day.substring(0, 3);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 p-4">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          <h3 className="text-sm font-semibold text-gray-900">Plano Semanal Experta</h3>
        </div>
        
        {/* Progress Info */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>{totalPosts} posts • {readyPosts} prontos</span>
          <span className="font-medium text-purple-600">{Math.round(progressPercent)}%</span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
          <div 
            className="bg-purple-600 h-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Plan Items List */}
      <div className="divide-y divide-gray-100">
        {planData.map((item, index) => (
          <div key={index} className="bg-white hover:bg-gray-50 transition-colors">
            {/* Row Header - Clickable - Compact */}
            <div 
              className="flex items-center gap-3 py-2 px-4 cursor-pointer"
              onClick={() => toggleExpand(index)}
            >
              {/* Day Badge - Simple Text */}
              <div className="flex-shrink-0 w-10 text-center">
                <span className="text-xs font-medium text-gray-500">{getDayAbbr(item.day)}</span>
              </div>
              
              {/* Content Info - Compact Typography */}
              <div className="flex-1 min-w-0 flex flex-col">
                <h4 className="text-sm font-medium text-gray-900 truncate">{item.theme}</h4>
                <p className="text-xs text-gray-500 truncate">{item.objective}</p>
              </div>

              {/* Actions & Expand Icon - Compact */}
              <div className="flex items-center gap-1">
                {/* Checkbox */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelect(index);
                  }}
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    selectedItems[index]
                      ? 'bg-purple-600 border-purple-600'
                      : 'border-gray-300 hover:border-purple-400'
                  }`}
                >
                  {selectedItems[index] && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                {/* Generate Button - Compact */}
                <button
                  type="button"
                  onClick={(e) => {
                    handleGenerate(e, index, item);
                  }}
                  disabled={generatingItems[index]}
                  className={`px-3 py-1.5 rounded-md transition-colors text-xs ${
                    generatedContent[index]
                      ? 'text-green-600 hover:bg-green-50'
                      : generatingItems[index]
                      ? 'text-purple-600 animate-pulse cursor-wait'
                      : 'text-gray-400 hover:text-purple-600 hover:bg-gray-50'
                  }`}
                  title="Gerar Post"
                >
                  {generatingItems[index] ? (
                    <svg className="animate-spin w-3 h-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : generatedContent[index] ? (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  )}
                </button>

                {/* Schedule Button - Compact */}
                <button
                  type="button"
                  onClick={(e) => {
                    handleSchedule(e, index, item);
                  }}
                  className="px-3 py-1.5 rounded-md text-gray-400 hover:text-purple-600 hover:bg-gray-50 transition-colors text-xs"
                  title="Agendar"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>

                {/* Expand/Collapse Icon */}
                <svg 
                  className={`w-3 h-3 text-gray-400 transition-transform ml-1 ${expandedItems[index] ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Expanded Content - Compact */}
            {expandedItems[index] && (
              <div className="px-3 pb-3 bg-gray-50">
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  {/* Loading State - Compact */}
                  {generatingItems[index] && (
                    <div className="flex flex-col items-center justify-center py-4">
                      <svg className="animate-spin h-5 w-5 text-purple-600 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="text-xs text-gray-600 font-medium">Gerando post...</p>
                      <p className="text-xs text-gray-400 mt-1">Criando conteúdo para {item.day}</p>
                    </div>
                  )}

                  {/* Generated Content - Two-Step Display */}
                  {!generatingItems[index] && generatedContent[index] && (
                    <div className="space-y-2">
                      {/* Image Area - Placeholder or Real Image */}
                      <div className="relative">
                        {generatedContent[index].hasImage ? (
                          // Real image from Titan
                          <>
                            <img 
                              src={generatedContent[index].imageUrl} 
                              alt={`Post para ${item.day}`}
                              className="w-full h-32 object-cover rounded-lg border border-gray-200"
                            />
                            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow-md">
                              ✓ Gerado
                            </div>
                          </>
                        ) : (
                          // Placeholder with "Gerar Imagem" button
                          <div className="w-full h-32 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                            {generatingImages[index] ? (
                              <div className="flex flex-col items-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="text-xs text-gray-600 font-medium">Gerando imagem...</span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  handleGenerateImage(e, index, item);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors text-sm font-medium shadow-sm"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                🎨 Gerar Imagem
                              </button>
                            )}
                          </div>
                        )}
                        {generatedContent[index].imageError && (
                          <div className="absolute bottom-2 left-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded shadow-md">
                            ⚠️ {generatedContent[index].imageError}
                          </div>
                        )}
                      </div>

                      {/* Generated Caption - Compact */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                          <span className="text-xs font-semibold text-gray-500 uppercase">Legenda</span>
                        </div>
                        <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {generatedContent[index].caption}
                        </p>
                        {generatedContent[index].hashtags && generatedContent[index].hashtags.length > 0 && (
                          <p className="text-xs text-purple-600 mt-1">
                            {generatedContent[index].hashtags.join(' ')}
                          </p>
                        )}
                      </div>

                      {/* Inline Action Buttons - Only show when image is ready */}
                      {generatedContent[index].hasImage && (
                        <div className="flex flex-col sm:flex-row gap-2 pt-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              handlePublish(e, index, item);
                            }}
                            className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium px-3 py-1.5 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-1 text-xs"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Publicar
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              handleSchedule(e, index, item);
                            }}
                            className="w-full sm:w-auto border border-purple-600 text-purple-600 font-medium px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-colors flex items-center justify-center gap-1 text-xs"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Agendar
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Empty State - Compact */}
                  {!generatingItems[index] && !generatedContent[index] && (
                    <div className="flex flex-col items-center justify-center py-4 text-center">
                      <svg className="w-8 h-8 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                      <p className="text-xs text-gray-500 font-medium mb-1">Post não gerado</p>
                      <p className="text-xs text-gray-400">Clique no ícone ✨ para gerar</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Master Action Button */}
      <div className="bg-white border-t border-gray-100 p-4">
        <button
          type="button"
          onClick={handleImplementAll}
          className="w-full border border-purple-600 text-purple-600 font-medium py-2 px-4 rounded-lg hover:bg-purple-50 transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          Implementar Plano (Gerar Todos)
        </button>
      </div>
    </div>
  );
};

export default ContentPlanCard;
