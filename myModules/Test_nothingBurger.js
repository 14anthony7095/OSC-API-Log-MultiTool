const { oscSend } = require('./Interface_osc_v1')
var fs = require('fs')


function old() {
    var dataCache = {}
    memberlist.forEach((mem, index, arr) => {
        var dataTarget = mem.isRepresenting
        if (isNaN(dataCache[dataTarget])) {
            dataCache[dataTarget] = 1
        } else {
            dataCache[dataTarget]++
        }

        if (index + 1 == arr.length) {
            console.log(dataCache)
        }
    })
}

var cycleParamList = {
    'Hat Toggle': 'bool',
    'Uniform Toggle': 'bool',
    'reinit': 'bool'
}
function cycleParams(List) {
    Object.keys(List).forEach(param => {
        let valtype = List[param]
        oscSend('/avatar/parameters/'+param, valtype == 'bool' ? Math.random() > 0.5 : false )
    })
    setTimeout(()=>{ cycleParams(List) },1000)
}
// cycleParams(cycleParamList)

function makeEpisodeQueueList(series = 'unnamed', type = 'TV-Show', seasondata = [10, 11, 4]) {
    var eplist = `# ${series}
**${type}**`
    seasondata.forEach((s, index, arr) => {
        eplist += `\n    Season ${index + 1}
\``
        for (i = 0; i < s; i++) {
            eplist += ` ${i + 1}`.padStart(2, "0")
        }
        eplist += `\``
    })

    console.log(eplist)
}

// makeEpisodeQueueList(`Samurai Jack`,`Anime`,[13,13,13,13,10])



// countEntries(``)
function countEntries(list) {
    let counts = {}
    list.split(`\n`).forEach(name => {
        if (!counts[name]) {
            counts[name] = 1
        } else {
            counts[name]++
        }
    })
    console.log(counts)
}
// setInterval(()=>{},30)


for (let index = 0; index < 65; index++) {
    let yamlstring =`%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!74 &7400000
AnimationClip:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  m_Name: p${index}
  serializedVersion: 7
  m_Legacy: 0
  m_Compressed: 0
  m_UseHighQualityCurve: 1
  m_RotationCurves: []
  m_CompressedRotationCurves: []
  m_EulerCurves: []
  m_PositionCurves: []
  m_ScaleCurves: []
  m_FloatCurves:
  - serializedVersion: 2
    curve:
      serializedVersion: 2
      m_Curve:
      - serializedVersion: 3
        time: 0
        value: 0
        inSlope: 0
        outSlope: 6
        tangentMode: 69
        weightedMode: 0
        inWeight: 0.33333334
        outWeight: 0.33333334
      - serializedVersion: 3
        time: 0.16666667
        value: 1
        inSlope: 6
        outSlope: 0
        tangentMode: 69
        weightedMode: 0
        inWeight: 0.33333334
        outWeight: 0.33333334
      m_PreInfinity: 2
      m_PostInfinity: 2
      m_RotationOrder: 4
    attribute: material._pixel${index}
    path: Body/screen
    classID: 23
    script: {fileID: 0}
    flags: 0
  m_PPtrCurves: []
  m_SampleRate: 60
  m_WrapMode: 0
  m_Bounds:
    m_Center: {x: 0, y: 0, z: 0}
    m_Extent: {x: 0, y: 0, z: 0}
  m_ClipBindingConstant:
    genericBindings:
    - serializedVersion: 2
      path: 547659210
      attribute: 2180946648
      script: {fileID: 0}
      typeID: 23
      customType: 22
      isPPtrCurve: 0
      isIntCurve: 0
      isSerializeReferenceCurve: 0
    pptrCurveMapping: []
  m_AnimationClipSettings:
    serializedVersion: 2
    m_AdditiveReferencePoseClip: {fileID: 0}
    m_AdditiveReferencePoseTime: 0
    m_StartTime: 0
    m_StopTime: 0.16666667
    m_OrientationOffsetY: 0
    m_Level: 0
    m_CycleOffset: 0
    m_HasAdditiveReferencePose: 0
    m_LoopTime: 1
    m_LoopBlend: 0
    m_LoopBlendOrientation: 0
    m_LoopBlendPositionY: 0
    m_LoopBlendPositionXZ: 0
    m_KeepOriginalOrientation: 0
    m_KeepOriginalPositionY: 1
    m_KeepOriginalPositionXZ: 0
    m_HeightFromFeet: 0
    m_Mirror: 0
  m_EditorCurves:
  - serializedVersion: 2
    curve:
      serializedVersion: 2
      m_Curve:
      - serializedVersion: 3
        time: 0
        value: 0
        inSlope: 0
        outSlope: 6
        tangentMode: 69
        weightedMode: 0
        inWeight: 0.33333334
        outWeight: 0.33333334
      - serializedVersion: 3
        time: 0.16666667
        value: 1
        inSlope: 6
        outSlope: 0
        tangentMode: 69
        weightedMode: 0
        inWeight: 0.33333334
        outWeight: 0.33333334
      m_PreInfinity: 2
      m_PostInfinity: 2
      m_RotationOrder: 4
    attribute: material._pixel${index}
    path: Body/screen
    classID: 23
    script: {fileID: 0}
    flags: 0
  m_EulerEditorCurves: []
  m_HasGenericRootTransform: 0
  m_HasMotionFloatCurves: 0
  m_Events: []`
  fs.writeFile('./anims/p'+index+'.anim',yamlstring,(err)=>{ err ? console.log(err) : console.log('created p'+index) })

}