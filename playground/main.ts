import { Application, Assets } from "pixi.js";
import '../src'
import { Spine, SpineDebugRenderer } from "../src";

(async ()=>{

    const app = new Application();

    await app.init({
        hello : true,
        width : 1334,
        height : 750,
        backgroundColor : 0x000000,
        resizeTo : window
    });

    globalThis.__PIXI_APP__ = app;

    document.body.appendChild(app.canvas);

    // WDS
    // await Assets.load([
    //     {alias: 'modelskel', src: 'https://raw.githubusercontent.com/nan0521/WDS-Adv-Resource/main/spine/10201.skel'},
    //     {alias: 'modelatlas', src: 'https://raw.githubusercontent.com/nan0521/WDS-Adv-Resource/main/spine/10201.atlas'}
    // ])

    // SC
    await Assets.load([
        {alias: 'modelskel', src: './public/data.json'},
        {alias: 'modelatlas', src: './public/data.atlas'}
    ])

    // CUE
    // await Assets.load([
    //     {alias: 'modelskel', src: './root.json'},
    //     {alias: 'modelatlas', src: './root.atlas'}
    // ])
    
    // SPIME simple
    // await Assets.load([
    //     {alias: 'modelskel', src: './spineboy-pro.json'},
    //     {alias: 'modelatlas', src: './spineboy-pma.atlas'}
    // ])

    const model = Spine.from({
        skeleton : 'modelskel',
        atlas : 'modelatlas',
        scale : .6
    })
    // model.debug = new SpineDebugRenderer();

    // //SC
    model.state.setAnimation(0, "wait", true);
    window.addEventListener('click', ()=>{
        model.state.setAnimation(0, "anger1", false);
    })

    // //CUE
    // // window.addEventListener('click', ()=>{
    // //     model.state.setAnimation(0, "01_001_wait", false);
    // // })

    model.x = 500;
    model.y = 400;
    // model.angle = 180;

    app.stage.addChild(model);


})();