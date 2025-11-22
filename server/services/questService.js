// Quest Service: Generate and manage mini-games/quests for character interactions
import crypto from 'crypto';

// Quest types and templates
const QUEST_TYPES = {
  RIDDLE: 'riddle',
  TRIVIA: 'trivia',
  WORD_GAME: 'word_game',
  PERSONALITY_QUIZ: 'personality_quiz'
};

// Riddle templates (character-agnostic, will be personalized by AI)
const RIDDLES = [
  {
    prompt: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?",
    solution: "echo",
    hints: ["I repeat what you say", "Found in caves and mountains"],
    difficulty: 'medium'
  },
  {
    prompt: "The more you take, the more you leave behind. What am I?",
    solution: "footsteps",
    hints: ["Think about walking", "They mark your path"],
    difficulty: 'easy'
  },
  {
    prompt: "I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?",
    solution: "map",
    hints: ["I show locations", "Travelers use me"],
    difficulty: 'medium'
  },
  {
    prompt: "What can travel around the world while staying in a corner?",
    solution: "stamp",
    hints: ["Found on letters", "Postal item"],
    difficulty: 'hard'
  },
  {
    prompt: "I'm tall when I'm young, and short when I'm old. What am I?",
    solution: "candle",
    hints: ["I provide light", "I melt over time"],
    difficulty: 'easy'
  }
];

// Trivia questions (general knowledge)
const TRIVIA = [
  {
    prompt: "What is the largest planet in our solar system?",
    solution: "jupiter",
    hints: ["It's a gas giant", "Named after a Roman god"],
    difficulty: 'easy'
  },
  {
    prompt: "Who painted the Mona Lisa?",
    solution: "leonardo da vinci",
    hints: ["Italian Renaissance artist", "Also invented flying machines"],
    difficulty: 'medium'
  },
  {
    prompt: "What is the smallest country in the world?",
    solution: "vatican city",
    hints: ["It's in Europe", "Religious headquarters"],
    difficulty: 'medium'
  },
  {
    prompt: "How many hearts does an octopus have?",
    solution: "three",
    hints: ["More than one", "Less than five"],
    difficulty: 'hard'
  },
  {
    prompt: "What year did World War II end?",
    solution: "1945",
    hints: ["Mid 1940s", "After D-Day"],
    difficulty: 'medium'
  }
];

// Word games
const WORD_GAMES = [
  {
    prompt: "Unscramble this word: TRAHEC",
    solution: "character",
    hints: ["AI personality", "Role you play"],
    difficulty: 'medium'
  },
  {
    prompt: "What 5-letter word becomes shorter when you add two letters to it?",
    solution: "short",
    hints: ["Think literally", "Add 'er' to the end"],
    difficulty: 'hard'
  },
  {
    prompt: "I am an odd number. Take away one letter and I become even. What number am I?",
    solution: "seven",
    hints: ["Between 5 and 10", "Remove the 's'"],
    difficulty: 'medium'
  }
];

// Personality quizzes (character-specific, template for AI to fill)
const PERSONALITY_QUIZZES = [
  {
    prompt: "If you could have one superpower, what would it be?",
    options: ["Flying", "Invisibility", "Super strength", "Mind reading"],
    analysis: true, // AI will analyze answer for personality insights
    difficulty: 'easy'
  },
  {
    prompt: "What's your go-to karaoke song?",
    options: ["Power ballad", "Upbeat pop", "Rock anthem", "Don't sing"],
    analysis: true,
    difficulty: 'easy'
  }
];

// Affection rewards based on difficulty
const REWARDS = {
  easy: { complete: 3, attempt: 1 },
  medium: { complete: 5, attempt: 1 },
  hard: { complete: 8, attempt: 2 }
};

class QuestService {
  /**
   * Generate a new quest for a character-user interaction
   * @param {string} characterName - Name of the character
   * @param {string} characterPersonality - Character's personality traits
   * @param {number} affectionLevel - Current affection level
   * @returns {Object} Quest object
   */
  generateQuest(characterName, characterPersonality = '', affectionLevel = 0) {
    // Choose quest type based on affection level
    let questType;
    if (affectionLevel < 100) {
      // Early stage: simple riddles and word games
      questType = Math.random() < 0.6 ? QUEST_TYPES.RIDDLE : QUEST_TYPES.WORD_GAME;
    } else if (affectionLevel < 500) {
      // Mid stage: add trivia
      const rand = Math.random();
      questType = rand < 0.4 ? QUEST_TYPES.RIDDLE : rand < 0.7 ? QUEST_TYPES.TRIVIA : QUEST_TYPES.WORD_GAME;
    } else {
      // High affection: include personality quizzes
      const rand = Math.random();
      if (rand < 0.3) questType = QUEST_TYPES.PERSONALITY_QUIZ;
      else if (rand < 0.6) questType = QUEST_TYPES.TRIVIA;
      else questType = QUEST_TYPES.RIDDLE;
    }

    // Select random quest from type
    let questData;
    switch (questType) {
      case QUEST_TYPES.RIDDLE:
        questData = RIDDLES[Math.floor(Math.random() * RIDDLES.length)];
        break;
      case QUEST_TYPES.TRIVIA:
        questData = TRIVIA[Math.floor(Math.random() * TRIVIA.length)];
        break;
      case QUEST_TYPES.WORD_GAME:
        questData = WORD_GAMES[Math.floor(Math.random() * WORD_GAMES.length)];
        break;
      case QUEST_TYPES.PERSONALITY_QUIZ:
        questData = PERSONALITY_QUIZZES[Math.floor(Math.random() * PERSONALITY_QUIZZES.length)];
        break;
    }

    // Create quest object
    const questId = crypto.randomUUID();
    const quest = {
      id: questId,
      type: questType,
      prompt: questData.prompt,
      solution: questData.solution,
      hints: questData.hints || [],
      difficulty: questData.difficulty,
      reward: REWARDS[questData.difficulty].complete,
      attemptReward: REWARDS[questData.difficulty].attempt,
      startedAt: new Date().toISOString(),
      characterName,
      options: questData.options || null,
      isAnalysis: questData.analysis || false
    };

    return quest;
  }

  /**
   * Validate user's answer to a quest
   * @param {string} userAnswer - User's submitted answer
   * @param {Object} quest - Quest object
   * @returns {Object} Result with success, reward, and feedback
   */
  validateAnswer(userAnswer, quest) {
    if (!userAnswer || !quest) {
      return { success: false, reward: 0, feedback: "Invalid answer or quest" };
    }

    // For personality quizzes, any answer is valid
    if (quest.type === QUEST_TYPES.PERSONALITY_QUIZ) {
      return {
        success: true,
        reward: quest.reward,
        feedback: "Thanks for sharing! That tells me a lot about you 😊",
        personalityInsight: userAnswer
      };
    }

    // Normalize answers for comparison
    const normalizedAnswer = userAnswer.toLowerCase().trim();
    const normalizedSolution = quest.solution.toLowerCase().trim();

    // Check for exact match or close match
    const isExactMatch = normalizedAnswer === normalizedSolution;
    const isCloseMatch = this.isCloseEnough(normalizedAnswer, normalizedSolution);

    if (isExactMatch) {
      return {
        success: true,
        reward: quest.reward,
        feedback: `Perfect! That's absolutely correct! 🎉 You earned +${quest.reward} affection points!`
      };
    } else if (isCloseMatch) {
      return {
        success: true,
        reward: Math.floor(quest.reward * 0.8), // 80% reward for close answer
        feedback: `Close enough! The answer was "${quest.solution}", but I'll count it! 😄 You earned +${Math.floor(quest.reward * 0.8)} affection points!`
      };
    } else {
      return {
        success: false,
        reward: quest.attemptReward,
        feedback: `Not quite, but nice try! The answer was "${quest.solution}". You still earned +${quest.attemptReward} for the attempt! 💪`
      };
    }
  }

  /**
   * Check if answer is close enough (handles typos, partial matches)
   * @param {string} answer - User's answer
   * @param {string} solution - Correct solution
   * @returns {boolean}
   */
  isCloseEnough(answer, solution) {
    // Check if answer contains solution or vice versa
    if (answer.includes(solution) || solution.includes(answer)) {
      return true;
    }

    // Levenshtein distance for typo tolerance
    const distance = this.levenshteinDistance(answer, solution);
    const maxAllowedDistance = Math.floor(solution.length * 0.2); // Allow 20% character difference
    
    return distance <= maxAllowedDistance;
  }

  /**
   * Calculate Levenshtein distance between two strings
   * @param {string} str1 
   * @param {string} str2 
   * @returns {number}
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Get hint for active quest
   * @param {Object} quest - Quest object
   * @param {number} hintIndex - Which hint to reveal (0, 1, 2...)
   * @returns {string} Hint text
   */
  getHint(quest, hintIndex = 0) {
    if (!quest.hints || quest.hints.length === 0) {
      return "No hints available for this quest!";
    }

    if (hintIndex >= quest.hints.length) {
      return "No more hints available!";
    }

    return quest.hints[hintIndex];
  }

  /**
   * Should character offer a quest? (random chance based on affection)
   * @param {number} affectionLevel 
   * @param {number} messageCount - Messages in current session
   * @returns {boolean}
   */
  shouldOfferQuest(affectionLevel, messageCount) {
    // Don't offer too early
    if (messageCount < 5) return false;

    // Base chance: 10%
    let chance = 0.10;

    // Increase chance with higher affection
    if (affectionLevel > 200) chance = 0.15;
    if (affectionLevel > 500) chance = 0.20;
    if (affectionLevel > 800) chance = 0.25;

    // Every 10 messages, increase chance
    chance += (Math.floor(messageCount / 10) * 0.05);

    return Math.random() < Math.min(chance, 0.40); // Max 40% chance
  }
}

export default new QuestService();

