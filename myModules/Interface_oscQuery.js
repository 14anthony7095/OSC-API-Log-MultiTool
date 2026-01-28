const { OSCQueryServer, OSCTypeSimple, OSCQAccess, OSCQueryDiscovery } = require("oscquery");

// const service = new OSCQueryServer();
const discover = new OSCQueryDiscovery();

discover.start()
discover.on('up',(serv)=>{
    if( serv.hostInfo.name.includes('VRChat-Client')){
        console.log(`Found ${serv.hostInfo.name} on Port ${serv.port}`)
        var parameters = serv.flat()
        for( i = 0 ; i < parameters.length ; i++ ){
            console.log(`${(parameters[i].full_path).padEnd(55,' ')} - ${parameters[i].access == 1 ? 'Read' : parameters[i].access == 2 ? 'Write' : 'Read-Write'} - ${ JSON.stringify(parameters[i].arguments) }`)
        }
    }
})