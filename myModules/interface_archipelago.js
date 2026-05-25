// Don't worry about it
// Idk why either :-)

const { Client } = require('archipelago.js')

games('ws://localhost:38281', [
    ['14aBuck', 'Buckshot Roulette'],
    ['14aClover', 'CloverPit'],
    ['14aTruck', 'ClusterTruck'],
    ['14aHammerWatch', 'Hammerwatch'],
    ['14aLego', 'Lego Star Wars: The Complete Saga'],
    ['14aMineDig', 'Minecraft Dig'],
    ['14aPaint', 'Paint'],
    ['14aVamp', 'Vampire Survivors']
])

function games(I_ip, I_arr = [[]]) {
    for (const item in I_arr) {
        main(I_ip, I_arr[item][0], I_arr[item][1])
    }
}

async function main(I_url, I_slot, I_game) {
    const apClient = new Client()
    var loggedIn = await apClient.login(I_url, I_slot, I_game)

    var hintQueue = []
    var hintPoints = apClient.room.hintPoints
    var hintCost = apClient.room.hintCost
    var hintUsage = Math.floor(hintPoints / hintCost)

    apClient.room.on('hintCostUpdated', (oldCost, newCost, oldPer, newPer) => {
        console.log(`[\x1b[32m${apClient.game}\x1b[0m] [hintCostUpdated]: `, oldCost, newCost, oldPer, newPer)

    })
    apClient.room.on('hintPointsUpdated', (oldValue, newValue) => {
        console.log(`[\x1b[32m${apClient.game}\x1b[0m] [hintPointsUpdated]: ${oldValue} -> ${newValue}`)
        hintPoints = newValue
        hintUsage = Math.floor(hintPoints / hintCost)
    })
    apClient.room.on('locationCheckPointsUpdated', (oldValue, newValue) => {
        console.log(`[\x1b[32m${apClient.game}\x1b[0m] [locationCheckPointsUpdated]: `, oldValue, newValue)
    })
    apClient.room.on('locationsChecked', (locations) => {
        console.log(`[\x1b[32m${apClient.game}\x1b[0m] [locationsChecked]: `, locations)
    })
    apClient.items.on('hintsInitialized', (hints) => {
        apClient.players.self.fetchHints().then(fh => {
            hintQueue = apClient.room.allLocations.filter(l => fh.map(h => h.item.id).includes(l) == false)
            bulkHint()
        })
        setInterval(() => { bulkHint() }, 60_000)
    })
    apClient.items.on('hintReceived', (hint) => {
        console.log(`[\x1b[32m${apClient.game}\x1b[0m] [hintReceived]: `, hint.item.id, hint.item.name)
        hintQueue.splice(hintQueue.indexOf(hint.item.id))
    })
    apClient.messages.on('itemHinted', (text, item, found) => {
        console.log(`[\x1b[32m${apClient.game}\x1b[0m] [itemHinted]: `, text, item, found)
        hintQueue.splice(hintQueue.indexOf(item.id))
    })
    apClient.messages.on('message', (text) => {
        // console.log(`[\x1b[32m${apClient.game}\x1b[0m]: `, text)
    })

    function bulkHint() {
        // var limit = hintCost == 0 ? hintQueue.length : hintUsage

        if (hintPoints > hintCost) {
            apClient.hint(hintQueue)
            // apClient.hint(hintQueue.slice(0, hintUsage))
            console.log(`[\x1b[32m${apClient.game}\x1b[0m] [bulkHint]: Auto Hinted ${hintQueue.length} Locations`)
            hintQueue = hintQueue.slice(hintUsage)
        } else { console.log(`[\x1b[32m${apClient.game}\x1b[0m] [bulkHint]: Not enough Points to hint`) }
    }
}