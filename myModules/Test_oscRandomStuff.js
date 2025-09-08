const { oscEmitter, oscSend, oscSend2 } = require("./Interface_osc_v1");

var autoJump = false
// Bunny Hop / Auto-Jump
oscEmitter.on('osc',(address,value)=>{
    if( address == '/avatar/parameters/Grounded' && value == 1 ){
        oscSend('/input/Jump',1)
            setTimeout(() => { oscSend('/input/Jump',0) }, 100);
    }
})


let avatarsArr = [
'avtr_622722d5-96f2-4f75-9923-ba754dc3d4d7',
'avtr_e9c48d2d-00f1-4567-93cb-c9ba21d0a55f',
'avtr_4aedbebd-ca41-4f98-94d5-e8654bab4dc3',
'avtr_042b32e2-3ce0-4a17-bffe-00068894a00f',
'avtr_ca9b944a-4f94-4a07-8f54-fb845deff2b9',
'avtr_d5b33e88-a366-49f6-88c4-c4b22b3ea16c',
'avtr_abd87d2d-5f69-4e99-aa1d-c424725486e1',
'avtr_bee623f6-5ce3-42cd-83d8-254ad405f9f1',
'avtr_c36caee2-188e-4b81-8bf1-e34c13c0871a',
'avtr_a2da9428-c001-4f58-ab30-99c71e12e80b',
'avtr_b20b8291-3781-4b04-b919-506d939ba33e',
'avtr_f289d0c8-f62d-4d1a-b8fb-bd5cce6ea911',
'avtr_d66cf25b-e69b-4b83-9299-fe7b302de854',
'avtr_209f2227-f431-46a9-97be-018dbe0f577e',
'avtr_8417cf7e-922f-47ab-a3b7-c1b62606791a',
'avtr_1449b434-a360-4a60-a6ec-332484fc964c',
'avtr_3a18ee78-96d6-4ff9-8000-7845107a6da9',
'avtr_5730ccb0-51cc-470b-ab5c-bff2c67df76c',
'avtr_25055a50-ec7a-4868-bdce-4fc34d3609d7',
'avtr_bc6077c8-a89e-41c8-b21e-7950c5ba52dc',
'avtr_41ac3523-c30e-47c1-818a-0694ee35b907',
'avtr_72e59a2f-f1af-4bb4-96e5-818ebcd0ad82',
'avtr_b088ef24-cd80-401f-9582-43dfcc27d916',
'avtr_1483f408-81e0-4c68-a53d-f738661fdeba',
'avtr_492883cf-acc8-4dee-9292-04f2a05caf66',
'avtr_82acee06-1178-4433-8ffd-fbbbf9c565a8',
'avtr_4351b556-810f-4735-9f04-172ba8d8a569',
'avtr_2b99b394-8653-495a-96ea-d9b5ed413ccf',
'avtr_f7564d3d-fe54-4763-bc7d-51232dca04ae']

let avatarsFavArr = [
`avtr_b66fb0e9-f6e7-4aa5-8fd1-942b0da3754f`,
`avtr_769f62fb-28a2-432b-97da-97567b3c83f8`,
`avtr_e7606537-1ce4-4b85-bb02-e7cbc65e333b`,
`avtr_ec02ea4f-0363-4be9-98f1-83853668330f`,
`avtr_b05bcd58-835d-4fc3-843e-689c13cb342d`,
`avtr_22e9c36b-6f6e-45cd-96e2-84067a90a8df`,
`avtr_dd9e0ce0-b742-4aeb-9281-c4597fa72168`,
`avtr_562822ed-bf8f-4bf5-8874-e6c6db98fbce`,
`avtr_fd314f35-0d34-4266-a93c-d735443cf12d`,
`avtr_212019dd-1a92-4cad-8fa3-315fc2171f55`,
`avtr_7f3a03e9-d0e3-4025-b3f2-bc6df98c0410`,
`avtr_90184e9d-6329-4dec-94e5-f1c6421b485c`,
`avtr_6549f8a1-0c3a-4e91-9531-1dd774fd5826`,
`avtr_ed16320a-3446-472d-93c8-04fa275a057f`,
`avtr_7dcff10a-4960-495a-b09d-7abcb1290b52`,
`avtr_e8226429-6741-4a5c-a9d9-059d0c5b5654`,
`avtr_4255f168-2305-45c8-9565-5e71729dc617`,
`avtr_877a7414-59f9-49b7-9f75-f86e6a549b61`,
`avtr_3969b9fe-b30f-4a10-a522-de48998484cd`,
`avtr_75b9f5a5-def3-4620-b547-0bf88677f449`,
`avtr_4d4ca0a6-0d80-4391-af0c-b7fd0212b0ed`,
`avtr_ab2c3895-0c06-4765-9cee-4e7fe42541ad`,
`avtr_4b0cdd7a-7d3d-43a8-bd89-9d9e3a4011e7`,
`avtr_45dbbe88-9ba9-47c7-be5d-18fa4464d446`,
`avtr_10000000-0000-0000-0000-000000000000`,
`avtr_749445a8-d9bf-4d48-b077-d18b776f66f7`,
`avtr_1433fbde-2c66-432f-976e-cb972c1d4cc5`,
`avtr_6bcf1a9a-37ce-47e8-a1b2-766b1cf02dd1`,
`avtr_d43e5564-c846-4f99-87dc-ce0a0ac31378`,
`avtr_1e23b7df-e124-401f-bb87-b8ef44749aca`,
`avtr_36516737-c6e1-47bd-85e6-4f424fa7a568`,
`avtr_87742354-6b94-48e2-8bab-7f67fdca8d7e`,
`avtr_9dec4e8d-ea4a-40f8-8271-4bf616dedd14`,
`avtr_048ce460-f67c-4013-b10b-b3d9e378d642`,
`avtr_394a7aed-0389-42a8-8f3d-fcedeee16601`,
`avtr_6b2467a0-0091-43ee-b88b-b5683035d8f1`,
`avtr_57be3c13-a8c3-450a-bfca-4dce00457f85`,
`avtr_38782662-3ef4-4e45-af17-5084c231299f`,
`avtr_0b0a2568-8946-4b27-a537-299d7ca4cbc8`,
`avtr_07d2afae-7378-4996-971b-5ea365e9be66`,
`avtr_daa0ce18-bfd4-4aa2-be0d-55c418558831`,
`avtr_be73d7fc-ea36-4116-a45b-aa21325cb6ec`,
`avtr_67d3370f-b02d-4f2a-b2ef-4941b4cdc751`,
`avtr_f2375547-3e94-441d-a13f-b8404ee4bf48`,
`avtr_2fbd5892-883e-4b14-a22e-9b2dadb54399`,
`avtr_c61e0706-a19c-49ae-be91-95c991ec43b8`
]

// avatarsArr.forEach((avatarID,index,arr)=>{ setTimeout(() => { oscSend(`/avatar/change`,avatarID) }, 5_000*index); })
// avatarsFavArr.forEach((avatarID,index,arr)=>{ setTimeout(() => { oscSend(`/avatar/change`,avatarID) }, 10_000*index); })
oscSend('/avatar/change','avtr_ca9b944a-4f94-4a07-8f54-fb845deff2b9')
    

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

