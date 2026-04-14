# PixelFlux

## About
Three.js based Minecraft 3D model renderer for web pages.

## How to use
### JS
``` javascript
import { initScene, createMinecraftBlockMesh } from 'https://shwan6160.github.io/PixelFlux/pixelflux.js';
import { addEBM } from 'https://shwan6160.github.io/PixelFlux/addon/apotheosis.js';

window.addEventListener('DOMContentLoaded', async () => {
    const url1 = "<block model json url>";
    const view1 = initScene('view1');
    const model1 = await createMinecraftBlockMesh(url1);
    const model1EBM = await addEBM(url1);
    if (model1EBM) {
        view1.scene.add(model1EBM);
    }
    view1.scene.add(model1);
});
```

### HTML
``` html
<div id="view1"></div>
```

