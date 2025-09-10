const { WebSocket,WebSocketServer } = require("ws");

// const wss = new WebSocketServer( { port:8080 } )
const wsOSC = new WebSocket(`ws://localhost:4455`)

function remap(value,oldlow,oldhigh,newlow,newhigh){ return newlow + (value - oldlow) * (newhigh - newlow) / (oldhigh - oldlow) }

wsOSC.on('open',listener=>{
    console.log(listener)
})
wsOSC.on('message',(data,isBinary)=>{
console.log(`${data} - ${isBinary}`)
})
wsOSC.on('close',(code,reason)=>{ console.log(`[CLOSE] ${code} ${reason}`) })
wsOSC.on('error',(code,reason)=>{ console.log(`[ERROR] ${code} ${reason}`) })

// wss.on('connection', (ws) => {
//     console.log(`[NodeJS] Something Connected`);
    
//     ws.on('message', (data) => {
//         var line = Buffer.from(data, 'utf8').toString()
//         console.log(`[WSS] ${line}` );
//     });

//     ws.send('You connected to NodeJS');
    
// });

