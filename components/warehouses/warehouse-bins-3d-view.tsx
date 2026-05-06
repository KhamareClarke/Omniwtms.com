"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

interface Bin {
  id: string;
  x: number;
  y: number;
  z: number;
  max_quantity: number;
  current_quantity: number;
  bin_code?: string;
  bin_allocations?: { quantity: number; products?: { name: string } }[];
}

interface WarehouseBins3DViewProps {
  bins: Bin[];
  className?: string;
}

/** 3D visualization of warehouse bins - each bin is a cube at (x,y,z) */
export function WarehouseBins3DView({ bins, className = "" }: WarehouseBins3DViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationRef = useRef<number>(0);
  const [hoveredBin, setHoveredBin] = useState<Bin | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current || bins.length === 0) return;

    const width = containerRef.current.clientWidth || 400;
    const height = Math.min(containerRef.current.clientHeight || 300, 400);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1d21);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 5000);
    cameraRef.current = camera;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    const scale = 16;
    const boxSize = 10;
    const offset = 10;

    const maxX = Math.max(...bins.map((b) => b.x), 0);
    const maxY = Math.max(...bins.map((b) => b.y), 0);
    const maxZ = Math.max(...bins.map((b) => b.z), 0);

    bins.forEach((bin) => {
      const fillRatio = bin.max_quantity > 0 ? bin.current_quantity / bin.max_quantity : 0;
      let color: number;
      if (fillRatio >= 1) color = 0x22c55e;
      else if (fillRatio > 0) color = 0x3456ff;
      else color = 0x475569;

      const geom = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
      const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.5,
        metalness: 0.3,
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.position.set(
        offset + bin.x * scale,
        offset + bin.y * scale,
        offset + bin.z * scale
      );
      mesh.userData = { bin };
      scene.add(mesh);
    });

    const halfScale = (n: number) => offset + (n * scale) / 2;
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(
      halfScale(Math.max(maxX, 2)),
      offset + (Math.max(maxY, 2) * scale) * 1.5,
      halfScale(Math.max(maxZ, 2))
    );
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const gridSize = Math.max(maxX, maxZ, 2) * scale + offset * 2;
    const grid = new THREE.GridHelper(gridSize, 24, 0x475569, 0x334155);
    grid.position.set(offset + (maxX * scale) / 2, 0, offset + (maxZ * scale) / 2);
    scene.add(grid);

    const centerX = offset + (maxX * scale) / 2;
    const centerZ = offset + (maxZ * scale) / 2;
    const centerY = offset + (maxY * scale) / 2;
    const camDist = Math.max(gridSize * 0.8, 60);
    camera.position.set(centerX + camDist, centerY + camDist * 0.7, centerZ + camDist);
    controls.target.set(centerX, centerY * 0.3, centerZ);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || !renderer.domElement) return;
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const meshes = scene.children.filter((c) => c instanceof THREE.Mesh && (c as THREE.Mesh).userData?.bin);
      const hits = raycaster.intersectObjects(meshes);
      if (hits.length > 0) {
        const bin = (hits[0].object as THREE.Mesh).userData?.bin as Bin;
        if (bin) {
          setHoveredBin(bin);
          setTooltipPos({ x: e.clientX, y: e.clientY });
        }
      } else {
        setHoveredBin(null);
      }
    };

    const onMouseLeave = () => setHoveredBin(null);

    renderer.domElement.addEventListener("mousemove", onMouseMove);
    renderer.domElement.addEventListener("mouseleave", onMouseLeave);

    function animate() {
      animationRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    const onResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const w = containerRef.current.clientWidth || 400;
      const h = Math.min(containerRef.current.clientHeight || 300, 400);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("mousemove", onMouseMove);
      renderer.domElement.removeEventListener("mouseleave", onMouseLeave);
      cancelAnimationFrame(animationRef.current);
      renderer.dispose();
      scene.clear();
      cameraRef.current = null;
    };
  }, [bins]);

  if (bins.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-[#1a1d21] rounded-lg text-gray-500 text-sm ${className}`} style={{ minHeight: 280 }}>
        Create bins to see 3D view
      </div>
    );
  }

  return (
    <div className={`${className} relative`}>
      <div ref={containerRef} className="w-full rounded-lg overflow-hidden" style={{ minHeight: 280 }} />
      {hoveredBin && (
        <div
          className="fixed z-50 px-3 py-2 rounded-lg bg-gray-900 text-white text-sm shadow-lg border border-gray-700 pointer-events-none max-w-[220px]"
          style={{ left: tooltipPos.x + 12, top: tooltipPos.y + 12 }}
        >
          <div className="font-mono font-semibold">({hoveredBin.x}, {hoveredBin.y}, {hoveredBin.z})</div>
          <div className="text-gray-300 text-xs mt-0.5">
            Usage: {hoveredBin.current_quantity} / {hoveredBin.max_quantity}
          </div>
          {hoveredBin.bin_allocations && hoveredBin.bin_allocations.length > 0 && (
            <div className="text-xs mt-1 border-t border-gray-600 pt-1">
              {hoveredBin.bin_allocations.map((a: any, i: number) => (
                <div key={i}>{a.products?.name || "Product"} × {a.quantity}</div>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="flex gap-4 mt-2 text-xs text-gray-500">
        <span><span className="inline-block w-3 h-3 rounded bg-[#475569] mr-1" />Empty</span>
        <span><span className="inline-block w-3 h-3 rounded bg-[#3456ff] mr-1" />Partial</span>
        <span><span className="inline-block w-3 h-3 rounded bg-[#22c55e] mr-1" />Full</span>
      </div>
    </div>
  );
}
