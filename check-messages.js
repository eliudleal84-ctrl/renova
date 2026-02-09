import connectDB from './src/lib/mongodb';
import Message from './src/models/Message';
import Client from './src/models/Client';
import Conversation from './src/models/Conversation';

async function checkDB() {
    try {
        console.log('⏳ Conectando a MongoDB...');
        await connectDB();

        const messageCount = await Message.countDocuments();
        const clientCount = await Client.countDocuments();
        const conversationCount = await Conversation.countDocuments();

        console.log('\n📊 Estado de la Base de Datos:');
        console.log(`- Mensajes: ${messageCount}`);
        console.log(`- Clientes: ${clientCount}`);
        console.log(`- Conversaciones: ${conversationCount}`);

        if (messageCount > 0) {
            const lastMessage = await Message.findOne().sort({ timestamp: -1 });
            console.log('\n✅ ¡Último mensaje recibido!');
            console.log(`- De: ${lastMessage.from}`);
            console.log(`- Cuerpo: ${lastMessage.body}`);
            console.log(`- Fecha: ${lastMessage.timestamp}`);
        } else {
            console.log('\n❌ No se encontraron mensajes aún.');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkDB();
