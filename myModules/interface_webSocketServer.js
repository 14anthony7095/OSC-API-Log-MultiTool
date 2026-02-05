const { WebSocketServer, WebSocket } = require('ws')
// const { oscEmitter,oscSend } = require('./Interface_osc_v1')
var JZZ = require('jzz');

// function lerp(start, end, factor) { return start + (end - start) * factor; }

async function playNote(chan, num, vel) {
    var port = await JZZ().openMidiOut('14aOSC').or();
    /* 
    Chan 0 - 15
    Num 0 - 127
    Vel 0 - 127
    */
    port.control(chan, num, vel)
}



/* var ws_cli_twitch = new WebSocket('wss://eventsub.wss.twitch.tv/ws?keepalive_timeout_seconds=30')

ws_cli_twitch.on('open', (data) => {
    console.log(`[open] ${data}`)
})
ws_cli_twitch.on('close', (code, reason) => {
    console.log(`[close] ${code} - ${reason}`)
    switch (code) {
        case 4000:
            console.log(`Indicates a problem with the server (similar to an HTTP 500 status code).`); break;
        case 4001:
            console.log(`Sending outgoing messages to the server is prohibited with the exception of pong messages.`); break;
        case 4002:
            console.log(`You must respond to ping messages with a pong message. See Ping message.`); break;
        case 4003:
            console.log(`When you connect to the server, you must create a subscription within 10 seconds or the connection is closed. The time limit is subject to change.`); break;
        case 4004:
            console.log(`When you receive a session_reconnect message, you have 30 seconds to reconnect to the server and close the old connection. See Reconnect message.`); break;
        case 4005:
            console.log(`Transient network timeout.`); break;
        case 4006:
            console.log(`Transient network error.`); break;
        case 4007:
            console.log(`The reconnect URL is invalid.`); break;
        default: break;
    }
})
ws_cli_twitch.on('error', (error) => {
    console.log(`[error] ${error}`)
})


ggg()
async function ggg() {
    let getUser = fetch('https://api.twitch.tv/helix/users', {
        method: 'GET',
        headers: {
            'User-Agent': 'NodeJS/22.14.0 fetch/14anthony7095',
            'Client-Id': process.env["TWITCH_CLIENT_ID"]
        }
    }).then((res)=>{
        console.log(res)
    })

}

var sessionID = 'none'
var sessionURL = ''
ws_cli_twitch.on('message', async (data, isBinary) => {
    console.log(`[message] ${isBinary}`)
    console.log(JSON.parse(data))
    if (JSON.parse(data).metadata.message_type == 'session_reconnect') {
        sessionURL = data.payload.session.reconnect_url
        ws_cli_twitch = new WebSocket(sessionURL)
    }
    if (JSON.parse(data).metadata.message_type == 'notification') {
        console.log(`[message].[Notification].[${data.metadata.subscription_type}]`)
    }
    if (JSON.parse(data).metadata.message_type == 'session_welcome') {
        sessionID = JSON.parse(data).payload.session.id
        let res = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
            method: 'POST',
            headers: {
                'User-Agent': 'NodeJS/22.14.0 fetch/14anthony7095',
                'Content-Type': 'application/json',
                'Client-Id': process.env["TWITCH_CLIENT_ID"]
            },
            body: JSON.stringify({
                "type": "stream.online",
                "version": "1",
                "condition": {
                    "broadcaster_user_id": 'krakkacafe',
                },
                "transport": {
                    "method": "websocket",
                    'session_id': sessionID
                }
            })
        })
        let http = await res.json()
        console.log(http)

    }

})
ws_cli_twitch.on('upgrade', (request) => {
    console.log(`[upgrade] ${request}`)
})
ws_cli_twitch.on('ping', (data) => {
    console.log(`[ping] ${data}`)
})
ws_cli_twitch.on('pong', (data) => {
    console.log(`[pong] ${data}`)
})
ws_cli_twitch.on('redirect', (url, request) => {
    console.log(`[redirect] ${url} - ${request}`)
}) */

var ws_svr = new WebSocketServer({ 'port': 8080 })
var lastgmPlyPosRot
ws_svr.on('connection', (ws_connected_client, req) => {

    // console.log( req )

    ws_connected_client.on('message', (data) => {
        if (Buffer.from(data).toString().split('|')[0] == '[E2]') {
            let gmPlyPosRot = Buffer.from(data).toString().split('|')[1]
            console.log(`[WiremodE2]
                X ${Math.max(0, Math.min(127, parseInt((gmPlyPosRot.split(',')[0] - -13247) * 127 / 26494)))}
                Y ${Math.max(0, Math.min(127, parseInt((gmPlyPosRot.split(',')[1] - -13247) * 127 / 26494)))}
                Z ${Math.max(0, Math.min(127, parseInt((gmPlyPosRot.split(',')[2] - -13247) * 127 / 26494)))}`)

            playNote(5, 0, Math.max(0, Math.min(127, parseInt((gmPlyPosRot.split(',')[0] - -13247) * 127 / 26494))))
            playNote(5, 1, Math.max(0, Math.min(127, parseInt((gmPlyPosRot.split(',')[1] - -13247) * 127 / 26494))))
            playNote(5, 2, Math.max(0, Math.min(127, parseInt((gmPlyPosRot.split(',')[2] - -13247) * 127 / 26494))))

        }
    })
})

// oscEmitter.on('osc', (address, value) => {  })
