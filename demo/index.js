import { initScene, createMinecraftBlockMesh } from 'https://esm.sh/gh/shwan6160/PixelFlux@v0.1.1/dist/pixelflux.js';
import { addEBM } from 'https://esm.sh/gh/shwan6160/PixelFlux@v0.1.1/dist/addon/apotheosis.js';

window.addEventListener('DOMContentLoaded', async () => {

const url1 = "https://raw.githubusercontent.com/Shadows-of-Fire/Apotheosis/refs/heads/1.21/src/main/resources/assets/apotheosis/models/block/reforging_table.json";
const view1 = initScene('view1');
const model1 = await createMinecraftBlockMesh(url1);
const model1EBM = await addEBM(url1);
if (model1EBM) {
    view1.scene.add(model1EBM);
}
view1.scene.add(model1);

const url2 = "https://raw.githubusercontent.com/Shadows-of-Fire/Apotheosis/refs/heads/1.21/src/main/resources/assets/apotheosis/models/block/augmenting_table.json";
const view2 = initScene('view2');
const model2 = await createMinecraftBlockMesh(url2);
const model2EBM = await addEBM(url2);
if (model2EBM) {
    view2.scene.add(model2EBM);
}
view2.scene.add(model2);

const url3 = "https://raw.githubusercontent.com/Shadows-of-Fire/Apotheosis/refs/heads/1.21/src/main/resources/assets/apotheosis/models/block/gem_cutting_table.json";
const view3 = initScene('view3');
const model3 = await createMinecraftBlockMesh(url3);
const model3EBM = await addEBM(url3);
if (model3EBM) {
    view3.scene.add(model3EBM);
}
view3.scene.add(model3);

});
