import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Copy, Download, Save, Eye, Edit3, ChevronDown, ChevronUp } from 'lucide-react';

const QuizConfigEditor = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');
  
  const [treeTypes, setTreeTypes] = useState({
    oak: {
      name: 'Mighty Oak',
      icon: '🌳',
      description: 'Strong, reliable, and a natural leader. You stand tall and provide shelter for others!',
      trait: 'Strength & Leadership',
      color: '#8B4513'
    },
    willow: {
      name: 'Graceful Willow',
      icon: '🌿',
      description: 'Flexible, creative, and adaptable. You flow with life\'s changes beautifully!',
      trait: 'Adaptability & Creativity',
      color: '#90EE90'
    },
    cherry: {
      name: 'Cherry Blossom',
      icon: '🌸',
      description: 'Gentle, loving, and nurturing. You bring beauty and warmth to everyone around you!',
      trait: 'Compassion & Beauty',
      color: '#FFB6C1'
    },
    pine: {
      name: 'Evergreen Pine',
      icon: '🌲',
      description: 'Consistent, peaceful, and enduring. You\'re the calm in every storm!',
      trait: 'Stability & Wisdom',
      color: '#228B22'
    }
  });

  const [questions, setQuestions] = useState([
    {
      id: 'morning',
      question: "What's your ideal morning routine?",
      headerEmoji: '🌅',
      options: [
        { treeType: 'oak', label: 'Early bird - Up with the sun!', emoji: '☀️', description: 'I wake up energized and ready to conquer the day' },
        { treeType: 'willow', label: 'Go with the flow - Wake up naturally', emoji: '🌊', description: 'I let my body tell me when it\'s time to rise' },
        { treeType: 'cherry', label: 'Slow and sweet - Coffee & dreams', emoji: '🌸', description: 'I savor my morning with warmth and comfort' },
        { treeType: 'pine', label: 'Consistent - Same time every day', emoji: '🏔️', description: 'I value routine and predictability' }
      ]
    }
  ]);

  const [calculationMethod, setCalculationMethod] = useState('mostFrequent');
  const [activeTab, setActiveTab] = useState('trees');
  const [expandedQuestion, setExpandedQuestion] = useState(0);
  const [previewMode, setPreviewMode] = useState(false);

  // Load saved data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await localStorage.getItem('quiz-config-data');
        if (result && result.value) {
          const data = JSON.parse(result.value);
          if (data.treeTypes) setTreeTypes(data.treeTypes);
          if (data.questions) setQuestions(data.questions);
          if (data.calculationMethod) setCalculationMethod(data.calculationMethod);
          setSaveStatus('Loaded previous work ✓');
          setTimeout(() => setSaveStatus(''), 3000);
        }
      } catch (error) {
        console.log('No previous data found');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Auto-save whenever data changes
  useEffect(() => {
    if (isLoading) return; // Don't save during initial load
    
    const saveData = async () => {
      try {
        const data = {
          treeTypes,
          questions,
          calculationMethod,
          lastSaved: new Date().toISOString()
        };
        await localStorage.setItem('quiz-config-data', JSON.stringify(data));
        setSaveStatus('Auto-saved ✓');
        setTimeout(() => setSaveStatus(''), 2000);
      } catch (error) {
        console.error('Save failed:', error);
        setSaveStatus('Save failed ✗');
      }
    };

    const timeoutId = setTimeout(saveData, 1000); // Debounce saves
    return () => clearTimeout(timeoutId);
  }, [treeTypes, questions, calculationMethod, isLoading]);

  // Tree Type Management
  const addTreeType = () => {
    const newId = `tree_${Date.now()}`;
    setTreeTypes({
      ...treeTypes,
      [newId]: {
        name: 'New Tree',
        icon: '🌳',
        description: 'Description here',
        trait: 'Trait here',
        color: '#808080'
      }
    });
  };

  const updateTreeType = (id, field, value) => {
    setTreeTypes({
      ...treeTypes,
      [id]: { ...treeTypes[id], [field]: value }
    });
  };

  const updateTreeTypeId = (oldId, newId) => {
    if (newId === oldId || !newId || treeTypes[newId]) return;
    
    const newTrees = {};
    Object.keys(treeTypes).forEach(key => {
      if (key === oldId) {
        newTrees[newId] = treeTypes[oldId];
      } else {
        newTrees[key] = treeTypes[key];
      }
    });
    
    // Update all question options that reference the old ID
    const updatedQuestions = questions.map(q => ({
      ...q,
      options: q.options.map(opt => 
        opt.treeType === oldId ? { ...opt, treeType: newId } : opt
      )
    }));
    
    setTreeTypes(newTrees);
    setQuestions(updatedQuestions);
  };

  const deleteTreeType = (id) => {
    const newTrees = { ...treeTypes };
    delete newTrees[id];
    setTreeTypes(newTrees);
  };

  // Question Management
  const addQuestion = () => {
    const treeIds = Object.keys(treeTypes);
    setQuestions([
      ...questions,
      {
        id: `question_${Date.now()}`,
        question: 'Your question here?',
        headerEmoji: '❓',
        options: treeIds.map(treeId => ({
          treeType: treeId,
          label: 'Option label',
          emoji: '✨',
          description: 'Option description'
        }))
      }
    ]);
  };

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const updateOption = (questionIndex, optionIndex, field, value) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex] = {
      ...newQuestions[questionIndex].options[optionIndex],
      [field]: value
    };
    setQuestions(newQuestions);
  };

  const deleteQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  // Generate Config Code
  const generateConfig = () => {
    const config = {
      treeTypes,
      questions,
      calculationMethod
    };
    return `export const QUIZ_CONFIG = ${JSON.stringify(config, null, 2)};`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateConfig());
    alert('Configuration copied to clipboard! Paste it into your QUIZ_CONFIG.js file.');
  };

  const downloadConfig = () => {
    const blob = new Blob([generateConfig()], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'QUIZ_CONFIG.js';
    a.click();
  };

  const clearAllData = async () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      try {
        await localStorage.removeItem('quiz-config-data');
        window.location.reload();
      } catch (error) {
        console.error('Clear failed:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-2xl font-semibold text-gray-600">Loading your work...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-40">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">🌳 Quiz Configuration Editor</h1>
              <p className="text-gray-600">No coding required - Build your personality quiz visually!</p>
              {saveStatus && (
                <p className="text-sm text-green-600 mt-1 font-medium">{saveStatus}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
              >
                <Eye size={20} />
                {previewMode ? 'Edit' : 'Preview'}
              </button>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                <Copy size={20} />
                Copy Code
              </button>
              <button
                onClick={downloadConfig}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
              >
                <Download size={20} />
                Download
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b">
            <button
              onClick={() => setActiveTab('trees')}
              className={`px-6 py-3 font-semibold transition ${
                activeTab === 'trees'
                  ? 'border-b-2 border-green-500 text-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              🌳 Tree Types ({Object.keys(treeTypes).length})
            </button>
            <button
              onClick={() => setActiveTab('questions')}
              className={`px-6 py-3 font-semibold transition ${
                activeTab === 'questions'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              ❓ Questions ({questions.length})
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-3 font-semibold transition ${
                activeTab === 'settings'
                  ? 'border-b-2 border-purple-500 text-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              ⚙️ Settings
            </button>
          </div>
        </div>

        {/* Content */}
        {!previewMode ? (
          <div>
            {/* Tree Types Tab */}
            {activeTab === 'trees' && (
              <div className="space-y-4">
                <button
                  onClick={addTreeType}
                  className="w-full flex items-center justify-center gap-2 p-4 bg-white rounded-xl border-2 border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50 transition"
                >
                  <Plus size={24} />
                  <span className="font-semibold">Add New Tree Type</span>
                </button>

                {Object.entries(treeTypes).map(([id, tree]) => (
                  <div key={id} className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={tree.icon}
                          onChange={(e) => updateTreeType(id, 'icon', e.target.value)}
                          className="text-4xl w-16 text-center"
                          placeholder="🌳"
                        />
                        <div>
                          <input
                            type="text"
                            value={tree.name}
                            onChange={(e) => updateTreeType(id, 'name', e.target.value)}
                            className="text-2xl font-bold border-b-2 border-transparent hover:border-gray-300 focus:border-green-500 outline-none px-2"
                            placeholder="Tree Name"
                          />
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-gray-500">ID:</span>
                            <input
                              type="text"
                              value={id}
                              onChange={(e) => updateTreeTypeId(id, e.target.value)}
                              className="text-sm bg-gray-100 px-2 py-1 rounded font-mono border border-transparent hover:border-gray-300 focus:border-green-500 outline-none"
                              placeholder="tree_id"
                            />
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteTreeType(id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Trait</label>
                        <input
                          type="text"
                          value={tree.trait}
                          onChange={(e) => updateTreeType(id, 'trait', e.target.value)}
                          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                          placeholder="Main trait"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          value={tree.description}
                          onChange={(e) => updateTreeType(id, 'description', e.target.value)}
                          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                          rows="3"
                          placeholder="Personality description"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={tree.color}
                            onChange={(e) => updateTreeType(id, 'color', e.target.value)}
                            className="w-16 h-10 rounded-lg cursor-pointer"
                          />
                          <input
                            type="text"
                            value={tree.color}
                            onChange={(e) => updateTreeType(id, 'color', e.target.value)}
                            className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                            placeholder="#000000"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Questions Tab */}
            {activeTab === 'questions' && (
              <div className="space-y-4">
                <button
                  onClick={addQuestion}
                  className="w-full flex items-center justify-center gap-2 p-4 bg-white rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition"
                >
                  <Plus size={24} />
                  <span className="font-semibold">Add New Question</span>
                </button>

                {questions.map((question, qIndex) => (
                  <div key={qIndex} className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div
                      onClick={() => setExpandedQuestion(expandedQuestion === qIndex ? -1 : qIndex)}
                      className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{question.headerEmoji}</span>
                        <div>
                          <div className="font-bold text-lg">{question.question}</div>
                          <div className="text-sm text-gray-500">{question.options.length} options</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteQuestion(qIndex);
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 size={20} />
                        </button>
                        {expandedQuestion === qIndex ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>

                    {expandedQuestion === qIndex && (
                      <div className="p-6 border-t bg-gray-50 space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Question ID</label>
                            <input
                              type="text"
                              value={question.id}
                              onChange={(e) => updateQuestion(qIndex, 'id', e.target.value)}
                              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                              placeholder="question_id"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                            <input
                              type="text"
                              value={question.question}
                              onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Header Emoji</label>
                            <input
                              type="text"
                              value={question.headerEmoji}
                              onChange={(e) => updateQuestion(qIndex, 'headerEmoji', e.target.value)}
                              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-2xl text-center"
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="font-semibold text-gray-700">Options:</div>
                          {question.options.map((option, oIndex) => (
                            <div key={oIndex} className="bg-white p-4 rounded-lg border space-y-2">
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Tree Type</label>
                                  <select
                                    value={option.treeType}
                                    onChange={(e) => updateOption(qIndex, oIndex, 'treeType', e.target.value)}
                                    className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                  >
                                    {Object.entries(treeTypes).map(([id, tree]) => (
                                      <option key={id} value={id}>
                                        {tree.icon} {tree.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Emoji</label>
                                  <input
                                    type="text"
                                    value={option.emoji}
                                    onChange={(e) => updateOption(qIndex, oIndex, 'emoji', e.target.value)}
                                    className="w-full p-2 border rounded-lg text-center text-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Label</label>
                                  <input
                                    type="text"
                                    value={option.label}
                                    onChange={(e) => updateOption(qIndex, oIndex, 'label', e.target.value)}
                                    className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Description</label>
                                <input
                                  type="text"
                                  value={option.description}
                                  onChange={(e) => updateOption(qIndex, oIndex, 'description', e.target.value)}
                                  className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
                <div>
                  <label className="block text-lg font-semibold text-gray-800 mb-3">Calculation Method</label>
                  <select
                    value={calculationMethod}
                    onChange={(e) => setCalculationMethod(e.target.value)}
                    className="w-full p-3 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    <option value="mostFrequent">Most Frequent - Tree chosen most often wins</option>
                    <option value="weighted">Weighted - Some questions matter more</option>
                    <option value="priority">Priority - First matching question wins</option>
                    <option value="custom">Custom - Advanced scoring logic</option>
                    <option value="threshold">Threshold - Minimum answers required</option>
                  </select>
                  <p className="mt-2 text-sm text-gray-600">
                    This determines how the final tree personality is calculated from user answers.
                  </p>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-800 mb-3">Summary</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-3xl font-bold text-green-600">{Object.keys(treeTypes).length}</div>
                      <div className="text-sm text-gray-600">Tree Types</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600">{questions.length}</div>
                      <div className="text-sm text-gray-600">Questions</div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-800 mb-3">Data Management</h3>
                  <button
                    onClick={clearAllData}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                  >
                    <Trash2 size={20} />
                    Clear All Data & Reset
                  </button>
                  <p className="mt-2 text-sm text-gray-600">
                    Your work is automatically saved. Click to clear everything and start fresh.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Preview Mode</h2>
            <p className="text-gray-600 mb-6">This shows how your quiz configuration looks:</p>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
              {generateConfig()}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizConfigEditor;