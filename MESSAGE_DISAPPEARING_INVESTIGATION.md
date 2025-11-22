# 🔍 Message Disappearing - Deep Investigation Setup

## ✅ **Comprehensive Logging Added**

### Files Modified with Enhanced Logging:

#### 1. **`client/src/contexts/HangoutContext.tsx`**
- ✅ Added stack trace logging to `setMessagesWithLogging`
- ✅ Logs every message state change with:
  - Previous/new count
  - Previous/new message IDs (last 3)
  - Timestamp
  - Call stack trace
  - Cleared message warnings with stack trace
- ✅ Added detailed logging in `selectRoom` function

#### 2. **`client/src/services/messagePersistence.ts`**
- ✅ Added START/END logging for `loadMessages()`
- ✅ Added START/END logging for `loadFromAPI()`
- ✅ Logs all paths: cache hit, API call, error fallback
- ✅ Tracks message count at each step

#### 3. **`client/src/pages/HangoutChat.tsx`**
- ✅ Added lifecycle logging (mount/unmount)
- ✅ Enhanced sync logging between context and local state
- ✅ Logs when contextMessages changes
- ✅ Logs when localMessages updates
- ✅ Tracks message IDs being synced

---

## 🎯 **What to Look For in Logs**

### **Pattern 1: Multiple API Calls**
```
🔵 [MSG_PERSISTENCE] loadMessages START
🌐 [MSG_PERSISTENCE_API] loadFromAPI START
```
**Question:** How many times does this appear per page load?
- Expected: 1-2 times
- Problem: 3+ times = redundant fetching

### **Pattern 2: State Replacements**
```
🔄 [CONTEXT_MESSAGES_UPDATE] State change: -X (messages decreased)
```
**Question:** What's in the `calledFrom` stack trace?
- Look for which function is clearing messages

### **Pattern 3: Empty Arrays**
```
🚨 [CONTEXT] ALL MESSAGES CLEARED!
⚠️ [HANGOUT_CHAT_SYNC] Context returned EMPTY ARRAY
```
**Question:** When do these appear?
- Immediately after load?
- After a delay?
- After user action?

### **Pattern 4: Sync Issues**
```
📨 [HANGOUT_CHAT_SYNC] Updating local messages from context
```
**Question:** Does local count match context count?
- If not, why is the sync failing?

---

## 📊 **How to Use the Debug Monitor**

### **Step 1: Open Debug Monitor**
```bash
# Open in browser:
file:///D:/nexus_rehan/aadrika/test-message-disappearing-debug.html
```

### **Step 2: Start Your App**
```bash
npm run dev
```

### **Step 3: Navigate to a Hangout Room**
1. Go to Hangout feature
2. Select a room with messages
3. Watch the debug monitor

### **Step 4: Observe Metrics**
- **Context Message Count** - From HangoutContext
- **Local Message Count** - From HangoutChat UI
- **API Calls Made** - How many times API is called
- **State Updates** - How many times setMessages is called
- **Messages Cleared Count** - How many times messages are cleared to empty

### **Step 5: Test Different Scenarios**

#### Scenario A: Page Load
1. Load room
2. Check: Do messages appear?
3. Check: Do they disappear after X seconds?
4. Export logs

#### Scenario B: Room Switch
1. Load room A
2. Switch to room B
3. Switch back to room A
4. Check: Are messages still there?
5. Export logs

#### Scenario C: Page Refresh
1. Load room
2. Refresh browser (F5)
3. Check: Do messages reload?
4. Export logs

#### Scenario D: Send Message
1. Load room
2. Send a new message
3. Check: Does it appear?
4. Check: Does it disappear?
5. Export logs

---

## 🔎 **Expected Results**

### **Healthy Flow:**
```
1. 🔵 [MSG_PERSISTENCE] loadMessages START
2. 🌐 [MSG_PERSISTENCE_API] loadFromAPI START
3. ✅ [MSG_PERSISTENCE_API] Successfully loaded X messages
4. 📈 [CONTEXT] Messages increased by X
5. 📨 [HANGOUT_CHAT_SYNC] Updating local messages
6. [Messages display in UI]
```

### **Unhealthy Flow (Problem):**
```
1. 🔵 [MSG_PERSISTENCE] loadMessages START
2. ✅ [MSG_PERSISTENCE_API] Successfully loaded X messages
3. 📈 [CONTEXT] Messages increased by X
4. 📨 [HANGOUT_CHAT_SYNC] Updating local messages
5. [Messages display in UI]
6. ⚠️ [CONTEXT_MESSAGES_UPDATE] State change: -X  ← PROBLEM!
7. 🚨 [CONTEXT] ALL MESSAGES CLEARED!
8. [UI shows empty]
```

---

## 🐛 **Suspected Issues to Verify**

### **Issue 1: Race Condition**
**Hypothesis:** Multiple API calls racing, last one overwrites with empty array
**Look for:** Multiple `loadMessages START` within 100ms

### **Issue 2: Context Re-initialization**
**Hypothesis:** HangoutContext unmounts/remounts, resetting state
**Look for:** Component lifecycle logs showing unexpected unmount

### **Issue 3: Real-time Subscription Overwrite**
**Hypothesis:** Supabase realtime subscription fires with empty array
**Look for:** Room history event with 0 messages

### **Issue 4: Dependency Array Issue**
**Hypothesis:** useEffect dependency triggers unnecessary reloads
**Look for:** Multiple sync logs when nothing changed

### **Issue 5: State Mutation**
**Hypothesis:** State is being mutated directly instead of immutably
**Look for:** Message count changes without corresponding log

---

## 📝 **Next Steps Based on Findings**

### If API is called multiple times:
- Check for duplicate `selectRoom` calls
- Review useEffect dependencies in HangoutContext
- Add debouncing or request cancellation

### If messages clear after appearing:
- Find the stack trace of the clear operation
- Check for cleanup functions in useEffect
- Review room switching logic

### If real-time subscription is the issue:
- Review `hangoutService.onRoomHistory` handler
- Check Supabase subscription filters
- Add guards against empty payloads

### If sync is failing:
- Review dependency array in HangoutChat sync useEffect
- Check for stale closures
- Verify contextMessages is correctly passed

---

## 🚀 **How to Report Findings**

When you have logs, provide:

1. **Scenario tested** (e.g., "Page load", "Room switch")
2. **Observed behavior** (e.g., "Messages appear then disappear after 2 seconds")
3. **Log excerpt** showing the problem pattern
4. **Metric values** from debug monitor
5. **Exported log file** (use "Export Logs" button)

Example report:
```
Scenario: Page Load
Behavior: Messages appear for 1 second then disappear
Metrics:
  - Context Count: 5 → 0
  - Local Count: 5 → 0
  - API Calls: 2
  - State Updates: 3
  - Cleared: 1

Key Log:
  🔄 [CONTEXT_MESSAGES_UPDATE] State change: -5
  Called from: selectRoom → line 627

Conclusion: selectRoom is being called twice, second call clears messages
```

---

## ✅ **Action Items**

- [ ] Open debug monitor
- [ ] Load a hangout room with existing messages
- [ ] Watch logs in real-time
- [ ] Test all 4 scenarios (Load, Switch, Refresh, Send)
- [ ] Export logs for each scenario
- [ ] Identify the pattern causing disappearance
- [ ] Report findings with specific log excerpts

---

## 📚 **Log Prefixes Reference**

| Prefix | Source | Purpose |
|--------|--------|---------|
| `[MSG_PERSISTENCE]` | messagePersistence.ts | Message loading service |
| `[MSG_PERSISTENCE_API]` | messagePersistence.ts | API calls |
| `[CONTEXT_MESSAGES_UPDATE]` | HangoutContext.tsx | State updates |
| `[CONTEXT]` | HangoutContext.tsx | Context operations |
| `[SELECT_ROOM]` | HangoutContext.tsx | Room selection |
| `[HANGOUT_CHAT_SYNC]` | HangoutChat.tsx | Local/context sync |
| `[HANGOUT_CHAT_LIFECYCLE]` | HangoutChat.tsx | Component lifecycle |

---

## 🔧 **Quick Debug Commands**

Open browser console and run:

```javascript
// Check current context state
window.__HANGOUT_CONTEXT_MESSAGES__ = contextMessages;
console.log('Context messages:', window.__HANGOUT_CONTEXT_MESSAGES__);

// Check local state
console.log('Local messages:', localMessages);

// Check if component is mounted
console.log('Component mounted:', !!document.querySelector('[data-hangout-chat]'));

// Check localStorage cache
console.log('Cached messages:', JSON.parse(localStorage.getItem('nexus-message-cache')));
```

---

**The comprehensive logging is now in place. Every message state change, API call, and sync operation will be tracked with detailed context. Use the debug monitor to identify the exact point where messages disappear!**

