// import { oscSend } from "./Interface_osc_v2"

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





// New_low + (value - Old_low) * (New_high - New_low) / (Old_high - Old_low)

// oscSend('/avatar/parameters/Face_Terror',1==0)
oscSend('/usercamera/Mode', parseInt(0))
setTimeout(() => {
    oscSend('/usercamera/Mode', parseInt(1))
    // oscSend6('/usercamera/Pose', 0, 0, 0, 0, 0, 0)
    oscSend('/usercamera/Zoom', 30)
    setTimeout(() => {
        oscSend('/usercamera/Capture',true)
        setTimeout(() => {
            oscSend('/usercamera/Capture', false)
            oscSend('/usercamera/Close',true)
            oscSend('/usercamera/Mode', parseInt(0))
            setTimeout(() => {
                oscSend('/usercamera/Close', false)
            }, 2000)
        }, 2000)
    }, 2000)
}, 2000)
// oscSend('/avatar/parameters/Body/NSFW/Local',1==0)
// oscSend('/avatar/parameters/Body/NSFW/Friends',1==0)
// oscSend('/avatar/parameters/Body/NSFW/Shaft/OG',1==0)
// oscSend('/avatar/parameters/Body/NSFW/Shaft/Human',1==1)
// oscSend('/avatar/parameters/Body/NSFW/Shaft/Canine',1==0)
// oscSend('/avatar/parameters/Body/NSFW/Shaft/Hors',1==0)

// var faceParams = ['TongueSteps','MouthLowerOverlay','PuffLeftOverturn','PuffSuckRight','SmileSadLeft','SmileRightPout','JawX','EyesDilation',
// 'EyeDilationEnabled','MouthLower','MouthUpper','MouthLowerDownRightLowerInside',
// 'MouthUpperUpRightUpperInside','JawOpenApe','EyesY','RightEyeX','LeftEyeX']

// var faceParams = ['TongueSteps','MouthLowerOverlay','PuffLeftOverturn','PuffSuckRight','SmileSadLeft','SmileRightPout','JawX','EyesDilation',
// 'RightEyeLidExpandedSqueeze','LeftEyeLidExpandedSqueeze','EyeDilationEnabled','MouthLower','MouthUpper','MouthLowerDownRightLowerInside',
// 'MouthUpperUpRightUpperInside','JawOpenApe','EyesY','RightEyeX','LeftEyeX']
// faceParams.forEach(parm=>{ oscSend(`/avatar/parameters/${parm}`, 0 ) })

// oscSend(`/avatar/parameters/RightEyeLidExpandedSqueeze`, 1 )
// oscSend(`/avatar/parameters/LeftEyeLidExpandedSqueeze`, 1 )

// var faceParamsBool = ['TongueX1','TongueX2','TongueX4','TongueXNegative','TongueY1','TongueY2','TongueY4','JawForward1','JawForward2','JawForward4','TongueYNegative']
// faceParamsBool.forEach(parm=>{ oscSend(`/avatar/parameters/${parm}`, false ) })

// randomFace()
function randomFace() {
    for (x = 0; x < 1; x++) {
        var randID = Math.round(Math.random() * faceParams.length)
        var randVal = -1 + (Math.random() * 2)
        faceParams[randID]
        oscSend(`/avatar/parameters/${faceParams[randID]}`, randVal)
    }

    var randIDb = Math.round(Math.random() * faceParamsBool.length)
    var randValb = Math.round(Math.random()) == 1
    faceParamsBool[randIDb]
    oscSend(`/avatar/parameters/${faceParamsBool[randIDb]}`, randValb)

    setTimeout(() => {
        randomFace()
    }, 200);
}

// randomValues()
function randomValues() {
    faceParams.forEach((blend) => {
        oscSend(`/avatar/parameters/${blend}`, -1 + (Math.random() * 2))
    })
    faceParamsBool.forEach((blend) => {
        oscSend(`/avatar/parameters/${blend}`, Math.round(Math.random()) == 1)
    })

    setTimeout(() => {
        randomValues()
    }, 200);
}

// BodyTexture 0 - 7
// HueShift 0.00 - 1.00
function randizeChicken() {
    let randTex = Math.round(Math.random() * 7)
    let randHue = Math.random()
    oscSend('/avatar/parameters/BodyTexture', randTex)
    oscSend('/avatar/parameters/HueShift', randHue)
    console.log(`Randomizing Chickenbread nana to: Tex ${randTex} | Hue ${randHue}`)
}
// randizeChicken(); setInterval(()=>{ randizeChicken() },60_000)

