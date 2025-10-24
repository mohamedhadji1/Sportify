import React from 'react';

const FormationSelector = ({ 
  formations, 
  selectedFormation, 
  onFormationSelect,
  playerCount,
  useAI = false,
  teamStyle = 'balanced'
}) => {
  console.log('FormationSelector props:', { formations, selectedFormation, playerCount });
  
  if (formations.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-neutral-500 text-sm">
          {playerCount === 0 
            ? 'Add players to see formations'
            : playerCount < 5 
            ? `Add ${5 - playerCount} more players to see formations`
            : playerCount > 7
            ? 'Too many players for predefined formations'
            : 'No formations available'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {formations.map((formation, index) => (
        <div
          key={index}
          className={`formation-card p-3 rounded-lg border transition-all cursor-pointer ${
            selectedFormation === formation.name
              ? 'border-sky-400 bg-sky-500/10'
              : 'border-neutral-600 bg-neutral-700 hover:border-neutral-500'
          }`}
          onClick={() => {
            console.log('FormationSelector - Formation clicked:', formation);
            onFormationSelect(formation);
          }}
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <h5 className="text-white font-medium">{formation.name}</h5>
              {formation.isAIRecommended && (
                <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-1.5 py-0.5 rounded-full">
                  AI
                </span>
              )}
              {index === 0 && useAI && formation.isAIRecommended && (
                <span className="text-xs bg-yellow-500 text-black px-1.5 py-0.5 rounded-full font-medium">
                  BEST
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {formation.confidence && (
                <span className={`text-xs font-medium ${
                  formation.confidence >= 80 ? 'text-green-400' : 
                  formation.confidence >= 60 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {formation.confidence}%
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

          {/* AI Recommendation */}
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

          {/* AI Insights */}
          {formation.aiInsights && formation.aiInsights.length > 0 && (
            <div className="space-y-1">
              {formation.aiInsights.slice(0, 2).map((insight, idx) => (
                <div key={idx} className="text-xs text-sky-300">
                  {insight}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default FormationSelector;
