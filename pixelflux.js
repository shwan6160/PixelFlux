import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const MC_VERSION = "26.1.1";
const VANILLA_ASSET_URL = `https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/${MC_VERSION}/assets/minecraft`;

const ViewManager = {
    views: [],
    renderer: null,
    canvas: null,

    init() {
        if (this.renderer) return;
        
        // DOM에 추가하지 않고 백그라운드에서 렌더링용으로만 사용할 공용 WebGL 캔버스 생성
        this.canvas = document.createElement('canvas');
        
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setScissorTest(true); 

        this.animate();

        window.addEventListener('resize', () => {
            this.render();
        }, { passive: true });
    },

    animate() {
        requestAnimationFrame(() => this.animate());
        this.render();
    },

    render() {
        // 공용 WebGL 캔버스 크기를 화면 크기로 충분히 확보 (최대 컨테이너 크기 대비)
        const width = window.innerWidth;
        const height = window.innerHeight;
        const pixelRatio = window.devicePixelRatio;
        
        if (this.canvas.width !== Math.floor(width * pixelRatio) || this.canvas.height !== Math.floor(height * pixelRatio)) {
            this.renderer.setSize(width, height, false);
        }

        const canvasPhysHeight = this.canvas.height;

        this.views.forEach(view => {
            const rect = view.container.getBoundingClientRect();
            
            // 화면 밖에 있으면 렌더링 스킵 (성능 최적화)
            if (rect.bottom < 0 || rect.top > height || rect.right < 0 || rect.left > width) return;

            // 각 뷰의 컨테이너 크기와 캔버스 크기 일치화
            const viewWidth = Math.max(1, Math.floor(rect.width * pixelRatio));
            const viewHeight = Math.max(1, Math.floor(rect.height * pixelRatio));

            if (view.canvas2d.width !== viewWidth || view.canvas2d.height !== viewHeight) {
                view.canvas2d.width = viewWidth;
                view.canvas2d.height = viewHeight;
            }

            // WebGL 캔버스의 좌측 하단(0,0)에만 현재 뷰를 렌더링
            this.renderer.setViewport(0, 0, rect.width, rect.height);
            this.renderer.setScissor(0, 0, rect.width, rect.height);
            
            view.controls.update();
            this.renderer.render(view.scene, view.camera);

            // 렌더링된 결과를 DOM의 2D 캔버스로 복사 (스크롤 시 밀림 및 잔상 완벽 해결)
            view.ctx.clearRect(0, 0, viewWidth, viewHeight);
            view.ctx.drawImage(
                this.renderer.domElement,
                0,
                canvasPhysHeight - viewHeight, // WebGL 좌표계는 좌측 하단 기준이므로 Y축 보정
                viewWidth,
                viewHeight,
                0,
                0,
                viewWidth,
                viewHeight
            );
        });
    }
};

// 1. 수정된 initScene (이제 View를 생성하고 등록함)
export function initScene(containerId, backgroundColor = 0x87CEEB) {
    ViewManager.init(); // 관리자 초기화 (최초 1회만 실행됨)

    const container = document.getElementById(containerId);
    
    // 컨테이너 자체에 2D 캔버스를 추가하여 브라우저 네이티브 스크롤을 타게함
    const canvas2d = document.createElement('canvas');
    canvas2d.style.width = '100%';
    canvas2d.style.height = '100%';
    canvas2d.style.display = 'block';
    container.appendChild(canvas2d);
    
    const ctx = canvas2d.getContext('2d', { alpha: false }); // 성능 향상을 위해 alpha 조정 가능

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(backgroundColor);

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(-2, 1.5, 2);

    const controls = new OrbitControls(camera, canvas2d); // 이벤트는 2D 캔버스에서 받음
    controls.enableDamping = true;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);

    const view = { container, canvas2d, ctx, scene, camera, controls };
    ViewManager.views.push(view);

    return view;
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

// 3. 네임스페이스 경로 파싱 유틸리티
function parsePath(path) {
    if (path.includes(':')) {
        return path.split(':')[1];
    }
    return path;
}

// 4. 부모 모델을 재귀적으로 추적하여 데이터를 병합하는 함수
async function resolveModelHierarchy(initialJson, urlRoot) {
    let currentModel = initialJson;
    let mergedElements = currentModel.elements || null;
    let mergedTextures = { ...currentModel.textures };

    while (currentModel.parent) {
        const parentPath = parsePath(currentModel.parent);
        
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
            mergedTextures = { ...parentModel.textures, ...mergedTextures };
            
            if (!mergedElements && parentModel.elements) {
                mergedElements = parentModel.elements;
            }

            currentModel = parentModel;
        } catch (e) {
            console.warn(`부모 모델을 불러오는 중 오류 발생: ${parentUrl} / ${fallbackParentUrl}`);
            break;
        }
    }

    for (let key in mergedTextures) {
        let maxDepth = 10;
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
// 현재 렌더링된 그룹을 추적하기 위해 반환된 mesh group을 사용하도록 수정
export async function createMinecraftBlockMesh(jsonUrl) {
    const response = await fetch(jsonUrl);
    const initialJson = await response.json();
    const urlRoot = jsonUrl.split("/models")[0];

    const { elements, textures } = await resolveModelHierarchy(initialJson, urlRoot);

    const loadedTextures = {};
    const texturePromises = [];

    for (const [key, path] of Object.entries(textures)) {
        if (path && !path.startsWith('#')) {
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
    
    await Promise.all(texturePromises);

    const blockGroup = new THREE.Group();

    elements.forEach((element, index) => {
        const zOffset = index * 0.0001; 

        const width = (element.to[0] - element.from[0]) / 16;
        const height = (element.to[1] - element.from[1]) / 16;
        const depth = (element.to[2] - element.from[2]) / 16;

        const geometry = new THREE.BoxGeometry(width, height, depth);
        const materials = [];
        const facesOrder = ['east', 'west', 'up', 'down', 'south', 'north'];
        const uvAttribute = geometry.attributes.uv;

        facesOrder.forEach((faceName, faceIndex) => {
            if (element.faces && element.faces[faceName]) {
                const faceData = element.faces[faceName];
                const textureKey = faceData.texture.replace('#', ''); 
                const faceTexture = loadedTextures[textureKey];

                if (faceTexture) {
                    materials.push(new THREE.MeshLambertMaterial({
                        map: faceTexture,
                        transparent: true,
                        alphaTest: 0.1
                    }));

                    if (faceData.uv) {
                        const u1 = faceData.uv[0] / 16;
                        const v1 = 1 - (faceData.uv[1] / 16); 
                        const u2 = faceData.uv[2] / 16;
                        const v2 = 1 - (faceData.uv[3] / 16);

                        const offset = faceIndex * 4;
                        uvAttribute.setXY(offset + 0, u1, v1);
                        uvAttribute.setXY(offset + 1, u2, v1);
                        uvAttribute.setXY(offset + 2, u1, v2);
                        uvAttribute.setXY(offset + 3, u2, v2);
                    }
                } else {
                    materials.push(new THREE.MeshBasicMaterial({ color: 0xff00ff }));
                }
            } else {
                materials.push(new THREE.MeshBasicMaterial({ visible: false }));
            }
        });

        uvAttribute.needsUpdate = true;
        const mesh = new THREE.Mesh(geometry, materials);
        
        mesh.position.set(
            (element.from[0] + element.to[0]) / 32 - 0.5,
            (element.from[1] + element.to[1]) / 32 - 0.5 + zOffset,
            (element.from[2] + element.to[2]) / 32 - 0.5
        );

        blockGroup.add(mesh);
    });

    return blockGroup;
}
