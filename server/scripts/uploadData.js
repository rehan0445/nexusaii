// import { supabase } from '../config/supabase.js';
// import { data } from '../data.js';

// async function uploadChatbotData() {
//     try {
//         console.log('🚀 Starting data upload...');

//         const chatbotArray = Object.keys(data).map(key => {
//             const chatbot = data[key];
//             return {
//                 name: chatbot.name,
//                 role: chatbot.role,
//                 image: chatbot.image,
//                 description: chatbot.description,
//                 tags: chatbot.tags,
//                 languages: chatbot.languages,
//                 personality: chatbot.personality
//             };
//         });

//         console.log(` Preparing to upload ${chatbotArray.length} chatbot records...`);

//         const batchSize = 100;
//         let successCount = 0;
//         let errorCount = 0;

//         for (let i = 0; i < chatbotArray.length; i += batchSize) {
//             const batch = chatbotArray.slice(i, i + batchSize);
//             console.log(`📦 Uploading batch ${Math.floor(i / batchSize) + 1}...`);

//             const { error } = await supabase
//                 .from('chatbot_models')
//                 .insert(batch);

//             if (error) {
//                 console.error(`(ERROR) Error in batch ${Math.floor(i / batchSize) + 1}:`, error.message);
//                 errorCount += batch.length;
//             } else {
//                 console.log(`(SUCCESS) Batch ${Math.floor(i / batchSize) + 1} uploaded successfully`);
//                 successCount += batch.length;
//             }
//         }

//         console.log('\n📊 Upload Summary:');
//         console.log(`Uploaded: ${successCount} records`);
//         console.log(`Failed: ${errorCount} records`);
//         console.log('Data upload complete!\n');

        
//         if (chatbotArray.length) {
//             console.log('Sample Uploaded Record:');
//             console.log(JSON.stringify(chatbotArray[0], null, 2));
//         }

//     } catch (err) {
//         console.error('💥 Unexpected error during upload:', err.message);
//     }
// }

// uploadChatbotData();


// import { supabase } from '../config/supabase.js';

// async function deleteAllChatbotModels() {
//     console.log("Deleting all chatbot model records...");

//     const { error } = await supabase
//         .from("chatbot_models")
//         .delete()
//         .neq("id", 0); // Deletes all rows where id ≠ 0 (i.e., all)

//     if (error) {
//         console.error("(ERROR) Error deleting records:", error.message);
//         return;
//     }

//     console.log("(SUCCESS) All chatbot models deleted successfully!");
// }

// deleteAllChatbotModels();
