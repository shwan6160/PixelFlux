// addon-apotheosis.js

// Apotheosis mod texture URL base
const ASSET_BRANCH = "1.21";
const APOTHEOSIS_ASSET_URL = `https://raw.githubusercontent.com/Shadows-of-Fire/Apotheosis/refs/heads/${ASSET_BRANCH}/src/main/resources/assets/apotheosis`;

export function isApotheosisNamespace(path) {
    return path.startsWith('apotheosis:');
}

export function resolveApotheosisTextureUrl(path) {
    // 예: "apotheosis:blocks/augmenting/top" -> "blocks/augmenting/top"
    const cleanPath = path.split(':')[1];
    
    // 특수 예외 처리가 필요한 경우 여기에 추가 (망치 텍스처 하드코딩 등)
    if (cleanPath === "blocks/augmenting/bottom") {
        // 특정 텍스처에 대한 특별한 로직이 있다면 여기서 처리
    }

    return `${APOTHEOSIS_ASSET_URL}/textures/${cleanPath}.png`;
}