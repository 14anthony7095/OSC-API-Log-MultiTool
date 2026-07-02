// Don't worry about it
// Idk why either :-)

const { Client } = require('archipelago.js')


main('wss://archipelago.gg:51557', '14aPVZ', 'Plants vs. Zombies')

async function main(I_url, I_slot, I_game) {
    const apClient = new Client()
    var loggedIn = await apClient.login(I_url, I_slot, I_game, { 'tags': ['DealthLink', 'NoText'] })
    const logPrefix = `[\x1b[32m${apClient.game}\x1b[0m]`
    var hintQueue = []
    var hintPoints = apClient.room.hintPoints
    var hintCost = apClient.room.hintCost
    var hintUsage = Math.floor(hintPoints / hintCost)

    apClient.room.on('hintCostUpdated', (oldCost, newCost, oldPer, newPer) => {
        // console.log(`${logPrefix} [hintCostUpdated]: `, oldCost, newCost, oldPer, newPer)

    })
    apClient.room.on('hintPointsUpdated', (oldValue, newValue) => {
        // console.log(`${logPrefix} [hintPointsUpdated]: ${oldValue} -> ${newValue}`)
        hintPoints = newValue
        hintUsage = Math.floor(hintPoints / hintCost)
    })
    apClient.room.on('locationCheckPointsUpdated', (oldValue, newValue) => {
        // console.log(`${logPrefix} [locationCheckPointsUpdated]: `, oldValue, newValue)
    })
    apClient.room.on('locationsChecked', (locations) => {
        // console.log(`${logPrefix} [locationsChecked]: `, locations)
    })
    apClient.items.on('hintsInitialized', (hints) => {
        // console.log(`${logPrefix} [hintsInitialized]: `, hints.map(h=>{`${h.item.id} - ${h.item.name}`}))        
    })
    apClient.items.on('hintReceived', (hint) => {
        // console.log(`${logPrefix} [hintReceived]: `, hint.item.id, hint.item.name)
    })
    apClient.messages.on('itemHinted', (text, item, found) => {
        // console.log(`${logPrefix} [itemHinted]: `, text, item, found)
    })
    apClient.messages.on('message', (text) => {
        // console.log(`${logPrefix}: `, text)
    })
    apClient.deathLink.on('deathReceived', (source, time, cause) => {
        console.log(`${logPrefix} [deathReceived]: `, time, source, cause)
    })
    
apClient.goal()

    // apClient.check(['81'])
    // apClient.storage.fetchLocationNameGroups(apClient.game)        .then(f => console.log(f))

    // apClient.check(['9-10'])

}