class Video360 {
  camera = null;
  scene = null;
  renderer = null;
  isUserInteracting = false;
  lon = 0;
  lat = 0;
  phi = 0;
  theta = 0;
  onPointerDownPointerX = 0;
  onPointerDownPointerY = 0;
  onPointerDownLon = 0;
  onPointerDownLat = 0;
  distance = 0.5;

  init(videoElement, videoContainer) {
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.25,
      10
    );

    this.scene = new THREE.Scene();

    const geometry = new THREE.SphereGeometry(5, 60, 40);
    geometry.scale(-1, 1, 1);

    const texture = new THREE.VideoTexture(videoElement);
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.MeshBasicMaterial({ map: texture });

    const mesh = new THREE.Mesh(geometry, material);
    this.scene.add(mesh);

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(640, 480);
    videoContainer.appendChild(this.renderer.domElement);

    videoContainer.addEventListener("pointerdown", this.onPointerDown);
    videoContainer.addEventListener("pointermove", this.onPointerMove);
    videoContainer.addEventListener("pointerup", this.onPointerUp);

    this.animate();
  }

  onPointerUp = () => {
    this.isUserInteracting = false;
  };

  onPointerDown = (event) => {
    this.isUserInteracting = true;

    this.onPointerDownPointerX = event.clientX;
    this.onPointerDownPointerY = event.clientY;

    this.onPointerDownLon = this.lon;
    this.onPointerDownLat = this.lat;
  };

  onPointerMove = (event) => {
    if (this.isUserInteracting === true) {
      this.lon =
        (this.onPointerDownPointerX - event.clientX) * 0.5 +
        this.onPointerDownLon;
      this.lat =
        (this.onPointerDownPointerY - event.clientY) * 0.5 +
        this.onPointerDownLat;
    }
  };

  animate = () => {
    requestAnimationFrame(this.animate);
    this.update();
  };

  update() {
    this.lat = Math.max(-85, Math.min(85, this.lat));
    this.phi = THREE.MathUtils.degToRad(90 - this.lat);
    this.theta = THREE.MathUtils.degToRad(this.lon);

    this.camera.position.x =
      this.distance * Math.sin(this.phi) * Math.cos(this.theta);
    this.camera.position.y = this.distance * Math.cos(this.phi);
    this.camera.position.z =
      this.distance * Math.sin(this.phi) * Math.sin(this.theta);

    this.camera.lookAt(0, 0, 0);

    if (this.scene && this.camera && this.renderer) {
      this.renderer.render(this.scene, this.camera);
    } else {
      console.error(">> Scene, camera, or renderer is null.");
    }
  }
}
