import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/controls/OrbitControls.js";

export class LidarVisualization {
  camera = null;
  scene = null;
  renderer = null;
  controls = null;

  init(lidarContainer, width, height) {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1100
    );
    this.camera.position.set(0, 0, 200);

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(width, height);
    setTimeout(() => {
      lidarContainer.appendChild(this.renderer.domElement);
    }, 100);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.update();

    this.animate();
  }

  lidarVisualizationWorker = (accuracy, angle, distance) => {
    const radius = accuracy / 25;
    let color;

    if (distance > 0 && distance < 300 / 5) {
      color = 0xff5959; // Red
    } else if (distance >= 300 / 5 && distance < 500 / 5) {
      color = 0xffa559; // Orange
    } else if (distance >= 500 / 5 && distance < 1000 / 5) {
      color = 0xffff59; // Yellow
    } else if (distance >= 1000 / 5 && distance < 2000 / 5) {
      color = 0x59ff59; // Green
    } else {
      color = 0x5959ff; // Blue
    }

    const x = (distance * Math.cos((angle * Math.PI) / 180)) / 2;
    const y = (distance * Math.sin((angle * Math.PI) / 180)) / 2;
    const z = 0;

    const position = { x: x, y: y, z: 0 };

    return [position, color, radius];
  };

  drawPoint3D = (accuracy, angle, distance) => {
    distance = distance / 5;
    const [positions, color, radius] = this.lidarVisualizationWorker(
      accuracy,
      angle,
      distance
    );
    const positionXYZ = positions;
    const materialColor = new THREE.Color(color);

    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color: materialColor });

    var point = new THREE.Mesh(geometry, material);
    point.position.set(positionXYZ.x, positionXYZ.y, 0);

    this.scene.add(point);
  };

  animate = () => {
    requestAnimationFrame(this.animate);
    this.renderer.render(this.scene, this.camera);
  };

  clearScene = () => {
    const objectsToRemove = [];

    this.scene.children.forEach((object) => {
      if (object instanceof THREE.Mesh) {
        objectsToRemove.push(object);
      }
    });

    objectsToRemove.forEach((object) => {
      this.scene.remove(object);

      if (object.material instanceof THREE.Material) {
        object.material.dispose();
      } else if (Array.isArray(object.material)) {
        for (const material of object.material) {
          if (material) {
            material.dispose();
          }
        }
      }

      if (object.geometry) object.geometry.dispose();
    });
  };
}
