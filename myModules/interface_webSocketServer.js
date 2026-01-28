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

var ws_svr = new WebSocketServer({ 'port': 8080 })

var lastgmPlyPosRot
ws_svr.on('connection', (ws_connected_client, req) => {

    // console.log( req )

    ws_connected_client.on('message', (data) => {
        if (Buffer.from(data).toString().split('|')[0] == '[E2]') {
            let gmPlyPosRot = Buffer.from(data).toString().split('|')[1]
            console.log(`[WiremodE2]
                X ${Math.max(0,Math.min(127,parseInt( (gmPlyPosRot.split(',')[0] - -13247) * 127 / 26494 )))}
                Y ${Math.max(0,Math.min(127,parseInt( (gmPlyPosRot.split(',')[1] - -13247) * 127 / 26494 )))}
                Z ${Math.max(0,Math.min(127,parseInt( (gmPlyPosRot.split(',')[2] - -13247) * 127 / 26494 )))}`)
            
            playNote(5,0, Math.max(0,Math.min(127,parseInt( (gmPlyPosRot.split(',')[0] - -13247) * 127 / 26494 ))) )
            playNote(5,1, Math.max(0,Math.min(127,parseInt( (gmPlyPosRot.split(',')[1] - -13247) * 127 / 26494 ))) )
            playNote(5,2, Math.max(0,Math.min(127,parseInt( (gmPlyPosRot.split(',')[2] - -13247) * 127 / 26494 ))) )

        }
    })
})

// oscEmitter.on('osc', (address, value) => {  })
