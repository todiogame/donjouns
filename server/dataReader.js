const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { MonsterCard } = require('./models/MonsterCard');
const { EventCard } = require('./models/EventCard');
const { ItemCard } = require('./models/ItemCard');

function loadCSV(filePath, type) {

    // console.log('MonsterCard:', MonsterCard);
    // console.log('EventCard:', EventCard);

    return new Promise((resolve, reject) => {
        const results = [];

        fs.createReadStream(path.resolve(__dirname, filePath))
            .pipe(csv())
            .on('data', (row) => {
                // Only process rows where 'id' is set
                if (row.id) {
                    if (type === 'Monster') {
                        const { id, Title: title, Power: power, Description: description, Type: cardType } = row;
                        const types = cardType ? cardType.split(',').map(t => t.trim()) : [];
                        // console.log('Creating card:', { id, title, power, types, description, cardType });
                        const monsterCard = new MonsterCard(id, title, parseInt(power, 10) || 0, types, description, ""); //last row is effect
                        results.push(monsterCard);
                    } else if (type === 'Event') {
                        const { id, Title: title, Description: description } = row;
                        // console.log('Creating card:', { id, title, description });
                        const eventCard = new EventCard(id, title, description);
                        results.push(eventCard);
                    } else if (type === 'Item') {
                        const { id, Title: title, Active: active, Color: color, Key: key, Description: description } = row;
                        // console.log('Creating item:', { id, title, active, color, key, description });
                        const itemCard = new ItemCard(id, title, active, color, key, description);
                        results.push(itemCard);
                    }
                }
            })
            .on('end', () => {
                resolve(results);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
}

async function loadData() {
    try {
        const monsters = await loadCSV('gamedata/monsters.csv', 'Monster');
        const events = await loadCSV('gamedata/events.csv', 'Event');
        const items = await loadCSV('gamedata/items.csv', 'Item');
        return {dungeon:[...monsters, ...events], items: items};
    } catch (error) {
        console.error('Error loading data:', error);
        throw error;
    }
}

module.exports = { loadData };
