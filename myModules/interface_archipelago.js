// Don't worry about it
// Idk why either :-)

const { Client } = require('archipelago.js')
const apClient = new Client()


async function main() {

    var loggedIn = await apClient.login('wss://archipelago.gg:54151', '14aTruck', 'ClusterTruck')
    console.log(JSON.stringify(loggedIn))

    apClient.messages.on("message", (text, nodes) => {
        console.log(text)
        // console.log(`[message] nodes`, nodes)
    })

    // archipelago_client.messages.say('The quick brown fox jumps over the lazy dog')

}
// main()