import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
// @ts-ignore: If you don't have types for GLTFLoader, this will suppress the error
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export default function RealisticWarehouse() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf4f6fa);

    const width = 1000, height = 700;
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
    camera.position.set(30, 30, 60);
    camera.lookAt(0, 10, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    mountRef.current!.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(50, 100, 50);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Floor (optional: add a concrete texture)
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshStandardMaterial({ color: 0xc0c0c0 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    // Load warehouse model (GLTF/GLB)
    const loader = new GLTFLoader();
    loader.load('/models/warehouse.glb', (gltf: any) => {
      gltf.scene.traverse((child: any) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      scene.add(gltf.scene);
    });

    // Animation loop
    const animate = () => {
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    return () => {
      mountRef.current!.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} style={{ width: 1000, height: 700, margin: '0 auto' }} />;
} 