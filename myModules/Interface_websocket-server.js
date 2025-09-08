const { WebSocketServer } = require("ws");

const wss = new WebSocketServer( { port:8080 } )

function remap(value,oldlow,oldhigh,newlow,newhigh){ return newlow + (value - oldlow) * (newhigh - newlow) / (oldhigh - oldlow) }


wss.on('connection', (ws) => {
    console.log(`[NodeJS] Something Connected`);
    
    ws.on('message', (data) => {
        var line = Buffer.from(data, 'utf8').toString()
        console.log(`[WSS] ${line}` );
    });

    ws.send('You connected to NodeJS');
    
});

