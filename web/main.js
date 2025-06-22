// Ask for player name
let playerName = prompt("Enter your name:") || "Anonymous";

// Globals
let scene, camera, renderer;
let keys = {};
let carSpeed = 0;
let maxSpeed = 0.4;
let acceleration = 0.01;
let friction = 0.98;
let carAngle = 0;
let carContainer = new THREE.Object3D();
let carReady = false;
let isSocketConnected = false;

let engineSound, brakeSound, listener;
let audioLoader = new THREE.AudioLoader();

let mySocketId = null;
const remoteCars = {};
const obstacles = [];

const textureLoader = new THREE.TextureLoader();
const gltfLoader = new THREE.GLTFLoader();

// === Socket Connection ===
// const socket = io("http://localhost:3000");
const socket = io("https://cargame.splitwizz.com", {
    transports: ["websocket", "polling"],
    rejectUnauthorized: false
});


socket.on("connect", () => {
    mySocketId = socket.id;
    isSocketConnected = true;
    if (carReady) emitNewPlayer(); // Safe emit
});

socket.on("initPlayers", (players) => {
    for (let id in players) {
        if (id !== mySocketId && !remoteCars[id]) {
            addRemoteCar(id, players[id]);
        }
    }
    updateOnlineCount();
});

socket.on("newPlayer", (data) => {
    if (data.id !== mySocketId && !remoteCars[data.id]) {
        addRemoteCar(data.id, data);
    }
});

socket.on("updatePlayer", (data) => {
    const car = remoteCars[data.id];
    if (car) {
        car.position.set(data.x, data.y, data.z);
        car.rotation.y = data.angle;
    }
});

socket.on("removePlayer", (id) => {
    scene.remove(remoteCars[id]);
    delete remoteCars[id];
    updateOnlineCount();
});

function emitNewPlayer() {
    socket.emit("newPlayer", {
        name: playerName,
        x: carContainer.position.x,
        y: carContainer.position.y,
        z: carContainer.position.z,
        angle: carAngle
    });
}

function updateOnlineCount() {
    const total = Object.keys(remoteCars).length + 1;
    document.getElementById("onlineCounter").textContent = `Cars Online: ${total}`;
}

// === Load Car & Label ===
function loadCarJeep() {
    gltfLoader.load('assets/models/car-jeep.glb', (gltf) => {
        const model = gltf.scene;
        model.scale.set(0.6, 0.6, 0.6);
        carContainer.add(model);
        carContainer.position.set(0, 0.8, 0);
        carReady = true;

        const nameLabel = createNameLabel(playerName);
        carContainer.add(nameLabel);

        if (isSocketConnected) emitNewPlayer();
    });
}

function createNameLabel(name) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;

    ctx.fillStyle = 'white';
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);

    sprite.scale.set(3, 1, 1); // ✅ smaller, balanced size
    sprite.position.set(0, 1.8, 0); // ✅ slightly above car roof

    // ✅ Face the camera every frame (billboarding)
    sprite.onBeforeRender = () => {
        if (camera) {
            sprite.quaternion.copy(camera.quaternion);
        }
    };

    return sprite;
}


function addRemoteCar(id, data) {
    gltfLoader.load("assets/models/car-jeep.glb", (gltf) => {
        const model = gltf.scene;
        model.scale.set(0.6, 0.6, 0.6);
        model.position.set(data.x, data.y, data.z);
        const nameLabel = createNameLabel(data.name || "Player");
        model.add(nameLabel);
        scene.add(model);
        remoteCars[id] = model;
        updateOnlineCount();
    });
}

function loadModel(path, scale, position, yOffset = 0, isCloud = false) {
    gltfLoader.load(path, (gltf) => {
        const model = gltf.scene;
        model.scale.set(scale, scale, scale);
        model.position.set(position.x, position.y + yOffset, position.z);
        model.traverse(child => {
            if (child.isMesh) {
                child.castShadow = !isCloud;
                child.receiveShadow = false;
            }
        });
        if (isCloud) model.userData.isCloud = true;
        scene.add(model);
    });
}

function spawnStaticObstacles() {
    const staticObstacles = [
        { model: "tree2.glb", scale: 5, x: 68, y: 5, z: -23 },
        { model: "rock2.glb", scale: 10, x: 52, y: 0.01, z: 22 },
        { model: "rock2.glb", scale: 10, x: -33, y: 0.01, z: -23 },
        { model: "rock1.glb", scale: 10, x: -67, y: 0.01, z: -77 },
        { model: "rock2.glb", scale: 10, x: -22, y: 0.01, z: 47 },
        { model: "rock1.glb", scale: 10, x: 57, y: 0.01, z: 77 },
        { model: "tree2.glb", scale: 5, x: 0, y: 5, z: 83 },
        { model: "tree1.glb", scale: 5, x: 31, y: 5, z: -77 },
        { model: "tree2.glb", scale: 5, x: 69, y: 5, z: -14 },
        { model: "rock2.glb", scale: 10, x: -7, y: 0.01, z: 82 },
        { model: "rock1.glb", scale: 10, x: -25, y: 0.01, z: 8 },
        { model: "tree2.glb", scale: 5, x: -78, y: 5, z: 35 },
        { model: "tree1.glb", scale: 5, x: 64, y: 5, z: 60 },
        { model: "rock1.glb", scale: 10, x: 44, y: 0.01, z: -90 },
        { model: "tree1.glb", scale: 5, x: -53, y: 5, z: 24 },
        { model: "rock1.glb", scale: 10, x: -90, y: 0.01, z: 58 },
        { model: "tree2.glb", scale: 5, x: 59, y: 5, z: -45 },
        { model: "tree2.glb", scale: 5, x: -30, y: 5, z: 9 },
        { model: "rock1.glb", scale: 10, x: 61, y: 0.01, z: -38 },
        { model: "rock2.glb", scale: 10, x: -56, y: 0.01, z: -1 },
        { model: "rock2.glb", scale: 10, x: -19, y: 0.01, z: 27 },
        { model: "rock1.glb", scale: 10, x: 90, y: 0.01, z: -57 },
        { model: "rock1.glb", scale: 10, x: 58, y: 0.01, z: -68 },
        { model: "tree1.glb", scale: 5, x: 27, y: 5, z: -23 },
        { model: "tree2.glb", scale: 5, x: 14, y: 5, z: -45 },
        { model: "rock2.glb", scale: 10, x: -70, y: 0.01, z: -37 },
        { model: "tree2.glb", scale: 5, x: 90, y: 5, z: 46 },
        { model: "tree1.glb", scale: 5, x: 75, y: 5, z: -35 },
        { model: "rock2.glb", scale: 10, x: -79, y: 0.01, z: -18 },
        { model: "tree2.glb", scale: 5, x: -51, y: 5, z: -12 },
        { model: "tree2.glb", scale: 5, x: 48, y: 5, z: -78 },
        { model: "tree2.glb", scale: 5, x: 27, y: 5, z: 74 },
        { model: "rock2.glb", scale: 10, x: 73, y: 0.01, z: -50 },
        { model: "tree1.glb", scale: 5, x: -68, y: 5, z: -61 },
        { model: "rock2.glb", scale: 10, x: -3, y: 0.01, z: 15 },
        { model: "rock2.glb", scale: 10, x: 6, y: 0.01, z: 41 },
        { model: "tree2.glb", scale: 5, x: 47, y: 5, z: -9 },
        { model: "tree1.glb", scale: 5, x: 1, y: 5, z: -87 },
        { model: "rock2.glb", scale: 10, x: 73, y: 0.01, z: -40 },
        { model: "tree1.glb", scale: 5, x: 1, y: 5, z: 44 }
    ];
    for (let obs of staticObstacles) {
        loadModel(`assets/models/${obs.model}`, obs.scale, new THREE.Vector3(obs.x, obs.y, obs.z), 0.1);
    }
}

// === Init Scene ===
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    listener = new THREE.AudioListener();
    camera.add(listener);

    engineSound = new THREE.PositionalAudio(listener);
    carContainer.add(engineSound);
    audioLoader.load('assets/audio/car_engine_loop.wav', (buffer) => {
        engineSound.setBuffer(buffer);
        engineSound.setLoop(true);
        engineSound.setVolume(0.5);
        engineSound.play();
    });

    brakeSound = new THREE.Audio(listener);
    audioLoader.load('assets/audio/brake.wav', (buffer) => {
        brakeSound.setBuffer(buffer);
        brakeSound.setVolume(0.7);
    });

    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("gameCanvas") });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;

    // Sunlight
    const sunLight = new THREE.DirectionalLight(0xfff1b5, 1.2);
    sunLight.position.set(50, 100, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.camera.left = -100;
    sunLight.shadow.camera.right = 100;
    sunLight.shadow.camera.top = 100;
    sunLight.shadow.camera.bottom = -100;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 300;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    // Grass
    const grassColor = textureLoader.load("assets/textures/grass/Color.jpg");
    const grassNormal = textureLoader.load("assets/textures/grass/NormalGL.jpg");
    const grassRough = textureLoader.load("assets/textures/grass/Roughness.jpg");
    [grassColor, grassNormal, grassRough].forEach(tex => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(40, 40);
    });

    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(200, 200),
        new THREE.MeshStandardMaterial({
            map: grassColor,
            normalMap: grassNormal,
            roughnessMap: grassRough
        })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Walls
    const wallColor = textureLoader.load("assets/textures/wall/Color.jpg");
    const wallNormal = textureLoader.load("assets/textures/wall/NormalGL.jpg");
    const wallRough = textureLoader.load("assets/textures/wall/Roughness.jpg");
    [wallColor, wallNormal, wallRough].forEach(tex => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(10, 1);
    });

    const wallMaterial = new THREE.MeshStandardMaterial({
        map: wallColor,
        normalMap: wallNormal,
        roughnessMap: wallRough
    });

    const wallHeight = 3, groundSize = 200;
    const walls = [
        new THREE.Mesh(new THREE.BoxGeometry(groundSize, wallHeight, 1), wallMaterial),
        new THREE.Mesh(new THREE.BoxGeometry(groundSize, wallHeight, 1), wallMaterial),
        new THREE.Mesh(new THREE.BoxGeometry(1, wallHeight, groundSize), wallMaterial),
        new THREE.Mesh(new THREE.BoxGeometry(1, wallHeight, groundSize), wallMaterial)
    ];
    walls[0].position.set(0, wallHeight / 2, -groundSize / 2);
    walls[1].position.set(0, wallHeight / 2, groundSize / 2);
    walls[2].position.set(-groundSize / 2, wallHeight / 2, 0);
    walls[3].position.set(groundSize / 2, wallHeight / 2, 0);
    walls.forEach(w => { w.castShadow = true; w.receiveShadow = true; scene.add(w); });

    // Clouds
    for (let i = 0; i < 15; i++) {
        const x = Math.random() * 300 - 150;
        const z = Math.random() * 200 - 100;
        const y = 35 + Math.random() * 10;
        loadModel("assets/models/clouds.glb", 20, new THREE.Vector3(x, y, z), 0, true);
    }

    // UI
    document.body.insertAdjacentHTML("beforeend", `
        <div id="hud" style="position:absolute;top:10px;left:10px;color:white;font-family:monospace;font-size:18px;z-index:100;"></div>
        <div id="onlineCounter" style="position:absolute;top:10px;right:10px;color:white;font-family:monospace;font-size:18px;z-index:100;">Cars Online: 1</div>
    `);

    window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
    window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

    spawnStaticObstacles();
    scene.add(carContainer);
    loadCarJeep();

    camera.position.set(0, 5, -10);
    animate();
}

// === Animation ===
function animate() {
    requestAnimationFrame(animate);
    if (carReady) {
        updateCar();
        updateCamera();
    }
    scene.traverse(obj => {
        if (obj.userData.isCloud) {
            obj.position.x += 0.02;
            if (obj.position.x > 80) obj.position.x = -80;
        }
    });
    renderer.render(scene, camera);
}

// === Car Controls ===
function updateCar() {
    if (keys["w"] || keys["arrowup"]) carSpeed += acceleration;
    if (keys["s"] || keys["arrowdown"]) carSpeed -= acceleration;
    if (keys[" "]) {
        carSpeed *= 0.8;
        if (brakeSound && !brakeSound.isPlaying) brakeSound.play();
    } else {
        carSpeed *= friction;
    }

    carSpeed = Math.max(Math.min(carSpeed, maxSpeed), -maxSpeed);
    if ((keys["a"] || keys["arrowleft"]) && carSpeed !== 0) carAngle += 0.03 * Math.sign(carSpeed);
    if ((keys["d"] || keys["arrowright"]) && carSpeed !== 0) carAngle -= 0.03 * Math.sign(carSpeed);

    carContainer.rotation.y = carAngle;
    carContainer.position.x += Math.sin(carAngle) * carSpeed;
    carContainer.position.z += Math.cos(carAngle) * carSpeed;

    const limit = 99;
    carContainer.position.x = Math.max(-limit, Math.min(limit, carContainer.position.x));
    carContainer.position.z = Math.max(-limit, Math.min(limit, carContainer.position.z));

    if (engineSound?.isPlaying) {
        const speedRatio = Math.abs(carSpeed) / maxSpeed;
        engineSound.setPlaybackRate(0.8 + speedRatio * 0.6);
        engineSound.setVolume(0.2 + speedRatio * 0.8);
    }

    document.getElementById("hud").textContent = `Speed: ${(Math.abs(carSpeed) * 100).toFixed()}`;
    socket.emit("updatePlayer", {
        x: carContainer.position.x,
        y: carContainer.position.y,
        z: carContainer.position.z,
        angle: carAngle
    });
}

function updateCamera() {
    const camDistance = 5;
    const camHeight = 2;
    camera.position.x = carContainer.position.x - Math.sin(carAngle) * camDistance;
    camera.position.z = carContainer.position.z - Math.cos(carAngle) * camDistance;
    camera.position.y = carContainer.position.y + camHeight;
    camera.lookAt(carContainer.position.x, carContainer.position.y + 1.5, carContainer.position.z);
}

init();
