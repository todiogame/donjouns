const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

class DungeonCard {
    constructor(id, title, description, effect = null) {
        this.id = id;
        this.texture = 'dungeon_' + String(id).padStart(3, '0');
        this.title = title;
        this.description = description;
        this.effect = effect;
    }
}

class MonsterCard extends DungeonCard {
    constructor(id, title, power, types = [title], description = "", effect = null) {
        super(id, title, description, effect);
        this.power = power;
        this.types = types;
        this.executed = false;
        this.damage = 0;
    }
}

class EventCard extends DungeonCard {
    constructor(id, title, description, effect = null) {
        super(id, title, description, effect);
        this.event = true;
    }
}

const columnMapping = {
    'ID': 'id',
    'Title': 'title',
    'Description': 'description',
    'Power': 'power',
    'Types': 'types',
    'Effect': 'effect',
    'Type': 'type'
};

function loadData(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];

        fs.createReadStream(path.resolve(__dirname, filePath))
            .pipe(csv())
            .on('data', (row) => {
                // Map CSV columns to object attributes
                const mappedRow = {};
                for (const key in columnMapping) {
                    if (columnMapping.hasOwnProperty(key)) {
                        mappedRow[columnMapping[key]] = row[key];
                    }
                }

                // Only process rows where 'id' is set
                if (mappedRow.id) {
                    const { id, title, description, power, types, effect, type } = mappedRow;
                    if (type === 'Monster') {
                        const monsterCard = new MonsterCard(id, title, parseInt(power, 10), types ? types.split(',') : [], description, effect);
                        results.push(monsterCard);
                    } else if (type === 'Event') {
                        const eventCard = new EventCard(id, title, description, effect);
                        results.push(eventCard);
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

module.exports = { loadData, DungeonCard, MonsterCard, EventCard };
