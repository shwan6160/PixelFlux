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
    const ebmJsonUrl = APOTHEOSIS_ASSET_URL + '/models/item/star_cube.json';
    const ebmBlock = await createMinecraftBlockMesh(ebmJsonUrl);
    
    const diagonalVector = new THREE.Vector3(1, 1, 1).normalize();
    const upVector = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(diagonalVector, upVector);
    
    ebmBlock.quaternion.copy(quaternion);
    ebmBlock.position.y = 1.2;
    
    return ebmBlock;
}

async function loadReforgingTableEBM() {
    const ebmJsonUrl = APOTHEOSIS_ASSET_URL + '/models/item/hammer.json';
    const ebmBlock = await createMinecraftBlockMesh(ebmJsonUrl);

    // hammer EBM의 모델 중심 재설정
    const box = new THREE.Box3().setFromObject(ebmBlock);
    const center = new THREE.Vector3(0, -0.5, 0);
    box.getCenter(center);
    ebmBlock.children.forEach(child => child.position.sub(center));

    const size = new THREE.Vector3();
    box.getSize(size);
    ebmBlock.children.forEach(child => child.position.z -= size.z * 0.5);


    const P = new THREE.Vector3(0.25, 0.5, 0.25);    // 망치가 놓일 위치
    const T1 = new THREE.Vector3(0, 0.25, 0); // 머리가 가리킬 좌표
    const T2 = new THREE.Vector3(0.5, 0.25, 0.5);     // 손잡이가 가리킬 좌표

    // 정렬이 필요한 축 벡터로 정의
    const localHeadVec = new THREE.Vector3(0, 0, 1); // 망치가 때리는 방향
    const localHandleVec = new THREE.Vector3(1, 0, 0); // 망치 손잡이가 향하는 방향

    // 망치의 위치 P에서 목표 좌표를 바라보는 방향 벡터
    const targetHeadDir = T1.clone().sub(P).normalize(); // Vec P to T1
    const targetHandleDirRaw = T2.clone().sub(P).normalize(); // Vec P to T2

    // 망치 타격방향 목표벡터로 정렬하는 쿼터니언
    const q1 = new THREE.Quaternion().setFromUnitVectors(localHeadVec, targetHeadDir);
    
    // 망치 타격방향 정렬 쿼터니언 적용된 손잡이 방향 벡터
    const currentHandleVec = localHandleVec.clone().applyQuaternion(q1)
    // vec tq2를 vec tq1에 수직인 평면에 정사영
    // 망치의 모델이 찌그러지지 않게 하기 위해 tq2를 tq1에 수직인 방향으로 재정렬함
    const targetHandleDir = targetHandleDirRaw.clone().projectOnPlane(targetHeadDir).normalize();
    const q2 = new THREE.Quaternion().setFromUnitVectors(currentHandleVec, targetHandleDir);

    // 6. [최종 적용] 위치와 회전을 동시에 고정
    ebmBlock.quaternion.copy(q2).multiply(q1);
    ebmBlock.position.copy(P); // 이제 P 좌표에서 정확히 회전합니다.

    return ebmBlock;
}

