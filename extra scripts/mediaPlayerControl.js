console.log('Started..')
const { Client, Server } = require('node-osc');
const fetch = require('node-fetch');
const WebSocket = require('ws');


const {MpcControl} = require("mpc-hc-control");
const mpcApi = new MpcControl("localhost", 13579)
// CONTROL INPUT
/*
	mpcApi.openFile('path');
	mpcApi.setVolume(100);
	mpcApi.toggleMute()
	mpcApi.togglePlay() --> mpcApi.play() --- mpcApi.pause()
	mpcApi.skipBack()
	mpcApi.skipForward()
	mpcApi.stop()
	mpcApi.seek(position: number)
*/

// client.send('/address/', 1, (err) => { if (err) console.error(err) })

var serverVRC = new Server(9001, '0.0.0.0');
serverVRC.on('listening', () => { console.log('[OSC] Listening from VRChat.') })
var loglevel = 0
serverVRC.on('message', (msg) => {
	// Console Log
	if( loglevel == 0){
		if( !msg.toString().includes('parameters/AngularY') 
		&& !msg.toString().includes('parameters/VelocityX') 
		&& !msg.toString().includes('parameters/VelocityY') 
		&& !msg.toString().includes('parameters/VelocityZ') ){
			console.log(`[VRChat -> OSC] Received: ${msg}`)
		}
	}else if( loglevel == 1){
		console.log(`[VRChat -> OSC] Received: ${msg}`)
	}
	if( msg.toString().includes('/parameters/mpcPlayToggle,1') ){
		mpcApi.togglePlay()
	}
	if( msg.toString().includes('/parameters/mpcSkipBack,1') ){
		mpcApi.skipBack()
	}
	if( msg.toString().includes('/parameters/mpcSkip,1') ){
		mpcApi.skipForward()
	}
});

var clientVRC = new Client('127.0.0.1', 9000);

var mpcGetLoop = setInterval(()=>{
// READ FETCH
	mpcApi.getVariables().then(r=>{
	console.log('[MPC] === === === === === === ===')
	
		console.log('[MPC] state: '+r.state+' ['+r.statestring+']')
		clientVRC.send('/avatar/parameters/mpcState', parseInt(r.state), (err) => { if (err) console.error(err) })	
		
		console.log('[MPC] Timeline as Float: '+( r.position / r.duration )+'F' )
		clientVRC.send('/avatar/parameters/mpcTimeline', parseFloat( r.position / r.duration ), (err) => { if (err) console.error(err) })	
			
		console.log('[MPC] Position String as Ints: '+r.positionstring.split(':')[0]+' '+r.positionstring.split(':')[1]+' '+r.positionstring.split(':')[2])
		console.log('[MPC] Duration String as Ints: '+r.durationstring.split(':')[0]+' '+r.durationstring.split(':')[1]+' '+r.durationstring.split(':')[2])
		clientVRC.send('/avatar/parameters/mpcPosS', parseInt( r.positionstring.split(':')[2] ), (err) => { if (err) console.error(err) })	
		clientVRC.send('/avatar/parameters/mpcPosM', parseInt( r.positionstring.split(':')[1] ), (err) => { if (err) console.error(err) })	
		clientVRC.send('/avatar/parameters/mpcPosH', parseInt( r.positionstring.split(':')[0] ), (err) => { if (err) console.error(err) })	
		clientVRC.send('/avatar/parameters/mpcDurS', parseInt( r.durationstring.split(':')[2] ), (err) => { if (err) console.error(err) })	
		clientVRC.send('/avatar/parameters/mpcDurM', parseInt( r.durationstring.split(':')[1] ), (err) => { if (err) console.error(err) })	
		clientVRC.send('/avatar/parameters/mpcDurH', parseInt( r.durationstring.split(':')[0] ), (err) => { if (err) console.error(err) })	
		
		console.log('[MPC] volumelevel: '+r.volumelevel / 100+'F [Muted: '+r.muted+']')
		clientVRC.send('/avatar/parameters/mpcVol', parseFloat( r.volumelevel / 100 ), (err) => { if (err) console.error(err) })	
		clientVRC.send('/avatar/parameters/mpcMuted', r.muted, (err) => { if (err) console.error(err) })	
		
	console.log('[MPC] === === === === === === ===')
	}).catch((err)=>{console.log('[MPC] mpc-hc is not running, stopping interval until restart');clearInterval(mpcGetLoop)})
},1000)