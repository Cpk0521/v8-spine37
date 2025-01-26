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

    // SC
    // await Assets.load([
    //     {alias: 'modelskel', src: './public/data.json'},
    //     {alias: 'modelatlas', src: './public/data.atlas'}
    // ])

    // CUE
    await Assets.load([
        {alias: 'modelskel', src: './public/root.skel'},
        {alias: 'modelatlas', src: './public/root.atlas'}
    ])

    const model = Spine.from({
        skeleton : 'modelskel',
        atlas : 'modelatlas',
        scale : .6
    })
    // model.debug = new SpineDebugRenderer();

    // //SC
    // model.state.setAnimation(0, "wait", true);
    // window.addEventListener('click', ()=>{
    //     model.state.setAnimation(0, "anger1", false);
    // })

    // //CUE
    // // window.addEventListener('click', ()=>{
        model.state.setAnimation(0, "01_001_wait", true);
    // // })

    model.x = 500;
    model.y = 400;
    // model.angle = 180;

    app.stage.addChild(model);


})();