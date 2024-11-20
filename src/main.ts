import { Application, Assets } from "pixi.js";
import './loader/atlasLoader'
import './loader/skeletonLoader'
import { Spine } from "./Spine";
import "./SpinePipe";


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
    
    const spineAsset = await Assets.load('./root.json');
    // console.log(spineAsset)

    const spine = new Spine(spineAsset.spineData);
    console.log(spine)

    // app.stage.addChild(spine);


})();