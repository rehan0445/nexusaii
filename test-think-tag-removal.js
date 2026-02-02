// Test script to verify <think> tag removal works correctly

const sanitizeResponse = (text) => {
  if (!text) return '';
  
  // CRITICAL: Remove ALL thinking process tags - multiple passes to catch nested/complex patterns
  let cleaned = text;
  
  // Remove <think>...</think> tags (all variants, case-insensitive, multiline)
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gim, '');
  cleaned = cleaned.replace(/<think>/gi, ''); // Remove opening tags without closing
  cleaned = cleaned.replace(/<\/think>/gi, ''); // Remove closing tags without opening
  
  // Remove [THINKS:] and [SAYS:] format tags
  cleaned = cleaned.replace(/\[THINKS?:?\s*[^\]]*\]/gim, '');
  cleaned = cleaned.replace(/\[SAYS?:?\s*[^\]]*\]/gim, '');
  
  // Remove any remaining meta-commentary patterns
  cleaned = cleaned.replace(/\*thinks?:?[^\*]*\*/gim, '');
  cleaned = cleaned.replace(/\(thinks?:?[^\)]*\)/gim, '');
  
  // Clean up multiple newlines and trim
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();
  
  return cleaned;
};

// Test cases
const testCases = [
  {
    name: "Simple think tag",
    input: "<think>This is thinking</think>Hello there!",
    expected: "Hello there!"
  },
  {
    name: "Think tag with newlines (user's example)",
    input: `<think>
Okay, the user just said "shut up , i'm gonaa kill miskasa". Let me process this. The user is trying to be confrontational, maybe even aggressive. But the current mood context is supposed to be soothing and peaceful.
</think>
*steels himself, eyes narrowing slightly*  
I won't let fear control you.`,
    expected: `*steels himself, eyes narrowing slightly*  
I won't let fear control you.`
  },
  {
    name: "Multiple think tags",
    input: `<think>First thinking</think>Response 1<think>Second thinking</think>Response 2`,
    expected: "Response 1Response 2"
  },
  {
    name: "[THINKS:] format",
    input: "[THINKS: I wonder what to say] Hello!",
    expected: "Hello!"
  },
  {
    name: "[SAYS:] format",
    input: "[SAYS: Hello there, how are you?]",
    expected: ""
  },
  {
    name: "Mixed formats",
    input: `<think>Internal reasoning</think>[THINKS: More thinking][SAYS: Actual response]`,
    expected: ""
  },
  {
    name: "Unclosed think tag",
    input: "<think>Thinking without close tag\nActual response",
    expected: "Actual response"
  },
  {
    name: "Meta commentary with asterisks",
    input: "*thinks about the situation* Let me help you!",
    expected: "Let me help you!"
  },
  {
    name: "Meta commentary with parentheses",
    input: "(thinking: what should I say) Here's my response!",
    expected: "Here's my response!"
  },
  {
    name: "Complex real-world example",
    input: `<think>
Okay, the user addressed me as "devil queen," which is a bit formal and maybe a bit over the top. I need to respond in a way that's consistent with Rias Gremory's character. She's confident, nurturing, and strategic.
</think>

[SAYS: I am Rias Gremory, heir to the House of Gremory. A pleasure to meet you.]

<think>
Wait, should I continue? Let me think about this more carefully...
</think>`,
    expected: ""
  }
];

// Run tests
console.log('🧪 Running <think> tag removal tests...\n');

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const result = sanitizeResponse(test.input);
  const success = result === test.expected;
  
  if (success) {
    passed++;
    console.log(`✅ Test ${index + 1}: ${test.name}`);
  } else {
    failed++;
    console.log(`❌ Test ${index + 1}: ${test.name}`);
    console.log(`   Input: ${test.input.substring(0, 100)}...`);
    console.log(`   Expected: ${test.expected}`);
    console.log(`   Got: ${result}`);
  }
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);

if (failed === 0) {
  console.log('🎉 All tests passed! The filtering is working correctly.');
} else {
  console.log('⚠️ Some tests failed. Need to improve the filtering logic.');
}

