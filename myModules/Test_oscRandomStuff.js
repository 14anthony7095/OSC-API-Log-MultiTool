var osc = require('osc');
var udpPort = new osc.UDPPort({ localAddress: '127.0.0.1', localPort: 9100 })
udpPort.open()
function oscSend(a, v) {
	udpPort.send({
		address: a,
		args: [v]
	}, '127.0.0.1', 9000);
}
function oscSend6(addr, v1, v2, v3, v4, v5, v6) {
	udpPort.send({
		address: addr,
		args: [v1, v2, v3, v4, v5, v6]
	}, '127.0.0.1', 9000)
}



oscSend('/usercamera/Mode', parseInt(0))
setTimeout(() => {
	oscSend('/usercamera/Mode', parseInt(1))
	// oscSend6('/usercamera/Pose', 0, 0, 0, 0, 0, 0)
	oscSend('/usercamera/Zoom', 30)
	setTimeout(() => {
		oscSend('/usercamera/Capture', true)
		setTimeout(() => {
			oscSend('/usercamera/Capture', false)
			oscSend('/usercamera/Close', true)
			oscSend('/usercamera/Mode', parseInt(0))
			setTimeout(() => {
				oscSend('/usercamera/Close', false)
			}, 2000)
		}, 2000)
	}, 2000)
}, 2000)