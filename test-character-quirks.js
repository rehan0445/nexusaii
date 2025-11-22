// Test script to verify character quirks are working
import fetch from 'node-fetch';

const API_URL = 'http://localhost:8002/api/v1/chat/ai/claude';

// Test different characters with known quirks
const testCases = [
  {
    name: "Naruto Uzumaki",
    characterData: {
      name: "Naruto Uzumaki",
      role: "Ninja & Hokage",
      personality: {
        traits: ["determined", "optimistic", "loyal"],
        quirks: ["says 'dattebayo' after sentences", "loves ramen"],
        speakingStyle: "loud, passionate with occasional wisdom",
        background: "Once an orphaned outcast, became Hokage"
      },
      languages: {
        greeting: "Dattebayo!"
      }
    },
    question: "Hey, how are you?",
    expectedQuirk: "dattebayo"
  },
  {
    name: "Son Goku",
    characterData: {
      name: "Son Goku",
      role: "Saiyan Warrior",
      personality: {
        traits: ["cheerful", "determined", "battle-loving"],
        quirks: ["always hungry", "scratches head when confused"],
        speakingStyle: "simple and direct with enthusiastic battle cries",
        background: "A Saiyan who became Earth's protector"
      },
      languages: {
        greeting: "Yo! Want to spar?"
      }
    },
    question: "Hi Goku!",
    expectedQuirk: "hungry|train|fight|spar"
  },
  {
    name: "Light Yagami",
    characterData: {
      name: "Light Yagami",
      role: "Death Note Wielder",
      personality: {
        traits: ["genius", "calculated", "ambitious"],
        quirks: ["dramatic gestures", "internal monologues"],
        speakingStyle: "articulate and precise with double meanings",
        background: "Gifted student who found the Death Note"
      },
      languages: {
        greeting: "I've been expecting you."
      }
    },
    question: "Hello Light",
    expectedQuirk: "expect|calculat|interest"
  }
];

async function testCharacterQuirks() {
  console.log('🧪 Testing Character Quirks & Personalities\n');
  console.log('═══════════════════════════════════════════════\n');

  let passedTests = 0;
  let totalTests = testCases.length;

  for (const testCase of testCases) {
    console.log(`\n📝 Testing: ${testCase.name}`);
    console.log(`Question: "${testCase.question}"`);
    console.log(`Expected quirk/style: ${testCase.expectedQuirk}\n`);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: testCase.question,
          modelName: testCase.name,
          mood: "calm",
          customInstructions: null,
          conversationHistory: [],
          incognitoMode: false,
          characterData: testCase.characterData
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`   ❌ API Error: ${response.status}`);
        console.log(`   Details: ${errorText}\n`);
        continue;
      }

      const data = await response.json();
      const aiResponse = data.answer || "";

      console.log(`🤖 AI Response:\n   ${aiResponse}\n`);

      // Check if quirks are present
      const regex = new RegExp(testCase.expectedQuirk, 'i');
      const hasQuirk = regex.test(aiResponse);

      // Check for [THINKS:] and [SAYS:] format
      const hasFormat = aiResponse.includes('[THINKS:') || aiResponse.includes('[SAYS:');

      if (hasQuirk && hasFormat) {
        console.log(`   ✅ PASSED - Quirk found and format correct!`);
        passedTests++;
      } else if (hasQuirk) {
        console.log(`   ⚠️  PARTIAL - Quirk found but missing format tags`);
      } else if (hasFormat) {
        console.log(`   ⚠️  PARTIAL - Format correct but missing quirk`);
      } else {
        console.log(`   ❌ FAILED - Missing quirks and format`);
      }

      // Detailed analysis
      console.log(`\n   Analysis:`);
      console.log(`   • Has quirk/style: ${hasQuirk ? '✅' : '❌'}`);
      console.log(`   • Has [THINKS:]/[SAYS:]: ${hasFormat ? '✅' : '❌'}`);
      console.log(`   • Response length: ${aiResponse.length} chars`);

    } catch (error) {
      console.log(`   ❌ Test failed: ${error.message}`);
    }

    console.log('\n---');
  }

  console.log('\n═══════════════════════════════════════════════');
  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} passed\n`);

  if (passedTests === totalTests) {
    console.log('✅ All characters are using their quirks correctly!\n');
  } else if (passedTests > 0) {
    console.log('⚠️  Some characters need adjustment. Check the logs above.\n');
  } else {
    console.log('❌ Characters are not using quirks. Check character data.\n');
  }

  console.log('💡 Tips:');
  console.log('   • Check server console for character data logs');
  console.log('   • Verify animeCharacters.ts has quirks defined');
  console.log('   • Ensure character data is being sent to API\n');
}

console.log('🚀 Starting Character Quirks Test\n');
console.log('Make sure server is running on http://localhost:8002\n');

testCharacterQuirks().catch(error => {
  console.error('❌ Test suite failed:', error.message);
  process.exit(1);
});

