const { WebSocketServer, WebSocket } = require('ws')

var ws_svr = new WebSocketServer({ 'port': 8080 })

ws_svr.on('connection', (ws_connected_client,req) => {

    // console.log( req )

    ws_connected_client.on('message', (data) => {
        console.log( Buffer.from(data).toString() )
    })

})