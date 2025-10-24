/**
 * AI-Powered Formation Engine
 * Analyzes player attributes and suggests optimal formations
 */

// Player position compatibility matrix
const POSITION_COMPATIBILITY = {
  'GK': { 'GK': 1.0, 'DEF': 0.1, 'MID': 0.0, 'ATT': 0.0 },
  'DEF': { 'GK': 0.2, 'DEF': 1.0, 'MID': 0.7, 'ATT': 0.3 },
  'MID': { 'GK': 0.1, 'DEF': 0.6, 'MID': 1.0, 'ATT': 0.8 },
  'ATT': { 'GK': 0.0, 'DEF': 0.2, 'MID': 0.7, 'ATT': 1.0 }
};

// Formation tactical analysis
const FORMATION_TACTICS = {
  '1-2-2': {
    style: 'Balanced',
    strengths: ['Quick transitions', 'Compact defense'],
    weaknesses: ['Limited midfield control'],
    suitability: { attacking: 0.7, defensive: 0.8, balanced: 0.9 }
  },
  '1-3-1': {
    style: 'Defensive',
    strengths: ['Strong midfield', 'Ball control'],
    weaknesses: ['Limited attacking options'],
    suitability: { attacking: 0.5, defensive: 0.9, balanced: 0.7 }
  },
  '1-1-3': {
    style: 'Attacking',
    strengths: ['High pressure', 'Multiple scoring threats'],
    weaknesses: ['Vulnerable defense'],
    suitability: { attacking: 1.0, defensive: 0.4, balanced: 0.6 }
  },
  '1-2-3': {
    style: 'Attacking',
    strengths: ['Wide attacking play', 'Overload in final third'],
    weaknesses: ['Exposed flanks'],
    suitability: { attacking: 0.9, defensive: 0.5, balanced: 0.7 }
  },
  '1-3-2': {
    style: 'Balanced',
    strengths: ['Midfield dominance', 'Flexible transitions'],
    weaknesses: ['Requires versatile midfielders'],
    suitability: { attacking: 0.8, defensive: 0.7, balanced: 0.9 }
  },
  '1-4-1': {
    style: 'Ultra Defensive',
    strengths: ['Solid defensive block', 'Counter-attacking'],
    weaknesses: ['Limited creativity'],
    suitability: { attacking: 0.3, defensive: 1.0, balanced: 0.5 }
  }
};

/**
 * Analyzes player attributes and returns a skill profile
 */
export const analyzePlayerProfile = (player) => {
  const profile = {
    attacking: 0,
    defensive: 0,
    technical: 0,
    physical: 0,
    versatility: 0
  };

  // Analyze based on preferred position
  const position = player.position || player.preferredPosition || 'MID';
  
  switch (position.toUpperCase()) {
    case 'GK':
    case 'GOALKEEPER':
      profile.defensive = 0.9;
      profile.technical = 0.6;
      profile.physical = 0.7;
      profile.versatility = 0.2;
      break;
    case 'DEF':
    case 'DEFENDER':
    case 'CB':
    case 'LB':
    case 'RB':
      profile.defensive = 0.8;
      profile.attacking = 0.3;
      profile.technical = 0.6;
      profile.physical = 0.8;
      profile.versatility = 0.6;
      break;
    case 'MID':
    case 'MIDFIELDER':
    case 'CM':
    case 'CDM':
    case 'CAM':
      profile.defensive = 0.6;
      profile.attacking = 0.7;
      profile.technical = 0.9;
      profile.physical = 0.6;
      profile.versatility = 0.9;
      break;
    case 'ATT':
    case 'ATTACKER':
    case 'FW':
    case 'ST':
    case 'LW':
    case 'RW':
      profile.attacking = 0.9;
      profile.defensive = 0.2;
      profile.technical = 0.8;
      profile.physical = 0.7;
      profile.versatility = 0.5;
      break;
    default:
      // Default balanced profile
      profile.attacking = 0.6;
      profile.defensive = 0.6;
      profile.technical = 0.7;
      profile.physical = 0.6;
      profile.versatility = 0.7;
  }

  // Add some randomness based on player name hash for consistency
  const nameHash = player.fullName ? 
    player.fullName.split('').reduce((a, b) => a + b.charCodeAt(0), 0) : 0;
  const variance = (nameHash % 20 - 10) / 100; // -0.1 to +0.1
  
  Object.keys(profile).forEach(key => {
    profile[key] = Math.max(0, Math.min(1, profile[key] + variance));
  });

  return profile;
};

/**
 * Calculates team chemistry based on player compatibility
 */
export const calculateTeamChemistry = (players, formation) => {
  if (!players || players.length === 0) return 0;

  const formationPositions = getFormationPositions(formation);
  let totalChemistry = 0;
  let connections = 0;

  players.forEach((player, index) => {
    const playerProfile = analyzePlayerProfile(player);
    const assignedPosition = formationPositions[index]?.position || 'MID';
    const playerPosition = (player.position || 'MID').toUpperCase();
    
    // Position compatibility score
    const positionFit = POSITION_COMPATIBILITY[playerPosition]?.[assignedPosition] || 0.5;
    totalChemistry += positionFit;
    connections++;

    // Adjacent player chemistry (simplified)
    players.forEach((otherPlayer, otherIndex) => {
      if (index !== otherIndex && Math.abs(index - otherIndex) === 1) {
        const otherProfile = analyzePlayerProfile(otherPlayer);
        const synergy = calculatePlayerSynergy(playerProfile, otherProfile);
        totalChemistry += synergy * 0.3; // Weight adjacent connections less
        connections++;
      }
    });
  });

  return connections > 0 ? totalChemistry / connections : 0;
};

/**
 * Calculates synergy between two players
 */
const calculatePlayerSynergy = (profile1, profile2) => {
  // Complementary skills create better synergy
  const attackDefenseBalance = Math.abs(profile1.attacking - profile2.defensive) < 0.3 ? 0.8 : 0.5;
  const technicalMatch = 1 - Math.abs(profile1.technical - profile2.technical) * 0.5;
  const versatilityBonus = (profile1.versatility + profile2.versatility) * 0.3;
  
  return (attackDefenseBalance + technicalMatch + versatilityBonus) / 3;
};

/**
 * Gets formation positions for analysis
 */
const getFormationPositions = (formation) => {
  const positions = {
    '1-2-2': [
      { position: 'GK' }, { position: 'DEF' }, { position: 'DEF' }, 
      { position: 'ATT' }, { position: 'ATT' }
    ],
    '1-3-1': [
      { position: 'GK' }, { position: 'MID' }, { position: 'MID' }, 
      { position: 'MID' }, { position: 'ATT' }
    ],
    '1-1-3': [
      { position: 'GK' }, { position: 'DEF' }, { position: 'ATT' }, 
      { position: 'ATT' }, { position: 'ATT' }
    ],
    '1-2-3': [
      { position: 'GK' }, { position: 'DEF' }, { position: 'DEF' }, 
      { position: 'ATT' }, { position: 'ATT' }, { position: 'ATT' }
    ],
    '1-3-2': [
      { position: 'GK' }, { position: 'MID' }, { position: 'MID' }, 
      { position: 'MID' }, { position: 'ATT' }, { position: 'ATT' }
    ],
    '1-4-1': [
      { position: 'GK' }, { position: 'MID' }, { position: 'MID' }, 
      { position: 'MID' }, { position: 'MID' }, { position: 'ATT' }
    ]
  };
  return positions[formation] || [];
};

/**
 * AI-powered formation recommendation engine
 */
export const getAIFormationRecommendations = (players, teamStyle = 'balanced') => {
  console.log('AI Engine called with:', { players: players?.length, teamStyle });
  
  if (!players || players.length === 0) {
    console.log('AI Engine: No players provided');
    return [];
  }

  const playerCount = players.length;
  const availableFormations = getAvailableFormations(playerCount);
  console.log('AI Engine: Available formations:', availableFormations.length);
  
  if (availableFormations.length === 0) {
    return [];
  }

  // Analyze team composition
  const teamProfile = analyzeTeamComposition(players);
  
  // Score each formation
  const scoredFormations = availableFormations.map(formation => {
    const chemistry = calculateTeamChemistry(players, formation.name);
    const tacticalFit = calculateTacticalFit(formation.name, teamProfile, teamStyle);
    const positionCoverage = calculatePositionCoverage(players, formation.name);
    
    // Weighted scoring
    const totalScore = (
      chemistry * 0.4 +           // 40% chemistry
      tacticalFit * 0.35 +        // 35% tactical fit
      positionCoverage * 0.25     // 25% position coverage
    );

    return {
      ...formation,
      aiScore: totalScore,
      chemistry: chemistry,
      tacticalFit: tacticalFit,
      positionCoverage: positionCoverage,
      recommendation: generateRecommendationText(formation.name, teamProfile, totalScore),
      aiInsights: generateAIInsights(formation.name, teamProfile, chemistry, tacticalFit)
    };
  });

  // Sort by AI score and return top recommendations
  return scoredFormations
    .sort((a, b) => b.aiScore - a.aiScore)
    .map(formation => ({
      ...formation,
      confidence: Math.round(formation.aiScore * 100),
      isAIRecommended: true
    }));
};

/**
 * Analyzes overall team composition
 */
const analyzeTeamComposition = (players) => {
  const profiles = players.map(analyzePlayerProfile);
  
  return {
    avgAttacking: profiles.reduce((sum, p) => sum + p.attacking, 0) / profiles.length,
    avgDefensive: profiles.reduce((sum, p) => sum + p.defensive, 0) / profiles.length,
    avgTechnical: profiles.reduce((sum, p) => sum + p.technical, 0) / profiles.length,
    avgPhysical: profiles.reduce((sum, p) => sum + p.physical, 0) / profiles.length,
    avgVersatility: profiles.reduce((sum, p) => sum + p.versatility, 0) / profiles.length,
    positionDistribution: getPositionDistribution(players)
  };
};

/**
 * Gets position distribution of players
 */
const getPositionDistribution = (players) => {
  const distribution = { GK: 0, DEF: 0, MID: 0, ATT: 0 };
  
  players.forEach(player => {
    const pos = (player.position || 'MID').toUpperCase();
    if (pos.includes('GK') || pos.includes('GOALKEEPER')) {
      distribution.GK++;
    } else if (pos.includes('DEF') || pos.includes('CB') || pos.includes('LB') || pos.includes('RB')) {
      distribution.DEF++;
    } else if (pos.includes('ATT') || pos.includes('FW') || pos.includes('ST') || pos.includes('LW') || pos.includes('RW')) {
      distribution.ATT++;
    } else {
      distribution.MID++;
    }
  });
  
  return distribution;
};

/**
 * Calculates how well a formation fits the team's tactical style
 */
const calculateTacticalFit = (formation, teamProfile, preferredStyle) => {
  const formationTactics = FORMATION_TACTICS[formation];
  if (!formationTactics) return 0.5;

  const styleFit = formationTactics.suitability[preferredStyle] || 0.5;
  
  // Adjust based on team profile
  let profileFit = 0.5;
  if (preferredStyle === 'attacking' && teamProfile.avgAttacking > 0.7) {
    profileFit = 0.8;
  } else if (preferredStyle === 'defensive' && teamProfile.avgDefensive > 0.7) {
    profileFit = 0.8;
  } else if (preferredStyle === 'balanced' && teamProfile.avgVersatility > 0.7) {
    profileFit = 0.8;
  }

  return (styleFit + profileFit) / 2;
};

/**
 * Calculates how well players cover required positions
 */
const calculatePositionCoverage = (players, formation) => {
  const requiredPositions = getFormationPositions(formation);
  const playerPositions = players.map(p => (p.position || 'MID').toUpperCase());
  
  let coverage = 0;
  requiredPositions.forEach(req => {
    const bestFit = Math.max(...playerPositions.map(playerPos => 
      POSITION_COMPATIBILITY[playerPos]?.[req.position] || 0
    ));
    coverage += bestFit;
  });
  
  return requiredPositions.length > 0 ? coverage / requiredPositions.length : 0;
};

/**
 * Gets available formations for player count
 */
const getAvailableFormations = (playerCount) => {
  const formations = {
    5: [
      { name: '1-2-2', description: '1 GK, 2 DEF, 2 ATT', positions: ['GK', 'DEF', 'DEF', 'ATT', 'ATT'] },
      { name: '1-3-1', description: '1 GK, 3 MID, 1 ATT', positions: ['GK', 'MID', 'MID', 'MID', 'ATT'] },
      { name: '1-1-3', description: '1 GK, 1 DEF, 3 ATT', positions: ['GK', 'DEF', 'ATT', 'ATT', 'ATT'] }
    ],
    6: [
      { name: '1-2-3', description: '1 GK, 2 DEF, 3 ATT', positions: ['GK', 'DEF', 'DEF', 'ATT', 'ATT', 'ATT'] },
      { name: '1-3-2', description: '1 GK, 3 MID, 2 ATT', positions: ['GK', 'MID', 'MID', 'MID', 'ATT', 'ATT'] },
      { name: '1-4-1', description: '1 GK, 4 MID, 1 ATT', positions: ['GK', 'MID', 'MID', 'MID', 'MID', 'ATT'] }
    ]
  };
  return formations[playerCount] || [];
};

/**
 * Generates recommendation text based on analysis
 */
const generateRecommendationText = (formation, teamProfile, score) => {
  const formationTactics = FORMATION_TACTICS[formation];
  if (!formationTactics) return 'Good tactical option for your team.';

  if (score > 0.8) {
    return `Excellent choice! This ${formationTactics.style.toLowerCase()} formation maximizes your team's strengths.`;
  } else if (score > 0.6) {
    return `Solid option. This formation suits your team's ${formationTactics.style.toLowerCase()} approach.`;
  } else {
    return `Consider this formation if you want to try a ${formationTactics.style.toLowerCase()} style.`;
  }
};

/**
 * Generates AI insights for formation
 */
const generateAIInsights = (formation, teamProfile, chemistry, tacticalFit) => {
  const insights = [];
  const formationTactics = FORMATION_TACTICS[formation];
  
  if (chemistry > 0.7) {
    insights.push('🔥 High team chemistry - players work well together');
  } else if (chemistry < 0.4) {
    insights.push('⚠️ Low chemistry - consider position adjustments');
  }
  
  if (tacticalFit > 0.7) {
    insights.push(`✨ Perfect tactical match for ${formationTactics?.style} play`);
  }
  
  if (teamProfile.avgVersatility > 0.8) {
    insights.push('🔄 Versatile squad - can adapt during match');
  }
  
  if (teamProfile.avgAttacking > 0.8) {
    insights.push('⚡ Strong attacking potential');
  } else if (teamProfile.avgDefensive > 0.8) {
    insights.push('🛡️ Solid defensive foundation');
  }
  
  return insights;
};

export default {
  getAIFormationRecommendations,
  analyzePlayerProfile,
  calculateTeamChemistry
};