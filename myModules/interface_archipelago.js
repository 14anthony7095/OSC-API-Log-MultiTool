// Don't worry about it
// Idk why either :-)

const { Client } = require('archipelago.js')


main('wss://archipelago.gg:60502', '14aTruck', 'ClusterTruck')

async function main(I_url, I_slot, I_game) {
    const apClient = new Client()
    var loggedIn = await apClient.login(I_url, I_slot, I_game, { 'tags': ['NoText'] })

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
        // console.log(`[\x1b[32m${apClient.game}\x1b[0m] [hintsInitialized]: `, hints.map(h=>{`${h.item.id} - ${h.item.name}`}))        
    })
    apClient.items.on('hintReceived', (hint) => {
        console.log(`[\x1b[32m${apClient.game}\x1b[0m] [hintReceived]: `, hint.item.id, hint.item.name)
    })
    apClient.messages.on('itemHinted', (text, item, found) => {
        console.log(`[\x1b[32m${apClient.game}\x1b[0m] [itemHinted]: `, text, item, found)
    })
    apClient.messages.on('message', (text) => {
        // console.log(`[\x1b[32m${apClient.game}\x1b[0m]: `, text)
    })


    // apClient.check(['81'])
    // apClient.storage.fetchLocationNameGroups(apClient.game)        .then(f => console.log(f))

    // apClient.check(['9-10'])

}