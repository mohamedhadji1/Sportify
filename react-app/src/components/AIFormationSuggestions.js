import React, { useState } from 'react';

const AIFormationSuggestions = ({ 
  selectedPlayers, 
  formations, 
  selectedFormation, 
  onFormationSelect, 
  teamStyle, 
  onTeamStyleChange, 
  useAI, 
  onToggleAI 
}) => {
  const [showInsights, setShowInsights] = useState({});

  const toggleInsights = (formationName) => {
    setShowInsights(prev => ({
      ...prev,
      [formationName]: !prev[formationName]
    }));
  };

  const getStyleIcon = (style) => {
    switch (style) {
      case 'attacking': return '⚡';
      case 'defensive': return '🛡️';
      case 'balanced': return '⚖️';
      default: return '⚽';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'text-green-400';
    if (confidence >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getConfidenceText = (confidence) => {
    if (confidence >= 80) return 'Excellent';
    if (confidence >= 60) return 'Good';
    return 'Fair';
  };

  return (
    <div className="space-y-4">
      {/* AI Controls */}
      <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-neutral-300 flex items-center gap-2">
            🤖 AI Formation Assistant
            <button
              onClick={onToggleAI}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                useAI 
                  ? 'bg-sky-500 text-white' 
                  : 'bg-neutral-600 text-neutral-300 hover:bg-neutral-500'
              }`}
            >
              {useAI ? 'ON' : 'OFF'}
            </button>
          </h4>
        </div>

        {useAI && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-neutral-400 mb-2">Team Playing Style</label>
              <div className="flex gap-2">
                {['attacking', 'balanced', 'defensive'].map((style) => (
                  <button
                    key={style}
                    onClick={() => onTeamStyleChange(style)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                      teamStyle === style
                        ? 'bg-sky-500 text-white'
                        : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                    }`}
                  >
                    {getStyleIcon(style)}
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {selectedPlayers.length > 0 && (
              <div className="text-xs text-neutral-400">
                Analyzing {selectedPlayers.length} players for optimal formation...
              </div>
            )}
          </div>
        )}
      </div>

      {/* Formation Suggestions */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-neutral-300 mb-3">
          {useAI ? 'AI Recommendations' : 'Formation Suggestions'}
        </h4>
        
        {formations.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-neutral-500 text-sm">
              {selectedPlayers.length < 5 
                ? `Add ${5 - selectedPlayers.length} more players to see formations`
                : selectedPlayers.length > 6
                ? 'Too many players for predefined formations'
                : 'No formations available'
              }
            </p>
          </div>
        ) : (
          formations.map((formation, index) => (
            <div
              key={index}
              className={`formation-card p-3 rounded-lg border transition-all cursor-pointer ${
                selectedFormation === formation.name
                  ? 'border-sky-400 bg-sky-500/10'
                  : 'border-neutral-600 bg-neutral-700 hover:border-neutral-500'
              }`}
              onClick={() => onFormationSelect(formation)}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <h5 className="text-white font-medium">{formation.name}</h5>
                  {formation.isAIRecommended && (
                    <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full">
                      AI
                    </span>
                  )}
                  {index === 0 && useAI && formations[0].isAIRecommended && (
                    <span className="text-xs bg-yellow-500 text-black px-2 py-0.5 rounded-full font-medium">
                      BEST
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {formation.confidence && (
                    <span className={`text-xs font-medium ${getConfidenceColor(formation.confidence)}`}>
                      {formation.confidence}% {getConfidenceText(formation.confidence)}
                    </span>
                  )}
                  {selectedFormation === formation.name && (
                    <svg className="h-4 w-4 text-sky-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>

              <p className="text-neutral-400 text-xs mb-2">{formation.description}</p>

              {/* AI Recommendation Text */}
              {formation.recommendation && (
                <p className="text-sky-300 text-xs mb-2 italic">
                  💡 {formation.recommendation}
                </p>
              )}

              {/* Position Tags */}
              <div className="flex flex-wrap gap-1 mb-2">
                {formation.positions.map((pos, idx) => (
                  <span key={idx} className="text-xs px-2 py-1 bg-neutral-600 rounded text-neutral-300">
                    {pos}
                  </span>
                ))}
              </div>

              {/* AI Insights Toggle */}
              {formation.aiInsights && formation.aiInsights.length > 0 && (
                <div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleInsights(formation.name);
                    }}
                    className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1"
                  >
                    <span>AI Insights</span>
                    <svg 
                      className={`h-3 w-3 transition-transform ${showInsights[formation.name] ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showInsights[formation.name] && (
                    <div className="mt-2 space-y-1">
                      {formation.aiInsights.map((insight, idx) => (
                        <div key={idx} className="text-xs text-neutral-300 bg-neutral-800 rounded px-2 py-1">
                          {insight}
                        </div>
                      ))}
                      
                      {/* Detailed Metrics */}
                      {formation.chemistry !== undefined && (
                        <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                          <div className="text-center">
                            <div className="text-neutral-400">Chemistry</div>
                            <div className={getConfidenceColor(Math.round(formation.chemistry * 100))}>
                              {Math.round(formation.chemistry * 100)}%
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-neutral-400">Tactical Fit</div>
                            <div className={getConfidenceColor(Math.round(formation.tacticalFit * 100))}>
                              {Math.round(formation.tacticalFit * 100)}%
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-neutral-400">Coverage</div>
                            <div className={getConfidenceColor(Math.round(formation.positionCoverage * 100))}>
                              {Math.round(formation.positionCoverage * 100)}%
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* AI Tips */}
      {useAI && selectedPlayers.length > 0 && (
        <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <span className="text-purple-400 text-sm">🧠</span>
            <div className="text-xs text-purple-200">
              <div className="font-medium mb-1">AI Tips:</div>
              <ul className="space-y-1 text-purple-300">
                <li>• Higher chemistry means better player coordination</li>
                <li>• Match your formation to your preferred playing style</li>
                <li>• Consider player positions when selecting formations</li>
                <li>• The "BEST" formation is optimized for your current squad</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIFormationSuggestions;