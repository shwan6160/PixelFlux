import * as THREE from 'three';

import { createMinecraftBlockMesh } from '../pixelflux.js';

// Apotheosis mod texture URL base
const ASSET_BRANCH = "1.21";
const APOTHEOSIS_ASSET_URL = `https://raw.githubusercontent.com/Shadows-of-Fire/Apotheosis/refs/heads/${ASSET_BRANCH}/src/main/resources/assets/apotheosis`;

export function isApotheosisNamespace(path) {
    return path.includes('apotheosis');
}

export async function addEBM(url) {
    if (url.includes('augmenting_table')) {
        const ebmBlock = await loadAugmentingTableEBM();
        return ebmBlock;
    } else if (url.includes('reforging_table')) {
        const ebmBlock = await loadReforgingTableEBM();
        return ebmBlock;
    } else {
        return null;
    }
}

async function loadAugmentingTableEBM() {
    const ebmJsonUrl = 'https://raw.githubusercontent.com/Shadows-of-Fire/Apotheosis/refs/heads/1.21/src/main/resources/assets/apotheosis/models/item/star_cube.json';
    const ebmBlock = await createMinecraftBlockMesh(ebmJsonUrl);
    
    const diagonalVector = new THREE.Vector3(1, 1, 1).normalize();
    const upVector = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(diagonalVector, upVector);
    
    ebmBlock.quaternion.copy(quaternion);
    ebmBlock.position.y = 1.2;
    
    return ebmBlock;
}

async function loadReforgingTableEBM() {
    const ebmJsonUrl = 'https://raw.githubusercontent.com/Shadows-of-Fire/Apotheosis/refs/heads/1.21/src/main/resources/assets/apotheosis/models/item/hammer.json';
    const ebmBlock = await createMinecraftBlockMesh(ebmJsonUrl);

    // 1. [모델 원점 교정] 
    // 모델의 원점이 구석에 있으면 회전 시 날아갑니다. 
    // 일단 모델의 중심을 (0,0,0)으로 옮겨서 회전 축을 안정화합니다.
    const box = new THREE.Box3().setFromObject(ebmBlock);
    const center = new THREE.Vector3(0, -0.5, 0);
    box.getCenter(center);
    ebmBlock.children.forEach(child => child.position.sub(center));

    const size = new THREE.Vector3();
    box.getSize(size);
    ebmBlock.children.forEach(child => child.position.z -= size.z * 0.5);

    // 2. [사용자 정의 좌표]
    const P = new THREE.Vector3(0.24, 0.43, 0.24);    // 망치가 놓일 위치
    const T1 = new THREE.Vector3(0.12, 0.25, 0.12); // 머리가 가리킬 좌표
    const T2 = new THREE.Vector3(0.5, 0.27, 0.5);     // 손잡이가 가리킬 좌표

    // 3. [로컬 벡터 지정] 회전 전 모델에서 "어디가 머리고 어디가 손잡이인가"
    // 보통 마인크래프트 아이템은 Z가 정면(머리), X가 오른쪽(손잡이)입니다.
    const localHeadVec = new THREE.Vector3(0, 0, 1);
    const localHandleVec = new THREE.Vector3(1, 0, 0);

    // 4. [월드 방향 계산] P에서 목표 좌표를 바라보는 실제 방향
    const targetHeadDir = T1.clone().sub(P).normalize();
    const targetHandleDirRaw = T2.clone().sub(P).normalize();

    // 5. [회전 계산] 두 단계를 거쳐 회전시킵니다.
    // (1) 머리 방향을 먼저 맞춥니다.
    const q1 = new THREE.Quaternion().setFromUnitVectors(localHeadVec, targetHeadDir);
    
    // (2) 머리 축을 고정하고, 손잡이가 T2를 최대한 바라보도록 Roll 회전을 줍니다.
    const currentHandleVec = localHandleVec.clone().applyQuaternion(q1);
    const targetHandleDir = targetHandleDirRaw.clone().projectOnPlane(targetHeadDir).normalize();
    const q2 = new THREE.Quaternion().setFromUnitVectors(currentHandleVec, targetHandleDir);

    // 6. [최종 적용] 위치와 회전을 동시에 고정
    ebmBlock.quaternion.copy(q2).multiply(q1);
    ebmBlock.position.copy(P); // 이제 P 좌표에서 정확히 회전합니다.

    return ebmBlock;
}

