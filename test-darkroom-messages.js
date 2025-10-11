// Test script to verify Dark Room message persistence
const SERVER_URL = 'http://localhost:8002';

async function testDarkRoomMessageRetrieval() {
    console.log('🧪 Testing Dark Room Message Retrieval...');
    
    try {
        // First, get the list of rooms
        console.log('📋 Fetching Dark Room groups...');
        const roomsResponse = await fetch(`${SERVER_URL}/api/v1/darkroom/rooms`);
        const rooms = await roomsResponse.json();
        
        if (!Array.isArray(rooms) || rooms.length === 0) {
            console.log('❌ No Dark Room groups found');
            return;
        }
        
        console.log(`✅ Found ${rooms.length} Dark Room groups`);
        
        // Test message retrieval for each room
        for (const room of rooms) {
            console.log(`\n📨 Testing messages for room: ${room.id}`);
            
            try {
                const messagesResponse = await fetch(`${SERVER_URL}/api/v1/darkroom/rooms/${room.id}/messages`);
                const result = await messagesResponse.json();
                
                if (result.success) {
                    console.log(`✅ Room ${room.id}: ${result.messages?.length || 0} messages retrieved`);
                    
                    if (result.messages && result.messages.length > 0) {
                        console.log('📝 Sample messages:');
                        result.messages.slice(0, 3).forEach((msg, index) => {
                            console.log(`  ${index + 1}. [${msg.alias}]: ${msg.message} (${msg.time})`);
                        });
                    }
                } else {
                    console.log(`❌ Room ${room.id}: Failed to retrieve messages`);
                }
            } catch (error) {
                console.log(`❌ Room ${room.id}: Error - ${error.message}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testDarkRoomMessageRetrieval();
