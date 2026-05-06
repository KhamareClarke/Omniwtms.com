// @ts-nocheck
"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export interface Warehouse3DRendererProps {
  image?: string | null;
  dimensions?: { width: number; height: number };
  rects?: any[];
  ocr?: any[];
}

export function Warehouse3DRenderer({
  image,
  dimensions,
  rects = [],
  ocr = [],
}: Warehouse3DRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [insideView, setInsideView] = useState(false);
  const [showDetection, setShowDetection] = useState(!!image);
  const controlsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const roomSizeRef = useRef<number>(900);
  const wallHeightRef = useRef<number>(120);

  // Legend data
  const boxCount = rects?.length || 0;
  const palletCount = 5; // Default value
  const stockCount = 8; // Default value
  const colorLegend = [
    { color: "#d2b048", label: "Stock (Brown)" },
    { color: "#ffb300", label: "Forklift (Yellow)" },
    { color: "#223366", label: "Rack (Blue)" },
    { color: "#6d4c2f", label: "Pallet (Dark Brown)" },
    { color: "#ff9800", label: "Safety (Orange)" },
    { color: "#1976d2", label: "Worker (Blue)" },
  ];

  // Helper for camera view matching screenshot
  function setFrontAngledView(
    cam: THREE.PerspectiveCamera,
    controls: OrbitControls | null,
    roomSize: number,
    wallHeight: number
  ) {
    cam.position.set(roomSize / 2, wallHeight * 0.55, -roomSize * 0.55);
    cam.lookAt(roomSize / 2, wallHeight * 0.18, roomSize / 2);
    if (controls) {
      controls.target.set(roomSize / 2, wallHeight * 0.18, roomSize / 2);
      controls.update();
    }
  }

  // Only set initial view once per mount
  const initialViewSet = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";
    if (!rects || rects.length === 0) return;

    // Use detected boxes
    const boxCount = rects.length;
    const boxesPerRow = Math.ceil(Math.sqrt(boxCount));
    const boxSize = 8;
    const boxSpacing = 2;
    const rows = Math.ceil(boxCount / boxesPerRow);
    const warehouseWidth = boxesPerRow * (boxSize + boxSpacing) + boxSpacing;
    const warehouseDepth = rows * (boxSize + boxSpacing) + boxSpacing;
    const warehouseHeight = 12;

    // Get container size
    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 600;

    // Three.js scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x23272a);

    // Camera setup
    let camera: THREE.PerspectiveCamera;
    camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 20000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);

    // Room dimensions
    const roomSize = 900;
    const wallThickness = 4;
    const wallHeight = 120;
    roomSizeRef.current = roomSize;
    wallHeightRef.current = wallHeight;

    // Floor
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x44484c,
      roughness: 0.92,
      metalness: 0.22,
    });
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(roomSize, roomSize, 36, 36),
      floorMat
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(roomSize / 2, 0, roomSize / 2);
    floor.receiveShadow = true;
    scene.add(floor);

    // Grid
    const grid = new THREE.GridHelper(roomSize, 36, 0x33363a, 0x33363a);
    grid.position.set(roomSize / 2, 0.02, roomSize / 2);
    scene.add(grid);

    // Walls
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x36393f,
      metalness: 0.45,
      roughness: 0.62,
      opacity: 0.99,
      transparent: true,
    });

    // Back wall
    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(roomSize, wallHeight, wallThickness),
      wallMat
    );
    backWall.position.set(roomSize / 2, wallHeight / 2, wallThickness / 2);
    scene.add(backWall);

    // Left wall
    const leftWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, roomSize),
      wallMat
    );
    leftWall.position.set(wallThickness / 2, wallHeight / 2, roomSize / 2);
    scene.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, roomSize),
      wallMat
    );
    rightWall.position.set(
      roomSize - wallThickness / 2,
      wallHeight / 2,
      roomSize / 2
    );
    scene.add(rightWall);

    // Racks
    function addRack(x: number, z: number, w: number, d: number, h: number) {
      // Metal uprights
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          const upright = new THREE.Mesh(
            new THREE.BoxGeometry(2, h, 2),
            new THREE.MeshLambertMaterial({ color: 0x223366 })
          );
          upright.position.set(
            x + (i === 0 ? -w / 2 + 1 : w / 2 - 1),
            h / 2,
            z + (j === 0 ? -d / 2 + 1 : d / 2 - 1)
          );
          scene.add(upright);
        }
      }
      // Shelves
      for (let l = 0; l < 5; l++) {
        const shelf = new THREE.Mesh(
          new THREE.BoxGeometry(w, 2, d),
          new THREE.MeshLambertMaterial({ color: 0x223366 })
        );
        shelf.position.set(x, (l + 1) * (h / 6), z);
        scene.add(shelf);
      }
    }

    // Place racks in parallel rows
    const numRacks = 10;
    const rackLength = roomSize * 0.7;
    const rackWidth = 18;
    const rackHeight = 60;
    const aisle = 32;

    for (let r = 0; r < numRacks; r++) {
      const x = 60 + r * (rackWidth + aisle);
      addRack(x, roomSize / 2, rackWidth, rackLength, rackHeight);
      // Fill this rack with visually varied brown stock boxes
      for (let shelf = 0; shelf < 5; shelf++) {
        for (let b = 0; b < 10; b++) {
          // Randomly leave a few spots empty
          if (Math.random() < 0.12) continue;
          // Slightly vary box size and color
          const boxSize = 13 + Math.random() * 3;
          const brownShades = [0xd2b048, 0xbfa76a, 0x9e7c3c, 0xc2a060];
          const color =
            brownShades[Math.floor(Math.random() * brownShades.length)];
          const stockBox = new THREE.Mesh(
            new THREE.BoxGeometry(boxSize, boxSize, boxSize),
            new THREE.MeshLambertMaterial({ color })
          );
          // Place box so it sits on the shelf, not inside it
          stockBox.position.set(
            x,
            (shelf + 1) * (rackHeight / 6) + boxSize / 2 + 2,
            80 + b * (rackLength / 10) - rackLength / 2
          );
          // Randomly rotate a few boxes
          if (Math.random() < 0.25)
            stockBox.rotation.y = Math.random() * 0.5 - 0.25;
          scene.add(stockBox);
          // Add a white label to some boxes
          if (Math.random() < 0.3) {
            const labelCanvas = document.createElement("canvas");
            labelCanvas.width = 64;
            labelCanvas.height = 24;
            const ctx = labelCanvas.getContext("2d");
            if (ctx) {
              ctx.fillStyle = "#fff";
              ctx.fillRect(0, 0, 64, 24);
              ctx.font = "bold 16px Arial";
              ctx.fillStyle = "#222";
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText("LBL", 32, 12);
            }
            const labelTexture = new THREE.CanvasTexture(labelCanvas);
            const labelMat = new THREE.SpriteMaterial({
              map: labelTexture,
              transparent: true,
            });
            const label = new THREE.Sprite(labelMat);
            label.position.set(
              x,
              (shelf + 1) * (rackHeight / 6) + boxSize + 4,
              80 + b * (rackLength / 10) - rackLength / 2
            );
            label.scale.set(12, 4, 1);
            scene.add(label);
          }
        }
      }
    }

    // Barrels
    for (let i = 0; i < 12; i++) {
      const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(8, 8, 24, 32),
        new THREE.MeshStandardMaterial({
          color: [0x1976d2, 0xff4444, 0x43a047][i % 3],
        })
      );
      barrel.position.set(60 + i * 60, 12, 60);
      scene.add(barrel);
    }

    // Add more props for realism
    // Extra barrels
    for (let i = 0; i < 8; i++) {
      const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(8, 8, 24, 32),
        new THREE.MeshStandardMaterial({
          color: [0x1976d2, 0xff4444, 0x43a047, 0x6d4c2f][i % 4],
        })
      );
      barrel.position.set(120 + i * 60, 12, 180);
      scene.add(barrel);
    }
    // Safety cones
    for (let i = 0; i < 5; i++) {
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(6, 18, 24),
        new THREE.MeshStandardMaterial({ color: 0xff9800 })
      );
      cone.position.set(200 + i * 40, 9, 300);
      scene.add(cone);
    }
    // Pallets
    for (let i = 0; i < 6; i++) {
      const pallet = new THREE.Mesh(
        new THREE.BoxGeometry(24, 3, 24),
        new THREE.MeshStandardMaterial({ color: 0x6d4c2f })
      );
      pallet.position.set(300 + i * 40, 1.5, 120);
      scene.add(pallet);
    }
    // Scattered boxes
    for (let i = 0; i < 7; i++) {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(14, 14, 14),
        new THREE.MeshLambertMaterial({ color: 0xd2b048 })
      );
      box.position.set(400 + i * 30, 7, 200 + (i % 2) * 30);
      scene.add(box);
    }
    // Conveyor belt
    const conveyor = new THREE.Mesh(
      new THREE.BoxGeometry(120, 6, 24),
      new THREE.MeshStandardMaterial({
        color: 0x888888,
        metalness: 0.7,
        roughness: 0.3,
      })
    );
    conveyor.position.set(roomSize / 2, 3, roomSize - 120);
    scene.add(conveyor);
    // Conveyor rollers
    for (let i = 0; i < 8; i++) {
      const roller = new THREE.Mesh(
        new THREE.CylinderGeometry(3, 3, 24, 16),
        new THREE.MeshStandardMaterial({ color: 0x222222 })
      );
      roller.rotation.z = Math.PI / 2;
      roller.position.set(roomSize / 2 - 60 + i * 20, 3, roomSize - 120);
      scene.add(roller);
    }
    // Wall fans
    for (let i = 0; i < 2; i++) {
      const fan = new THREE.Mesh(
        new THREE.CylinderGeometry(10, 10, 2, 32),
        new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8 })
      );
      fan.position.set(60, wallHeight - 20 - i * 40, 10);
      scene.add(fan);
    }
    // Rotating industrial ceiling fans
    const fans: THREE.Mesh[] = [];
    for (let i = 0; i < 3; i++) {
      const fan = new THREE.Mesh(
        new THREE.CylinderGeometry(18, 18, 2, 32),
        new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8 })
      );
      fan.position.set(200 + i * 200, wallHeight - 8, roomSize / 2);
      scene.add(fan);
      fans.push(fan);
    }
    // Hanging industrial lights (with glow)
    for (let i = 0; i < 4; i++) {
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(8, 16, 16),
        new THREE.MeshStandardMaterial({
          color: 0xffffe0,
          emissive: 0xffffaa,
          emissiveIntensity: 1.2,
        })
      );
      bulb.position.set(150 + i * 200, wallHeight - 12, roomSize / 2);
      scene.add(bulb);
    }
    // Wall clock
    const clock = new THREE.Mesh(
      new THREE.CircleGeometry(12, 32),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    clock.position.set(roomSize - 40, wallHeight - 20, 10);
    scene.add(clock);
    // Security camera
    const cameraBody = new THREE.Mesh(
      new THREE.BoxGeometry(10, 6, 6),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    cameraBody.position.set(roomSize - 30, wallHeight - 10, 30);
    scene.add(cameraBody);
    const cameraLens = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 2, 4, 16),
      new THREE.MeshStandardMaterial({ color: 0x1976d2 })
    );
    cameraLens.rotation.x = Math.PI / 2;
    cameraLens.position.set(roomSize - 30, wallHeight - 10, 34);
    scene.add(cameraLens);
    // Glass window
    const windowMat = new THREE.MeshPhysicalMaterial({
      color: 0x99ccff,
      transparent: true,
      opacity: 0.3,
      roughness: 0.1,
      metalness: 0.2,
      transmission: 0.8,
    });
    const glassWindow = new THREE.Mesh(
      new THREE.PlaneGeometry(120, 60),
      windowMat
    );
    glassWindow.position.set(roomSize / 2, wallHeight / 2, roomSize - 2);
    scene.add(glassWindow);
    // Painted floor lines
    for (let i = 0; i < 4; i++) {
      const line = new THREE.Mesh(
        new THREE.BoxGeometry(roomSize * 0.8, 0.5, 2),
        new THREE.MeshStandardMaterial({ color: 0x3456ff })
      );
      line.position.set(roomSize / 2, 0.26, 200 + i * 60);
      scene.add(line);
    }
    // Subtle floor reflection (fake with a transparent plane)
    const reflection = new THREE.Mesh(
      new THREE.PlaneGeometry(roomSize, roomSize),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.07,
      })
    );
    reflection.rotation.x = -Math.PI / 2;
    reflection.position.set(roomSize / 2, 0.1, roomSize / 2);
    scene.add(reflection);
    // Shadow catcher (soft shadow plane)
    const shadowCatcher = new THREE.Mesh(
      new THREE.PlaneGeometry(roomSize, roomSize),
      new THREE.ShadowMaterial({ opacity: 0.18 })
    );
    shadowCatcher.rotation.x = -Math.PI / 2;
    shadowCatcher.position.set(roomSize / 2, 0.05, roomSize / 2);
    shadowCatcher.receiveShadow = true;
    scene.add(shadowCatcher);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const strongLight = new THREE.DirectionalLight(0xffffff, 1.2);
    strongLight.position.set(roomSize, wallHeight * 2, roomSize);
    strongLight.castShadow = true;
    scene.add(strongLight);

    // Ceiling (simple plane)
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0xe0e0e0,
      roughness: 0.7,
      metalness: 0.1,
    });
    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(roomSize, roomSize),
      ceilingMat
    );
    ceiling.position.set(roomSize / 2, wallHeight, roomSize / 2);
    ceiling.rotation.x = Math.PI / 2;
    scene.add(ceiling);

    // Roof trusses (beams)
    for (let i = 0; i < 8; i++) {
      const beam = new THREE.Mesh(
        new THREE.BoxGeometry(roomSize, 2, 6),
        new THREE.MeshStandardMaterial({
          color: 0x888888,
          metalness: 0.7,
          roughness: 0.3,
        })
      );
      beam.position.set(roomSize / 2, wallHeight - 4, ((i + 1) * roomSize) / 9);
      scene.add(beam);
    }

    // Industrial lights (hanging spheres)
    for (let i = 0; i < 6; i++) {
      const lightBulb = new THREE.Mesh(
        new THREE.SphereGeometry(6, 16, 16),
        new THREE.MeshStandardMaterial({
          color: 0xffffe0,
          emissive: 0xffffaa,
          emissiveIntensity: 0.8,
        })
      );
      lightBulb.position.set(
        ((i + 1) * roomSize) / 7,
        wallHeight - 8,
        roomSize / 2
      );
      scene.add(lightBulb);
    }

    // Support columns
    for (let i = 0; i < 6; i++) {
      const column = new THREE.Mesh(
        new THREE.CylinderGeometry(6, 6, wallHeight, 24),
        new THREE.MeshStandardMaterial({
          color: 0xaaaaaa,
          metalness: 0.5,
          roughness: 0.5,
        })
      );
      column.position.set(((i + 1) * roomSize) / 7, wallHeight / 2, 80);
      scene.add(column);
    }

    // Loading dock (ramp and door)
    const dock = new THREE.Mesh(
      new THREE.BoxGeometry(120, 8, 40),
      new THREE.MeshStandardMaterial({
        color: 0x222222,
        metalness: 0.7,
        roughness: 0.3,
      })
    );
    dock.position.set(roomSize - 60, 4, roomSize - 20);
    scene.add(dock);
    const dockDoor = new THREE.Mesh(
      new THREE.BoxGeometry(60, 60, 4),
      new THREE.MeshStandardMaterial({
        color: 0xeeeeee,
        metalness: 0.2,
        roughness: 0.7,
      })
    );
    dockDoor.position.set(roomSize - 60, 30, roomSize - 2);
    scene.add(dockDoor);

    // Company logo (simple text) on back wall
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#223366";
      ctx.font = "bold 64px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("OMNI WAREHOUSE", 256, 64);
    }
    const logoTexture = new THREE.CanvasTexture(canvas);
    const logoMat = new THREE.MeshBasicMaterial({
      map: logoTexture,
      transparent: true,
    });
    const logoMesh = new THREE.Mesh(new THREE.PlaneGeometry(240, 60), logoMat);
    logoMesh.position.set(roomSize / 2, wallHeight - 40, 8);
    scene.add(logoMesh);

    // Human figures (simple cylinders + spheres)
    for (let i = 0; i < 3; i++) {
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(6, 6, 28, 16),
        new THREE.MeshStandardMaterial({ color: 0x1976d2 })
      );
      body.position.set(120 + i * 120, 14, 120);
      scene.add(body);
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(6, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xffe0b2 })
      );
      head.position.set(120 + i * 120, 32, 120);
      scene.add(head);
    }

    // Forklift (simple box + cylinders, animated)
    const forklift = new THREE.Group();
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(28, 10, 18),
      new THREE.MeshStandardMaterial({ color: 0xffb300 })
    );
    base.position.set(0, 5, 0);
    forklift.add(base);
    const mast = new THREE.Mesh(
      new THREE.BoxGeometry(4, 24, 4),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    mast.position.set(10, 17, 0);
    forklift.add(mast);
    const fork = new THREE.Mesh(
      new THREE.BoxGeometry(16, 2, 6),
      new THREE.MeshStandardMaterial({ color: 0x888888 })
    );
    fork.position.set(16, 2, 0);
    forklift.add(fork);
    // Wheels
    for (let i = 0; i < 4; i++) {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(3, 3, 4, 16),
        new THREE.MeshStandardMaterial({ color: 0x222222 })
      );
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(i < 2 ? -8 : 8, 2, i % 2 === 0 ? -7 : 7);
      forklift.add(wheel);
    }
    forklift.position.set(200, 6, 200);
    scene.add(forklift);

    // Blinking indicator lights
    const indicators: THREE.Mesh[] = [];
    for (let i = 0; i < 4; i++) {
      const light = new THREE.Mesh(
        new THREE.SphereGeometry(3, 12, 12),
        new THREE.MeshStandardMaterial({
          color: 0x43a047,
          emissive: 0x43a047,
          emissiveIntensity: 1,
        })
      );
      light.position.set(200 + i * 60, 18, 80);
      scene.add(light);
      indicators.push(light);
    }
    // Conveyor belt with moving boxes
    const conveyorBoxes: THREE.Mesh[] = [];
    for (let i = 0; i < 5; i++) {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(14, 14, 14),
        new THREE.MeshLambertMaterial({ color: 0xffb300 })
      );
      box.position.set(roomSize / 2 - 40 + i * 20, 12, roomSize - 120);
      scene.add(box);
      conveyorBoxes.push(box);
    }
    // Multiple human figures in different poses and vests
    const vestColors = [0xffeb3b, 0x43a047, 0xff9800];
    for (let i = 0; i < 5; i++) {
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(6, 6, 28, 16),
        new THREE.MeshStandardMaterial({ color: vestColors[i % 3] })
      );
      body.position.set(120 + i * 120, 14, 120 + (i % 2) * 60);
      scene.add(body);
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(6, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xffe0b2 })
      );
      head.position.set(120 + i * 120, 32, 120 + (i % 2) * 60);
      scene.add(head);
    }

    // Stylized/procedural trees outside the warehouse (more visible, larger, and closer)
    for (let i = 0; i < 5; i++) {
      // Trunk
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(6, 6, 40, 12),
        new THREE.MeshStandardMaterial({ color: 0x8d5524 })
      );
      trunk.position.set(-80, 20, 120 + i * 140);
      scene.add(trunk);
      // Foliage (sphere)
      const foliage = new THREE.Mesh(
        new THREE.SphereGeometry(28, 18, 18),
        new THREE.MeshStandardMaterial({ color: 0x2e7d32 })
      );
      foliage.position.set(-80, 50, 120 + i * 140);
      scene.add(foliage);
    }
    // Stylized/procedural humans (with arms and legs, in various locations)
    const humanPoses = [
      { x: 200, z: 200 }, // near racks
      { x: 400, z: 300 }, // near forklift
      { x: 800, z: 120 }, // near office
      { x: 600, z: 600 }, // walking
      { x: 300, z: 700 }, // by shelves
    ];
    for (let i = 0; i < humanPoses.length; i++) {
      const { x, z } = humanPoses[i];
      // Body
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(6, 6, 28, 16),
        new THREE.MeshStandardMaterial({
          color: vestColors[i % vestColors.length],
        })
      );
      body.position.set(x, 14, z);
      scene.add(body);
      // Head
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(6, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xffe0b2 })
      );
      head.position.set(x, 32, z);
      scene.add(head);
      // Left leg
      const legL = new THREE.Mesh(
        new THREE.CylinderGeometry(2.2, 2.2, 16, 12),
        new THREE.MeshStandardMaterial({ color: 0x222222 })
      );
      legL.position.set(x - 2.5, 8, z + 2);
      scene.add(legL);
      // Right leg
      const legR = new THREE.Mesh(
        new THREE.CylinderGeometry(2.2, 2.2, 16, 12),
        new THREE.MeshStandardMaterial({ color: 0x222222 })
      );
      legR.position.set(x + 2.5, 8, z - 2);
      scene.add(legR);
      // Left arm
      const armL = new THREE.Mesh(
        new THREE.CylinderGeometry(1.7, 1.7, 16, 12),
        new THREE.MeshStandardMaterial({ color: 0xffe0b2 })
      );
      armL.position.set(x - 7, 24, z);
      armL.rotation.z = Math.PI / 5;
      scene.add(armL);
      // Right arm
      const armR = new THREE.Mesh(
        new THREE.CylinderGeometry(1.7, 1.7, 16, 12),
        new THREE.MeshStandardMaterial({ color: 0xffe0b2 })
      );
      armR.position.set(x + 7, 24, z);
      armR.rotation.z = -Math.PI / 5;
      scene.add(armR);
    }

    // Add a soft spotlight (simulating sunlight/skylight)
    const sunlight = new THREE.SpotLight(
      0xfff7e0,
      1.2,
      1800,
      Math.PI / 5,
      0.4,
      1
    );
    sunlight.position.set(roomSize / 2, wallHeight * 2.2, roomSize / 2 - 300);
    sunlight.target.position.set(roomSize / 2, 0, roomSize / 2);
    scene.add(sunlight);
    scene.add(sunlight.target);
    // Make the floor slightly reflective
    floorMat.roughness = 0.18;
    floorMat.metalness = 0.55;
    // Add a subtle shadow/dirt effect under racks
    for (let r = 0; r < numRacks; r++) {
      const x = 60 + r * (rackWidth + aisle);
      const dirt = new THREE.Mesh(
        new THREE.PlaneGeometry(rackWidth * 1.2, rackLength * 1.05),
        new THREE.MeshStandardMaterial({
          color: 0x222222,
          transparent: true,
          opacity: 0.1,
        })
      );
      dirt.rotation.x = -Math.PI / 2;
      dirt.position.set(x, 0.11, roomSize / 2);
      scene.add(dirt);
    }

    // Add controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableRotate = true;
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.minDistance = 10;
    controls.maxDistance = 1000;
    controlsRef.current = controls;

    // Set initial view only once
    if (!initialViewSet.current) {
      setFrontAngledView(
        camera,
        controls,
        roomSizeRef.current,
        wallHeightRef.current
      );
      initialViewSet.current = true;
    }

    // Shelving units with colored boxes
    for (let i = 0; i < 3; i++) {
      const shelf = new THREE.Mesh(
        new THREE.BoxGeometry(60, 4, 16),
        new THREE.MeshStandardMaterial({ color: 0x223366 })
      );
      shelf.position.set(200 + i * 120, 6, 700);
      scene.add(shelf);
      // Colored boxes on shelf
      for (let j = 0; j < 6; j++) {
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(12, 10, 12),
          new THREE.MeshLambertMaterial({
            color: [0xffb300, 0x43a047, 0x1976d2, 0xff4444][j % 4],
          })
        );
        box.position.set(170 + i * 120 + j * 14, 12, 700);
        scene.add(box);
      }
    }

    // Scattered pallets
    for (let i = 0; i < 4; i++) {
      const pallet = new THREE.Mesh(
        new THREE.BoxGeometry(24, 3, 24),
        new THREE.MeshStandardMaterial({ color: 0x6d4c2f })
      );
      pallet.position.set(150 + i * 80, 1.5, 600 + (i % 2) * 40);
      scene.add(pallet);
    }
    // Hand trucks
    for (let i = 0; i < 2; i++) {
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(16, 2, 8),
        new THREE.MeshStandardMaterial({ color: 0x888888 })
      );
      base.position.set(300 + i * 120, 2, 180);
      scene.add(base);
      const handle = new THREE.Mesh(
        new THREE.CylinderGeometry(1, 1, 18, 12),
        new THREE.MeshStandardMaterial({ color: 0x223366 })
      );
      handle.position.set(300 + i * 120, 12, 180);
      handle.rotation.z = Math.PI / 2;
      scene.add(handle);
    }
    // Safety barriers
    for (let i = 0; i < 3; i++) {
      const barrier = new THREE.Mesh(
        new THREE.BoxGeometry(32, 6, 4),
        new THREE.MeshStandardMaterial({ color: 0xff9800 })
      );
      barrier.position.set(400 + i * 60, 3, 80);
      scene.add(barrier);
    }

    // Small office area
    const desk = new THREE.Mesh(
      new THREE.BoxGeometry(36, 6, 18),
      new THREE.MeshStandardMaterial({ color: 0x795548 })
    );
    desk.position.set(820, 3, 120);
    scene.add(desk);
    const chair = new THREE.Mesh(
      new THREE.BoxGeometry(12, 16, 12),
      new THREE.MeshStandardMaterial({ color: 0x223366 })
    );
    chair.position.set(820, 8, 100);
    scene.add(chair);
    const monitor = new THREE.Mesh(
      new THREE.BoxGeometry(10, 8, 2),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    monitor.position.set(820, 12, 128);
    scene.add(monitor);
    // Wall notice board
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(32, 18, 2),
      new THREE.MeshStandardMaterial({ color: 0xfff9c4 })
    );
    board.position.set(roomSize - 80, wallHeight - 30, 10);
    scene.add(board);
    // Fire extinguisher
    const extinguisher = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 2, 12, 16),
      new THREE.MeshStandardMaterial({ color: 0xff4444 })
    );
    extinguisher.position.set(60, 6, 60);
    scene.add(extinguisher);
    // Trash bins
    for (let i = 0; i < 2; i++) {
      const bin = new THREE.Mesh(
        new THREE.CylinderGeometry(6, 6, 14, 16),
        new THREE.MeshStandardMaterial({ color: 0x607d8b })
      );
      bin.position.set(700 + i * 40, 7, 80);
      scene.add(bin);
    }
    // Cleaning cart
    const cart = new THREE.Mesh(
      new THREE.BoxGeometry(18, 8, 12),
      new THREE.MeshStandardMaterial({ color: 0xffb300 })
    );
    cart.position.set(850, 4, 200);
    scene.add(cart);

    // Remove/comment out previous direction arrow code to avoid overlap
    // Add a large, bold, glowing green arrow in the main aisle
    const aisleX = roomSize / 2;
    const aisleZ = roomSize / 2;
    // Glowing green circle
    const bigCircle = new THREE.Mesh(
      new THREE.CircleGeometry(48, 64),
      new THREE.MeshBasicMaterial({
        color: 0x43e047,
        transparent: true,
        opacity: 0.45,
      })
    );
    bigCircle.position.set(aisleX, 4, aisleZ);
    bigCircle.rotation.x = -Math.PI / 2;
    scene.add(bigCircle);
    // Thick white arrow (extruded)
    const bigShape = new THREE.Shape();
    bigShape.moveTo(-16, -24);
    bigShape.lineTo(16, -24);
    bigShape.lineTo(16, 0);
    bigShape.lineTo(32, 0);
    bigShape.lineTo(0, 48);
    bigShape.lineTo(-32, 0);
    bigShape.lineTo(-16, 0);
    bigShape.lineTo(-16, -24);
    const bigExtrude = { depth: 4, bevelEnabled: false };
    const bigGeom = new THREE.ExtrudeGeometry(bigShape, bigExtrude);
    const bigMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.8,
    });
    const bigArrow = new THREE.Mesh(bigGeom, bigMat);
    bigArrow.position.set(aisleX, 5.5, aisleZ);
    scene.add(bigArrow);

    // --- Animation for moving/rotating elements ---
    let forkliftDir = 1;
    function animateScene() {
      // Forklift movement
      if (forklift) {
        forklift.position.x += 0.7 * forkliftDir;
        if (forklift.position.x > 600) forkliftDir = -1;
        if (forklift.position.x < 200) forkliftDir = 1;
      }
      // Fans rotation
      fans.forEach((fan) => (fan.rotation.y += 0.08));
      // Conveyor boxes movement
      conveyorBoxes.forEach((box, idx) => {
        box.position.x += 0.7;
        if (box.position.x > roomSize / 2 + 60)
          box.position.x = roomSize / 2 - 40;
      });
      // Blinking indicator lights
      indicators.forEach((light, idx) => {
        const t = Date.now() * 0.003 + idx;
        light.material.emissiveIntensity = 0.5 + 0.5 * Math.sin(t * 3);
      });
      renderer.render(scene, camera);
      controls.update();
      requestAnimationFrame(animateScene);
    }
    animateScene();

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
      initialViewSet.current = false;
    };
  }, [rects, insideView]);

  // Camera control handlers
  const handleZoomIn = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.multiplyScalar(0.85);
      controlsRef.current.update();
    }
  };
  const handleZoomOut = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.multiplyScalar(1.15);
      controlsRef.current.update();
    }
  };
  const handleRotate = () => {
    if (cameraRef.current && controlsRef.current) {
      const cam = cameraRef.current;
      const target = controlsRef.current.target;
      const dx = cam.position.x - target.x;
      const dz = cam.position.z - target.z;
      const angle = Math.atan2(dz, dx) + Math.PI / 8;
      const radius = Math.sqrt(dx * dx + dz * dz);
      cam.position.x = target.x + radius * Math.cos(angle);
      cam.position.z = target.z + radius * Math.sin(angle);
      cam.lookAt(target);
      controlsRef.current.update();
    }
  };
  const handleResetView = () => {
    if (cameraRef.current && controlsRef.current) {
      const roomSize = roomSizeRef.current;
      const wallHeight = wallHeightRef.current;
      setFrontAngledView(
        cameraRef.current,
        controlsRef.current,
        roomSize,
        wallHeight
      );
    }
  };

  // Detection overlay component
  const DetectionOverlay = () => {
    if (!image || !showDetection) return null;
    // Hide overlay after 2 seconds
    React.useEffect(() => {
      if (!showDetection) return;
      const timeout = setTimeout(() => setShowDetection(false), 2000);
      return () => clearTimeout(timeout);
    }, [showDetection]);
    return (
      <div
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(30,32,40,0.32)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 36,
            boxShadow: "0 4px 32px rgba(0,0,0,0.18)",
            minWidth: 320,
            textAlign: "center",
            maxWidth: 360,
            position: "relative",
            zIndex: 10000,
          }}
        >
          <h2 style={{ color: "#223366", marginBottom: 18 }}>
            Detecting your floor plan...
          </h2>
          <div
            style={{
              position: "relative",
              width: 180,
              height: 100,
              margin: "0 auto",
              background: "#eee",
              borderRadius: 8,
              overflow: "hidden",
              boxShadow: "0 2px 8px #ccc",
            }}
          >
            {image && (
              <img
                src={image}
                alt="Uploaded"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  opacity: 0.7,
                }}
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: "700px",
      }}
    >
      {/* Camera Controls */}
      <div
        style={{
          position: "absolute",
          top: 24,
          right: 24,
          zIndex: 1200,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <button
          onClick={handleZoomIn}
          style={{
            background: "#3456FF",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            width: 44,
            height: 44,
            fontSize: 24,
            fontWeight: 700,
            boxShadow: "0 2px 8px #3456ff33",
            cursor: "pointer",
          }}
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          style={{
            background: "#3456FF",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            width: 44,
            height: 44,
            fontSize: 24,
            fontWeight: 700,
            boxShadow: "0 2px 8px #3456ff33",
            cursor: "pointer",
          }}
        >
          -
        </button>
        <button
          onClick={handleRotate}
          style={{
            background: "#3456FF",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            width: 44,
            height: 44,
            fontSize: 20,
            fontWeight: 700,
            boxShadow: "0 2px 8px #3456ff33",
            cursor: "pointer",
            transform: "rotate(45deg)",
          }}
        >
          ⟳
        </button>
        <button
          onClick={handleResetView}
          style={{
            background: "#fff",
            color: "#3456FF",
            border: "2px solid #3456FF",
            borderRadius: 8,
            width: 44,
            height: 44,
            fontSize: 18,
            fontWeight: 700,
            boxShadow: "0 2px 8px #3456ff22",
            cursor: "pointer",
          }}
        >
          ⭯
        </button>
      </div>
      {/* Legend Panel */}
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          background: "rgba(255,255,255,0.95)",
          borderRadius: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          padding: 12,
          zIndex: 1000,
          fontSize: 14,
          fontFamily: "Arial, sans-serif",
          minWidth: 120,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 6, color: "#3456FF" }}>
          Legend
        </div>
        <div style={{ fontWeight: 500, marginBottom: 2 }}>
          Boxes:{" "}
          <span style={{ color: "#3456FF", fontWeight: 700 }}>{boxCount}</span>
        </div>
        <div style={{ fontWeight: 500, marginBottom: 2 }}>
          Pallets:{" "}
          <span style={{ color: "#3456FF", fontWeight: 700 }}>
            {palletCount}
          </span>
        </div>
        <div style={{ fontWeight: 500, marginBottom: 8 }}>
          Stocks:{" "}
          <span style={{ color: "#3456FF", fontWeight: 700 }}>
            {stockCount}
          </span>
        </div>
        {colorLegend.map((item, i) => (
          <div
            key={i}
            style={{ display: "flex", alignItems: "center", marginBottom: 4 }}
          >
            <span
              style={{
                display: "inline-block",
                width: 18,
                height: 18,
                background: item.color,
                border: "1.5px solid #888",
                borderRadius: 4,
                marginRight: 8,
              }}
            />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          minHeight: "700px",
          position: "relative",
          zIndex: 1,
        }}
      />
      {showDetection && <DetectionOverlay />}
    </div>
  );
}
