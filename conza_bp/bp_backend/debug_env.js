require('dotenv').config();
console.log('PORT:', process.env.PORT);
console.log('MONGO_URI:', process.env.MONGO_URI ? 'Exists' : 'Missing');
process.exit(0);
