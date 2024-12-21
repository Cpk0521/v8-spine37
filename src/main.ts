import { Application, Assets } from "pixi.js";
import './v8/assets/atlasLoader';
import './v8/assets/skeletonLoader'
import { Spine } from "./v8/Spine";
import './v8/SpinePipe'

(async ()=>{

    const app = new Application();

    await app.init({
        hello : true,
        width : 1334,
        height : 750,
        backgroundColor : 0x000000,
    });

    globalThis.__PIXI_APP__ = app;

    document.body.appendChild(app.canvas);

    // WDS
    // await Assets.load([
    //     {alias: 'modelskel', src: 'https://raw.githubusercontent.com/nan0521/WDS-Adv-Resource/main/spine/10201.skel'},
    //     {alias: 'modelatlas', src: 'https://raw.githubusercontent.com/nan0521/WDS-Adv-Resource/main/spine/10201.atlas'}
    // ])

    // SC
    // await Assets.load([
    //     {alias: 'modelskel', src: 'data.json'},
    //     {alias: 'modelatlas', src: 'data.atlas'}
    // ])


    // CUE
    // await Assets.load([
    //     {alias: 'modelskel', src: './root.skel'},
    //     {alias: 'modelatlas', src: './root.atlas'}
    // ])
    
    // SPIME simple
    await Assets.load([
        {alias: 'modelskel', src: './spineboy-pro.json'},
        {alias: 'modelatlas', src: './spineboy-pma.atlas'}
    ])

    const model = Spine.from({
        skeleton : 'modelskel',
        atlas : 'modelatlas',
        scale : 0.5
    })


    model.x = 500;
    model.y = 500;

    app.stage.addChild(model);


})();