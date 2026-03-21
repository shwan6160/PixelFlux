import { initScene, createMinecraftBlockMesh } from './pixelflux.js';
import { isApotheosisNamespace, resolveApotheosisTextureUrl } from './addon/apotheosis.js';

// --- 애플리케이션 상태 관리 ---
const engine = initScene('canvas-container');
let currentBlockGroup = null;

function showMessage(text, color) {
    const msg = document.getElementById('loading-msg');
    if (!msg) return;
    msg.style.display = 'block';
    msg.style.color = color;
    msg.innerText = text;
    if (color === '#43b581') { // 성공 메시지일 경우 3초 후 숨김
        setTimeout(() => msg.style.display = 'none', 3000);
    }
}

async function renderModelUI(jsonUrl) {
    try {
        showMessage("모델 병합 및 렌더링 중...", '#faa61a');

        // 기존 모델 제거
        if (currentBlockGroup) {
            engine.scene.remove(currentBlockGroup);
        }

        // 새 모델 생성 및 추가
        currentBlockGroup = await createMinecraftBlockMesh(jsonUrl);
        engine.scene.add(currentBlockGroup);

        showMessage("렌더링 완료!", '#43b581');
    } catch (error) {
        console.error("렌더링 에러:", error);
        showMessage("오류 발생: 콘솔을 확인하세요.", '#f04747');
    }
}

// 6. 이벤트 리스너 및 초기화
document.getElementById('render-btn').addEventListener('click', () => {
    const jsonUrl = document.getElementById('json-url').value;
    renderModelUI(jsonUrl);
});

// 초기 로드 시 렌더링
renderModelUI(document.getElementById('json-url').value);