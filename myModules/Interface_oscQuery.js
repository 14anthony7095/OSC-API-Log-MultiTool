const {	OSCQueryServer,	OSCTypeSimple, OSCQAccess, OSCQueryDiscovery } = require("oscquery");

const discovery = new OSCQueryDiscovery();
var WebSocket = require("ws");
const { Server } = require('node-osc');

var vrcClientName = new RegExp(/VRChat-Client-[\w|\d]{6}/)
let selfLog = `\x1b[0m[\x1b[34mOSCv3\x1b[0m]`


discovery.start();

discovery.on('up',(re)=>{
    //console.log('[OSCQuery Discovery] UP')
    if( vrcClientName.test(re._hostInfo.name) ){
        console.log('Found vrchat\'s endpoint')
        console.log(re)

        
        var oscServer = new Server(9001, '127.0.0.1', () => { console.log('OSC Server is listening') })
        oscServer.on('message', function (msg) {
            console.log(`Message: ${msg}`);
            //oscServer.close();
        });
        /*
        const service = new OSCQueryServer({
            //oscPort: re._hostInfo.oscPort,
            oscPort: re.port,
            //httpPort: re._hostInfo.oscPort,
            httpPort: re.port,
            bindAddress: re.address,
            oscQueryHostName: re._hostInfo.name,
            oscIp: re.address,
            oscTransport: "UDP",
            serviceName: "14aOSC-Query-Test"
        });

        service.addMethod("/avatar/parameters/14a/GogglesEnable", {
            description: "Are my goggles visible",
            access: OSCQAccess.READWRITE,
            arguments: [
                {
                    type: OSCTypeSimple.TRUE
                }
            ]
        });
        service.setValue("/avatar/parameters/14a/GogglesEnable", 0, true);
        
        // service.vrcClientName

        service.start().then(() => {
            console.log(`OSCQuery server is listening on port ${re.port}`);
        });
        */
    }
});