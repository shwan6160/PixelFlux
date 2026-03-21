import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 마인크래프트 바닐라 기본 리소스 저장소 URL (부모 모델과 텍스처를 자동으로 불러오기 위함)
const MC_VERSION = "26.1-pre-3"
const VANILLA_ASSET_URL = `https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/${MC_VERSION}/assets/minecraft`;

let scene, camera, renderer, controls;
let currentBlockGroup = null;

// 1. Three.js 초기 씬 설정
function initScene() {
    const container = document.getElementById('canvas-container');

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); 

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(2, 1.5, 2);

    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 0, 0);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);

    window.addEventListener('resize', onWindowResize);
    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// 2. 텍스처 로더
function loadPixelTexture(url) {
    return new Promise((resolve) => {
        const loader = new THREE.TextureLoader();
        loader.setCrossOrigin('anonymous'); 
        loader.load(
            url,
            (texture) => {
                texture.magFilter = THREE.NearestFilter;
                texture.minFilter = THREE.NearestFilter;
                texture.colorSpace = THREE.SRGBColorSpace;
                resolve(texture);
            },
            undefined,
            (err) => {
                console.warn(`텍스처를 불러올 수 없습니다: ${url}`);
                resolve(null);
            }
        );
    });
}

// 3. 네임스페이스 경로 파싱 유틸리티 (예: "minecraft:block/dirt" -> "block/dirt")
function parsePath(path) {
    if (path.includes(':')) {
        return path.split(':')[1];
    }
    return path;
}

// 4. [핵심] 부모 모델을 재귀적으로 추적하여 데이터를 병합하는 함수
async function resolveModelHierarchy(initialJson, urlRoot) {
    let currentModel = initialJson;
    let mergedElements = currentModel.elements || null;
    let mergedTextures = { ...currentModel.textures };

    // 부모(parent)가 존재할 경우 반복해서 불러와 병합
    while (currentModel.parent) {
        // "block/cube_column" 같은 경로를 실제 URL로 변환
        const parentPath = parsePath(currentModel.parent);
        
        // 주의: 내장된 큐브 모델들(builtin/generated 등)은 무시
        if (parentPath.startsWith('builtin/')) break;

        const parentUrl = `${urlRoot}/models/${parentPath}.json`;
        const fallbackParentUrl = `${VANILLA_ASSET_URL}/models/${parentPath}.json`;
        
        try {
            let res = await fetch(parentUrl);
            if (!res.ok) {
                console.warn(`부모 모델 로드 실패, fallback 시도: ${fallbackParentUrl}`);
                res = await fetch(fallbackParentUrl);
            }
            if (!res.ok) throw new Error("Parent Model Fetch Failed");
            const parentModel = await res.json();

            // 자식 텍스처가 부모 텍스처를 덮어씌워야 하므로, 자식에 없는 것만 부모에서 가져옴
            mergedTextures = { ...parentModel.textures, ...mergedTextures };
            
            // 자식 모델에 elements가 없다면 부모의 elements를 상속받음
            if (!mergedElements && parentModel.elements) {
                mergedElements = parentModel.elements;
            }

            currentModel = parentModel;
        } catch (e) {
            console.warn(`부모 모델을 불러오는 중 오류 발생: ${parentUrl} / ${fallbackParentUrl}`);
            break;
        }
    }

    // 마인크래프트 특성 처리: 텍스처 변수가 다른 변수를 참조하는 경우 해결 (예: "side": "#all")
    for (let key in mergedTextures) {
        let maxDepth = 10; // 무한 루프 방지
        while (mergedTextures[key] && mergedTextures[key].startsWith('#') && maxDepth > 0) {
            const refKey = mergedTextures[key].substring(1);
            mergedTextures[key] = mergedTextures[refKey];
            maxDepth--;
        }
    }

    return { 
        elements: mergedElements || [], 
        textures: mergedTextures 
    };
}

// 5. 병합된 데이터를 기반으로 3D 렌더링
async function renderMinecraftBlock(scene, jsonUrl) {
    try {
        if (currentBlockGroup) {
            scene.remove(currentBlockGroup);
            currentBlockGroup = null;
        }

        // 5-1. 사용자가 입력한 초기 JSON 불러오기
        const response = await fetch(jsonUrl);
        const initialJson = await response.json();

        const urlRoot = await jsonUrl.split("/models")[0];

        // 5-2. 부모 모델 병합 및 텍스처 변수 해석
        const { elements, textures } = await resolveModelHierarchy(initialJson, urlRoot);

        // 5-3. 실제 사용할 텍스처 이미지(PNG)들만 골라서 로드
        const loadedTextures = {};
        const texturePromises = [];

        for (const [key, path] of Object.entries(textures)) {
            if (path && !path.startsWith('#')) {
                // 모드(Mod)의 텍스처인 경우 사용자가 제공한 서버 URL로 매핑해야 하지만,
                // 여기서는 바닐라 리소스 폴더 기준으로 URL을 생성합니다.
                const cleanPath = parsePath(path);
                const pngUrl = `${urlRoot}/textures/${cleanPath}.png`;
                const fallbackUrl = `${VANILLA_ASSET_URL}/textures/${cleanPath}.png`;
                
                texturePromises.push(
                    loadPixelTexture(pngUrl)
                        .then(tex => {
                            if (tex) return tex;
                            console.warn(`기본 텍스처 로드 실패, fallback 시도: ${fallbackUrl}`);
                            return loadPixelTexture(fallbackUrl);
                        })
                        .then(tex => {
                            loadedTextures[key] = tex;
                        })
                );
            }
        }
        await Promise.all(texturePromises); // 텍스처 다운로드 완료 대기

        const blockGroup = new THREE.Group();

        // 5-4. elements를 Three.js Mesh로 변환 (UV 및 Z-Fighting 해결 적용)
        elements.forEach((element, index) => {
            // Z-Fighting 방지를 위한 미세한 오프셋 (element 순서에 따라 조금씩 다르게 줌)
            const zOffset = index * 0.0001; 

            const width = (element.to[0] - element.from[0]) / 16;
            const height = (element.to[1] - element.from[1]) / 16;
            const depth = (element.to[2] - element.from[2]) / 16;

            // BoxGeometry 생성
            const geometry = new THREE.BoxGeometry(width, height, depth);
            const materials = [];
            
            // Three.js BoxGeometry의 면 순서: [오른쪽(x+), 왼쪽(x-), 위(y+), 아래(y-), 앞(z+), 뒤(z-)]
            // 마인크래프트 기준: [east, west, up, down, south, north]
            const facesOrder = ['east', 'west', 'up', 'down', 'south', 'north'];

            // BoxGeometry의 UV 버퍼 속성 가져오기
            const uvAttribute = geometry.attributes.uv;

            facesOrder.forEach((faceName, faceIndex) => {
                if (element.faces && element.faces[faceName]) {
                    const faceData = element.faces[faceName];
                    const textureRef = faceData.texture;
                    const textureKey = textureRef.replace('#', ''); 
                    const faceTexture = loadedTextures[textureKey];

                    if (faceTexture) {
                        materials.push(new THREE.MeshLambertMaterial({
                            map: faceTexture,
                            transparent: true,
                            alphaTest: 0.1 // 알파 테스트를 통해 투명 영역 뚫림 처리
                        }));

                        // ⭐ UV 매핑 커스텀 적용
                        if (faceData.uv) {
                            // 마인크래프트 UV [u1, v1, u2, v2] (0~16)를 Three.js UV (0~1)로 변환
                            // 마인크래프트는 좌상단이 (0,0), Three.js는 좌하단이 (0,0) 이므로 V 좌표를 뒤집어야 함
                            const u1 = faceData.uv[0] / 16;
                            const v1 = 1 - (faceData.uv[1] / 16); 
                            const u2 = faceData.uv[2] / 16;
                            const v2 = 1 - (faceData.uv[3] / 16);

                            // BoxGeometry의 각 면(Face)은 2개의 삼각형(Triangle), 즉 6개의 정점(Vertex)으로 이루어짐.
                            // 하지만 UV 속성은 사각형의 4개 정점을 기준으로 정의되어 있음.
                            // faceIndex * 4부터 시작해서 4개의 UV 좌표 값을 수정
                            const offset = faceIndex * 4;
                            
                            // Three.js 기본 UV 순서 (BoxGeometry 기준)
                            // 0: 좌상단, 1: 우상단, 2: 좌하단, 3: 우하단
                            uvAttribute.setXY(offset + 0, u1, v1);
                            uvAttribute.setXY(offset + 1, u2, v1);
                            uvAttribute.setXY(offset + 2, u1, v2);
                            uvAttribute.setXY(offset + 3, u2, v2);
                        }

                    } else {
                        materials.push(new THREE.MeshBasicMaterial({ color: 0xff00ff })); // Missing Texture
                    }
                } else {
                    materials.push(new THREE.MeshBasicMaterial({ visible: false })); // 면 없음
                }
            });

            // UV가 변경되었음을 렌더러에 알림
            uvAttribute.needsUpdate = true;

            const mesh = new THREE.Mesh(geometry, materials);
            
            // 중심점 위치 설정 (Z-Fighting 오프셋 적용)
            mesh.position.set(
                (element.from[0] + element.to[0]) / 32 - 0.5,
                (element.from[1] + element.to[1]) / 32 - 0.5 + zOffset,
                (element.from[2] + element.to[2]) / 32 - 0.5
            );

            blockGroup.add(mesh);
        });

        scene.add(blockGroup);
        currentBlockGroup = blockGroup;

        const msg = document.getElementById('loading-msg');
        msg.style.display = 'block';
        msg.style.color = '#43b581';
        msg.innerText = "렌더링 완료!";
        setTimeout(() => msg.style.display = 'none', 3000);

    } catch (error) {
        console.error("렌더링 에러:", error);
        const msg = document.getElementById('loading-msg');
        msg.style.display = 'block';
        msg.style.color = '#f04747';
        msg.innerText = "오류 발생: 콘솔을 확인하세요.";
    }
}

// 6. 이벤트 리스너
// UI에서 PNG 입력창은 이제 필요 없으므로 숨기거나 무시해도 됩니다. 
// JSON 안의 데이터로 텍스처를 자동으로 찾아옵니다.
document.getElementById('render-btn').addEventListener('click', () => {
    const jsonUrl = document.getElementById('json-url').value;
    
    const msg = document.getElementById('loading-msg');
    msg.style.display = 'block';
    msg.style.color = '#faa61a';
    msg.innerText = "모델 병합 및 렌더링 중...";

    renderMinecraftBlock(jsonUrl);
});

// 앱 실행
initScene();
renderMinecraftBlock(scene, document.getElementById('json-url').value);