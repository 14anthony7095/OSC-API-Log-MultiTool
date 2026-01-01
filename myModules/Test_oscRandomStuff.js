const { oscEmitter, oscSend, oscSend2 } = require("./Interface_osc_v1");

var autoJump = false
// Bunny Hop / Auto-Jump
oscEmitter.on('osc',(address,value)=>{
    if( address == '/avatar/parameters/Grounded' && value == 1 ){
        oscSend('/input/Jump',1)
            setTimeout(() => { oscSend('/input/Jump',0) }, 100);
    }
})




// avatarsArr.forEach((avatarID,index,arr)=>{ setTimeout(() => { oscSend(`/avatar/change`,avatarID) }, 5_000*index); })
// avatarsFavArr.forEach((avatarID,index,arr)=>{ setTimeout(() => { oscSend(`/avatar/change`,avatarID) }, 10_000*index); })
// oscSend('/avatar/change','avtr_ca9b944a-4f94-4a07-8f54-fb845deff2b9')

oscSend('/avatar/parameters/toggle/onesie',true)
    

// oscSend('/avatar/parameters/Face_Terror',1==0)

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
    for(x=0; x<1; x++){
        var randID = Math.round( Math.random() * faceParams.length )
        var randVal = -1 + (Math.random() * 2 )
        faceParams[ randID ]
        oscSend(`/avatar/parameters/${ faceParams[randID] }`, randVal )
    }

    var randIDb = Math.round( Math.random() * faceParamsBool.length )
    var randValb = Math.round( Math.random() ) == 1
    faceParamsBool[ randIDb ]
    oscSend(`/avatar/parameters/${ faceParamsBool[randIDb] }`, randValb )
    
    setTimeout(() => {
        randomFace()
    }, 200);
}

// randomValues()
function randomValues() {
    faceParams.forEach((blend)=>{
        oscSend(`/avatar/parameters/${blend}`, -1 + (Math.random() * 2 ) )
    })
    faceParamsBool.forEach((blend)=>{
        oscSend(`/avatar/parameters/${blend}`, Math.round( Math.random() ) == 1 )
    })

    setTimeout(() => {
        randomValues()
    }, 200);
}

// BodyTexture 0 - 7
// HueShift 0.00 - 1.00
function randizeChicken() {
    let randTex = Math.round( Math.random() * 7 )
    let randHue = Math.random()
    oscSend( '/avatar/parameters/BodyTexture' , randTex )
    oscSend( '/avatar/parameters/HueShift' , randHue )
    console.log(`Randomizing Chickenbread nana to: Tex ${randTex} | Hue ${randHue}`)
}
// randizeChicken(); setInterval(()=>{ randizeChicken() },60_000)

