import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, RotateCcw, Eye, EyeOff, Trash2, Sparkles, Check, AlertCircle, Info, X, Image as ImageIcon } from 'lucide-react';

const BackgroundRemover = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOriginal, setShowOriginal] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target.result);
        setProcessedImage(null);
        setShowOriginal(true);
        setShowResult(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const removeBackground = async () => {
    if (!uploadedImage) return;
    
    setIsProcessing(true);
    
    // Simulate background removal processing
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    // In a real app, this would be the processed image with transparent background
    // For demo purposes, we'll use the same image but add a visual indicator
    setProcessedImage(uploadedImage);
    setShowResult(true);
    setIsProcessing(false);
  };

  const downloadImage = () => {
    if (processedImage) {
      const link = document.createElement('a');
      link.download = 'background-removed.png';
      link.href = processedImage;
      link.click();
    }
  };

  const resetAll = () => {
    setUploadedImage(null);
    setProcessedImage(null);
    setShowOriginal(true);
    setShowResult(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const copyToClipboard = async () => {
    if (processedImage) {
      // In a real app, this would copy the actual image
      // For demo, we'll just show the copied message
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${darkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <header className={`border-b ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Sparkles size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Background Remover
                </h1>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Remove backgrounds instantly with AI precision
                </p>
              </div>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              {darkMode ? <X size={20} /> : <Sparkles size={20} />}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Section */}
        {!uploadedImage && (
          <div className="text-center">
            <div 
              className={`border-2 border-dashed rounded-2xl p-12 cursor-pointer transition-all duration-300 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-gray-800 ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}
              onClick={triggerFileInput}
            >
              <Upload size={48} className={`mx-auto mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <h3 className="text-xl font-semibold mb-2">Upload Image to Remove Background</h3>
              <p className={`mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Drag & drop your image here or click to browse
              </p>
              <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Supports JPG, PNG (Max 10MB) • Transparent backgrounds supported
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        )}

        {/* Main Interface */}
        {uploadedImage && (
          <div className="space-y-6">
            {/* Controls */}
            <div className={`rounded-2xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={removeBackground}
                    disabled={isProcessing}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                      isProcessing 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : darkMode 
                          ? 'bg-purple-600 hover:bg-purple-700' 
                          : 'bg-purple-500 hover:bg-purple-600'
                    } text-white`}
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Removing Background...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        <span>Remove Background</span>
                      </>
                    )}
                  </button>
                  
                  {processedImage && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={copyToClipboard}
                        className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                      >
                        {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                      </button>
                      <button
                        onClick={downloadImage}
                        className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white`}
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={resetAll}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                    darkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'
                  } text-white`}
                >
                  <Trash2 size={16} />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Preview Section */}
            <div className={`rounded-2xl overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold flex items-center space-x-2">
                  <ImageIcon size={18} />
                  <span>Image Preview</span>
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowOriginal(!showOriginal)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                      showOriginal 
                        ? (darkMode ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white') 
                        : (darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200')
                    }`}
                  >
                    {showOriginal ? <Eye size={14} /> : <EyeOff size={14} />}
                    <span>Original</span>
                  </button>
                  <button
                    onClick={() => setShowResult(!showResult)}
                    disabled={!processedImage}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                      !processedImage 
                        ? 'opacity-50 cursor-not-allowed' 
                        : showResult 
                          ? (darkMode ? 'bg-green-600 text-white' : 'bg-green-500 text-white') 
                          : (darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200')
                    }`}
                  >
                    {showResult ? <Eye size={14} /> : <EyeOff size={14} />}
                    <span>Result</span>
                  </button>
                </div>
              </div>
              
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Original Image */}
                  {showOriginal && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-center">Original</h4>
                      <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4 flex items-center justify-center min-h-64">
                        <img 
                          src={uploadedImage} 
                          alt="Original" 
                          className="max-w-full max-h-64 object-contain rounded-lg"
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Processed Image */}
                  {showResult && processedImage && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-center">Background Removed</h4>
                      <div className="bg-gradient-to-br from-purple-400 via-pink-400 to-red-400 rounded-lg p-4 flex items-center justify-center min-h-64">
                        <img 
                          src={processedImage} 
                          alt="Processed" 
                          className="max-w-full max-h-64 object-contain rounded-lg"
                          style={{ backgroundColor: 'transparent' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Single View */}
                {!showOriginal && !showResult && (
                  <div className="text-center py-12">
                    <Info size={48} className={`mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Select "Original" or "Result" to view the image
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <Sparkles size={16} className="text-white" />
                  </div>
                  <h4 className="font-semibold">AI-Powered</h4>
                </div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Advanced AI detects and removes backgrounds with pixel-perfect accuracy
                </p>
              </div>
              
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <Check size={16} className="text-white" />
                  </div>
                  <h4 className="font-semibold">Instant Results</h4>
                </div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Get background-free images in seconds, no waiting required
                </p>
              </div>
              
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Download size={16} className="text-white" />
                  </div>
                  <h4 className="font-semibold">Export Ready</h4>
                </div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Download in PNG format with transparent background, ready for any project
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <Info size={14} />
            <span className="text-sm">
              Powered by AI • Supports all image formats • 100% free
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackgroundRemover;