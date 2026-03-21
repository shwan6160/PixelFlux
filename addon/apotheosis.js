// addon-apotheosis.js

// Apotheosis mod texture URL base
const ASSET_BRANCH = "1.21";
const APOTHEOSIS_ASSET_URL = `https://raw.githubusercontent.com/Shadows-of-Fire/Apotheosis/refs/heads/${ASSET_BRANCH}/src/main/resources/assets/apotheosis`;

export function isApotheosisNamespace(path) {
    return path.startsWith('apotheosis:');
}

export async function addEBM(scene, url) {
}

