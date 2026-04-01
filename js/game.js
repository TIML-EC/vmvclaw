// 1. 場景初始化
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeeeeee); // 設定背景顏色

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true }); // 開啟抗鋸齒
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 2. 加入光照
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(20, 30, 20);
scene.add(directionalLight);

// 調整攝影機位置
camera.position.set(0, 15, 40);
camera.lookAt(0, 0, 0);

// 3. 建立娃娃機
const machineWidth = 30;
const machineHeight = 30;
const machineDepth = 20;

const machineGeometry = new THREE.BoxGeometry(machineWidth, machineHeight, machineDepth);
const machineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 });
const machine = new THREE.Mesh(machineGeometry, machineMaterial);
scene.add(machine);

// 建立地板
const floorGeometry = new THREE.PlaneGeometry(machineWidth, machineDepth);
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2; // 旋轉以平放
floor.position.y = -machineHeight / 2;
scene.add(floor);

// 4. 建立獎品 (20個不同顏色的圓球)
const prizes = [];
for (let i = 0; i < 20; i++) {
    const prizeGeometry = new THREE.SphereGeometry(1.5, 32, 32);
    const prizeMaterial = new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff });
    const prize = new THREE.Mesh(prizeGeometry, prizeMaterial);

    // 在機器底部隨機放置
    prize.position.x = Math.random() * (machineWidth - 4) - (machineWidth / 2 - 2);
    prize.position.y = -machineHeight / 2 + 1.5;
    prize.position.z = Math.random() * (machineDepth - 4) - (machineDepth / 2 - 2);

    prizes.push(prize);
    scene.add(prize);
}

// 5. 建立爪子
const claw = new THREE.Group();

// 爪子的桿子
const rodGeometry = new THREE.CylinderGeometry(0.5, 0.5, 15, 32);
const rodMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
const rod = new THREE.Mesh(rodGeometry, rodMaterial);
rod.position.y = 7.5; // 使其底部在 group 的原點
claw.add(rod);

// 爪子基座
const baseGeometry = new THREE.BoxGeometry(4, 2, 4);
const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
const base = new THREE.Mesh(baseGeometry, baseMaterial);
claw.add(base);

// 爪指 (先建立一個簡化的)
const fingerGeometry = new THREE.BoxGeometry(0.5, 4, 0.5);
const fingerMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });

for (let i = 0; i < 4; i++) {
    const finger = new THREE.Mesh(fingerGeometry, fingerMaterial);
    const angle = (i / 4) * Math.PI * 2;
    finger.position.set(Math.cos(angle) * 1.5, -2, Math.sin(angle) * 1.5);
    finger.rotation.z = Math.PI / 8; // 稍微張開
    base.add(finger);
}

claw.position.y = machineHeight / 2 - 1; // 初始位置在機器頂部
scene.add(claw);

// 6. 攝影機控制
const cameraPositions = {
    front: new THREE.Vector3(0, 15, 40),
    side: new THREE.Vector3(40, 15, 0)
};
let currentView = 'front';

});

// 7. 鍵盤控制
const clawSpeed = 0.2;
const moveState = { forward: false, back: false, left: false, right: false };
let clawState = 'idle'; // idle, dropping, returning
let fingerTargetRotation = Math.PI / 4; // 爪指的目標旋轉角度 (初始為張開)
let caughtPrize = null; // 用於儲存抓到的獎品

document.addEventListener('keydown', (e) => {
    if (clawState === 'idle') { // 只有在閒置時才能移動或下爪
        switch(e.key.toLowerCase()) {
            case 'arrowup': case 'w': moveState.forward = true; break;
            case 'arrowdown': case 's': moveState.back = true; break;
            case 'arrowleft': case 'a': moveState.left = true; break;
            case 'arrowright': case 'd': moveState.right = true; break;
            case ' ': clawState = 'dropping'; break; // 按下空白鍵
        }
    }

    // 攝影機切換不受影響
    if (e.key.toLowerCase() === 'v') {
        currentView = currentView === 'front' ? 'side' : 'front';
        camera.position.copy(cameraPositions[currentView]);
        camera.lookAt(0, 0, 0);
    }
});

document.addEventListener('keyup', (e) => {
    switch(e.key.toLowerCase()) {
        case 'arrowup': case 'w': moveState.forward = false; break;
        case 'arrowdown': case 's': moveState.back = false; break;
        case 'arrowleft': case 'a': moveState.left = false; break;
        case 'arrowright': case 'd': moveState.right = false; break;
    }
});

function updateClawPosition() {
    if (clawState === 'idle') {
        if (moveState.forward) claw.position.z -= clawSpeed;
        if (moveState.back) claw.position.z += clawSpeed;
        if (moveState.left) claw.position.x -= clawSpeed;
        if (moveState.right) claw.position.x += clawSpeed;

        // 邊界檢測
        const limitX = machineWidth / 2 - 2;
        const limitZ = machineDepth / 2 - 2;
        claw.position.x = Math.max(-limitX, Math.min(limitX, claw.position.x));
        claw.position.z = Math.max(-limitZ, Math.min(limitZ, claw.position.z));
    } else if (clawState === 'dropping') {
        claw.position.y -= clawSpeed * 2; // 加快下降速度
        if (claw.position.y <= -machineHeight / 2 + 5) { // 到達底部
            clawState = 'returning';
            fingerTargetRotation = -Math.PI / 8; // 設定目標為閉合
        }
    } else if (clawState === 'returning') {
        claw.position.y += clawSpeed * 2; // 加快上升速度
        if (claw.position.y >= machineHeight / 2 - 1) { // 回到頂部
            claw.position.y = machineHeight / 2 - 1;
            clawState = 'idle';

            // 釋放獎品
            if (caughtPrize) {
                // 將獎品放回機器底部
                caughtPrize.position.x = Math.random() * (machineWidth - 4) - (machineWidth / 2 - 2);
                caughtPrize.position.y = -machineHeight / 2 + 1.5;
                caughtPrize.position.z = Math.random() * (machineDepth - 4) - (machineDepth / 2 - 2);
                caughtPrize = null;
            }

            fingerTargetRotation = Math.PI / 4; // 設定目標為張開
        }
    }
}

let cameraCooldown = false; // 用於防止視角按鈕連按

function handleGamepadInput() {
    const gamepads = navigator.getGamepads();
    if (gamepads[0]) {
        const gp = gamepads[0];

        // 方向控制 (搖桿 + 方向鍵)
        const horizontalAxis = gp.axes[0];
        const verticalAxis = gp.axes[1];
        if (clawState === 'idle') {
            if (horizontalAxis < -0.5 || gp.buttons[14].pressed) claw.position.x -= clawSpeed;
            if (horizontalAxis > 0.5 || gp.buttons[15].pressed) claw.position.x += clawSpeed;
            if (verticalAxis < -0.5 || gp.buttons[12].pressed) claw.position.z -= clawSpeed;
            if (verticalAxis > 0.5 || gp.buttons[13].pressed) claw.position.z += clawSpeed;
        }

        // 按鈕控制
        if (gp.buttons[2].pressed && clawState === 'idle') clawState = 'dropping'; // 抓取
        if (gp.buttons[1].pressed && !cameraCooldown) { // 切換視角
            currentView = currentView === 'front' ? 'side' : 'front';
            camera.position.copy(cameraPositions[currentView]);
            camera.lookAt(0, 0, 0);
            cameraCooldown = true;
            setTimeout(() => { cameraCooldown = false; }, 300); // 300毫秒冷卻
        }
        if (gp.buttons[9].pressed) resetGame(); // 重置
    }
}


// 8. 渲染循環
function animate() {
    requestAnimationFrame(animate);

    handleGamepadInput(); // 處理遊戲手把輸入
    updateClawPosition(); // 更新爪子位置和狀態

    // 平滑地更新爪指的開合動畫
    clawFingers.forEach(finger => {
        finger.rotation.z += (fingerTargetRotation - finger.rotation.z) * 0.1;
    });

    renderer.render(scene, camera);
}

// 9. 重置遊戲
function resetGame() {
    // 重置爪子位置和狀態
    claw.position.set(0, machineHeight / 2 - 1, 0);
    clawState = 'idle';
    fingerTargetRotation = Math.PI / 4;
    caughtPrize = null;

    // 重置獎品位置
    prizes.forEach(prize => {
        prize.position.x = Math.random() * (machineWidth - 4) - (machineWidth / 2 - 2);
        prize.position.y = -machineHeight / 2 + 1.5;
        prize.position.z = Math.random() * (machineDepth - 4) - (machineDepth / 2 - 2);
    });

    // 重置攝影機
    currentView = 'front';
    camera.position.copy(cameraPositions[currentView]);
    camera.lookAt(0, 0, 0);
}

// 4. 響應式視窗調整
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 啟動渲染
animate();
