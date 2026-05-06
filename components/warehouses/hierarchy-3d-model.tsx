import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

export default function Hierarchy3DModel() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8f8f8);

    // Camera (isometric)
    const width = 600, height = 600;
    const aspect = width / height;
    const camera = new THREE.PerspectiveCamera(35, aspect, 0.1, 100);
    camera.position.set(4, 6, 8);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    mountRef.current!.appendChild(renderer.domElement);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Grid Helper
    const grid = new THREE.GridHelper(10, 10, 0xdddddd, 0xeeeeee);
    scene.add(grid);

    // Platform data: [label, size, y-position, color]
    const platforms = [
      { label: '1', size: 3, y: 2.5, color: 0xe0e0e0 },
      { label: '0.5', size: 2, y: 1.2, color: 0xc0c0c0 },
      { label: '1.5', size: 1, y: 0.3, color: 0xa0a0a0 },
      // Optional hidden: { label: '2.5', size: 0.5, y: -0.5, color: 0x888888 },
    ];

    // Create platforms
    platforms.forEach((p, i) => {
      const geometry = new THREE.CylinderGeometry(p.size, p.size, 0.3, 64, 1, false);
      const material = new THREE.MeshPhysicalMaterial({
        color: p.color,
        roughness: 0.3,
        clearcoat: 0.5,
        clearcoatRoughness: 0.1,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(0, p.y, 0);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);

      // Label (floating)
      const canvas = document.createElement('canvas');
      canvas.width = 128; canvas.height = 64;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, 128, 64);
      ctx.font = 'bold 36px Arial';
      ctx.fillStyle = '#222';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.label, 64, 32);
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.set(0, p.y + 0.4, p.size + 0.2);
      sprite.scale.set(0.8, 0.4, 1);
      scene.add(sprite);
    });

    // Soft shadow plane
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      new THREE.ShadowMaterial({ opacity: 0.15 })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

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

  return <div ref={mountRef} style={{ width: 600, height: 600, margin: '0 auto' }} />;
} 