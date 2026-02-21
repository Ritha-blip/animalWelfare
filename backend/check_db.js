const mongoose = require('mongoose');
const Report = require('./models/Report');

async function checkDB() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/animal_welfare');
        console.log('CONNECTED TO MONGODB');

        const reports = await Report.find().sort({ createdAt: -1 });
        console.log(`TOTAL REPORTS: ${reports.length}`);

        console.log('\n--- LATEST 5 REPORTS ---');
        reports.slice(0, 5).forEach((r, i) => {
            console.log(`${i + 1}. [${r.createdAt.toISOString()}]`);
            console.log(`   Name: ${r.name}`);
            console.log(`   Location: ${r.location}`);
            console.log(`   Details: ${r.details}`);
            console.log(`   Photo: ${r.photoUrl || 'N/A'}`);
            console.log('-------------------------');
        });

        const kkCount = reports.filter(r => r.name === 'kk' || r.location === 'kk' || r.details === 'kk').length;
        console.log(`\nREPORTS WITH "kk" VALUES: ${kkCount}`);

        process.exit();
    } catch (err) {
        console.error('ERROR:', err);
        process.exit(1);
    }
}

checkDB();
