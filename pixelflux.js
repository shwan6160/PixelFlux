import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let currentBlockGroup = null;

// 1. 초기 씬(Scene) 설정
function initScene() {
    const container = document.getElementById('canvas-container');
    scene = new THREE.Scene();
    // 배경색을 마인크래프트 하늘색 느낌으로 설정
    scene.background = new THREE.Color(0x87CEEB); 
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(2, 1.5, 2);
    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    // 마우스 컨트롤 추가 (회전, 줌)
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 0, 0);
    // 조명 추가
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

// 2. 텍스처 로드 유틸리티 함수
function loadPixelTexture(url) {
    return new Promise((resolve, reject) => {
        const loader = new THREE.TextureLoader();
        // CORS 문제 방지
        loader.setCrossOrigin('anonymous'); 
        loader.load(
            url,
            (texture) => {
                // 도트 그래픽 유지 (안티앨리어싱 해제)
                texture.magFilter = THREE.NearestFilter;
                texture.minFilter = THREE.NearestFilter;
                resolve(texture);
            },
            undefined,
            (err) => reject(err)
        );
    });
}

/**
 * 3. 핵심 함수: JSON과 PNG URL을 받아 3D 블록을 렌더링
 * @param {string} jsonUrl - 모델 JSON 파일 URL
 * @param {string} textureUrl - 입힐 텍스처 PNG URL
 */
async function renderMinecraftBlock(jsonUrl, textureUrl) {
    try {
        // 기존에 렌더링된 블록이 있으면 제거
        if (currentBlockGroup) {
            scene.remove(currentBlockGroup);
            currentBlockGroup = null;
        }
        // JSON 데이터 가져오기
        const response = await fetch(jsonUrl);
        if (!response.ok) throw new Error("JSON을 불러오는 데 실패했습니다.");
        const modelJson = await response.json();
        // 텍스처 이미지 가져오기
        const texture = await loadPixelTexture(textureUrl);
        // 블록을 담을 그룹 생성
        const blockGroup = new THREE.Group();
        // elements가 없는 모델(부모만 상속받는 경우 등) 처리
        const elements = modelJson.elements || [
            { "from": [0, 0, 0], "to": [16, 16, 16], "faces": { "down":{}, "up":{}, "north":{}, "south":{}, "west":{}, "east":{} } }
        ];
        elements.forEach(element => {
            // 16x16x16 마인크래프트 좌표계를 1x1x1 Three.js 좌표계로 변환
            const width = (element.to[0] - element.from[0]) / 16;
            const height = (element.to[1] - element.from[1]) / 16;
            const depth = (element.to[2] - element.from[2]) / 16;
            const geometry = new THREE.BoxGeometry(width, height, depth);
            const materials = [];
            
            // Three.js BoxGeometry의 면 순서: [오른쪽(x+), 왼쪽(x-), 위(y+), 아래(y-), 앞(z+), 뒤(z-)]
            // 마인크래프트 기준: [east, west, up, down, south, north]
            const facesOrder = ['east', 'west', 'up', 'down', 'south', 'north'];
            facesOrder.forEach(faceName => {
                // 모델에 해당 면이 정의되어 있다면 텍스처 입히기 (여기서는 모든 면에 입력받은 1개의 텍스처를 동일하게 적용)
                if (element.faces && element.faces[faceName]) {
                    materials.push(new THREE.MeshLambertMaterial({
                        map: texture,
                        transparent: true,
                        alphaTest: 0.1 // 투명 픽셀 처리
                    }));
                } else {
                    // 정의되지 않은 면은 렌더링하지 않음
                    materials.push(new THREE.MeshBasicMaterial({ visible: false }));
                }
            });
            const mesh = new THREE.Mesh(geometry, materials);
            
            // 마인크래프트는 좌하단 모서리가 (0,0,0) 이지만, Three.js는 중심이 (0,0,0) 이므로 위치 보정
            mesh.position.set(
                (element.from[0] + element.to[0]) / 32 - 0.5,
                (element.from[1] + element.to[1]) / 32 - 0.5,
                (element.from[2] + element.to[2]) / 32 - 0.5
            );
            blockGroup.add(mesh);
        });
        // 씬에 추가
        scene.add(blockGroup);
        currentBlockGroup = blockGroup;
        // 성공 메시지 표시
        const msg = document.getElementById('loading-msg');
        msg.style.display = 'block';
        msg.style.color = '#43b581';
        msg.innerText = "렌더링 완료!";
        setTimeout(() => msg.style.display = 'none', 3000);
    } catch (error) {
        console.error(error);
        const msg = document.getElementById('loading-msg');
        msg.style.display = 'block';
        msg.style.color = '#f04747';
        msg.innerText = "오류 발생: 콘솔을 확인하세요.";
    }
}

// 4. UI 이벤트 리스너 연결
document.getElementById('render-btn').addEventListener('click', () => {
    const jsonUrl = document.getElementById('json-url').value;
    const pngUrl = document.getElementById('png-url').value;
    
    document.getElementById('loading-msg').style.display = 'block';
    document.getElementById('loading-msg').style.color = '#faa61a';
    document.getElementById('loading-msg').innerText = "불러오는 중...";
    renderMinecraftBlock(jsonUrl, pngUrl);
});

// 5. 앱 실행
initScene();

// 초기 기본값 렌더링
renderMinecraftBlock(
    document.getElementById('json-url').value, 
    document.getElementById('png-url').value
);