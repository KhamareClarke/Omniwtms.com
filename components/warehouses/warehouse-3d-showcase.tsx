// @ts-nocheck
"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

// Define inventory types and their colors
const INVENTORY_TYPES = {
  PALLET: { color: 0xf44336, label: "Pallet" }, // Red
  INVENTORY: { color: 0xf44336, label: "Inventory" }, // Red
  BACKSTOCK: { color: 0x4caf50, label: "Backstock" }, // Green
  SHIPPING: { color: 0xff9800, label: "Shipping" }, // Orange
  RECEIVING: { color: 0x9c27b0, label: "Receiving" }, // Purple
  TEST_COUNT: { color: 0x795548, label: "Test Count" }, // Brown
  BOXES: { color: 0x607d8b, label: "Boxes" }, // Blue Grey
  UB_KITS: { color: 0xe91e63, label: "U.B. Kits" }, // Pink
};

export function Warehouse3DShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    // Add legend panel
    const legendPanel = document.createElement("div");
    legendPanel.style.position = "absolute";
    legendPanel.style.top = "10px";
    legendPanel.style.left = "10px";
    legendPanel.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
    legendPanel.style.padding = "15px";
    legendPanel.style.borderRadius = "8px";
    legendPanel.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
    legendPanel.style.zIndex = "1000";
    legendPanel.style.fontFamily = "Arial, sans-serif";
    legendPanel.style.fontSize = "14px";

    // Add title
    const title = document.createElement("h3");
    title.textContent = "Inventory Legend";
    title.style.margin = "0 0 10px 0";
    title.style.color = "#333";
    legendPanel.appendChild(title);

    // Add color items
    Object.entries(INVENTORY_TYPES).forEach(([key, { color, label }]) => {
      const item = document.createElement("div");
      item.style.display = "flex";
      item.style.alignItems = "center";
      item.style.marginBottom = "5px";

      const colorBox = document.createElement("div");
      colorBox.style.width = "20px";
      colorBox.style.height = "20px";
      colorBox.style.backgroundColor = `#${color
        .toString(16)
        .padStart(6, "0")}`;
      colorBox.style.marginRight = "10px";
      colorBox.style.border = "1px solid #ccc";

      const label = document.createElement("span");
      label.textContent = INVENTORY_TYPES[key].label;

      item.appendChild(colorBox);
      item.appendChild(label);
      legendPanel.appendChild(item);
    });

    containerRef.current.appendChild(legendPanel);

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xeaeaea);

    // Camera (isometric)
    const aspect =
      containerRef.current.clientWidth / containerRef.current.clientHeight;
    const d = 18;
    const camera = new THREE.OrthographicCamera(
      -d * aspect,
      d * aspect,
      d,
      -d,
      1,
      100
    );
    camera.position.set(20, 20, 20);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableRotate = false;
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.minDistance = 10;
    controls.maxDistance = 50;
    controls.target.set(0, 0, 0);

    // Add zoom buttons
    const zoomInBtn = document.createElement("button");
    zoomInBtn.innerHTML = "+";
    zoomInBtn.style.position = "absolute";
    zoomInBtn.style.top = "10px";
    zoomInBtn.style.right = "10px";
    zoomInBtn.style.padding = "8px 16px";
    zoomInBtn.style.fontSize = "20px";
    zoomInBtn.style.backgroundColor = "#fff";
    zoomInBtn.style.border = "1px solid #ccc";
    zoomInBtn.style.borderRadius = "4px";
    zoomInBtn.style.cursor = "pointer";
    zoomInBtn.style.zIndex = "1000";
    zoomInBtn.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
    zoomInBtn.onclick = () => {
      handleZoomIn();
    };
    containerRef.current.appendChild(zoomInBtn);

    const zoomOutBtn = document.createElement("button");
    zoomOutBtn.innerHTML = "-";
    zoomOutBtn.style.position = "absolute";
    zoomOutBtn.style.top = "50px";
    zoomOutBtn.style.right = "10px";
    zoomOutBtn.style.padding = "8px 16px";
    zoomOutBtn.style.fontSize = "20px";
    zoomOutBtn.style.backgroundColor = "#fff";
    zoomOutBtn.style.border = "1px solid #ccc";
    zoomOutBtn.style.borderRadius = "4px";
    zoomOutBtn.style.cursor = "pointer";
    zoomOutBtn.style.zIndex = "1000";
    zoomOutBtn.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
    zoomOutBtn.onclick = () => {
      handleZoomOut();
    };
    containerRef.current.appendChild(zoomOutBtn);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
    dirLight.position.set(20, 30, 20);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Floor (replace with grid of 'T' shapes)
    // Remove old floor mesh
    // const floorGeometry = new THREE.PlaneGeometry(32, 18);
    // const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xd6d6d6 });
    // const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    // floor.rotation.x = -Math.PI / 2;
    // floor.receiveShadow = true;
    // scene.add(floor);

    // Parameters for T grid
    const floorWidth = 32;
    const floorDepth = 18;
    const tSize = 2.5; // width of each T tile
    const tThickness = 0.4; // thickness of T arms
    const tHeight = 0.18; // height of T extrusion
    const tColor = 0x222222;
    const tRows = Math.floor(floorDepth / tSize);
    const tCols = Math.floor(floorWidth / tSize);
    for (let row = 0; row < tRows; row++) {
      for (let col = 0; col < tCols; col++) {
        // Create a bold T shape
        const shape = new THREE.Shape();
        // Top bar
        shape.moveTo(-tSize / 2, tSize / 2);
        shape.lineTo(tSize / 2, tSize / 2);
        shape.lineTo(tSize / 2, tSize / 2 - tThickness);
        shape.lineTo(tThickness / 2, tSize / 2 - tThickness);
        shape.lineTo(tThickness / 2, -tSize / 2);
        shape.lineTo(-tThickness / 2, -tSize / 2);
        shape.lineTo(-tThickness / 2, tSize / 2 - tThickness);
        shape.lineTo(-tSize / 2, tSize / 2 - tThickness);
        shape.lineTo(-tSize / 2, tSize / 2);
        const extrudeSettings = { depth: tHeight, bevelEnabled: false };
        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        const material = new THREE.MeshStandardMaterial({ color: tColor });
        const tMesh = new THREE.Mesh(geometry, material);
        tMesh.position.set(
          -floorWidth / 2 + col * tSize + tSize / 2,
          0.01, // slightly above y=0
          -floorDepth / 2 + row * tSize + tSize / 2
        );
        tMesh.rotation.x = -Math.PI / 2;
        tMesh.castShadow = false;
        tMesh.receiveShadow = true;
        scene.add(tMesh);
      }
    }

    // Walls
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xbdbdbd });
    const wallHeight = 2.5;
    const wallThickness = 0.15;
    const wall1 = new THREE.Mesh(
      new THREE.BoxGeometry(32, wallHeight, wallThickness),
      wallMaterial
    );
    wall1.position.set(0, wallHeight / 2, -9);
    scene.add(wall1);
    const wall2 = wall1.clone();
    wall2.position.set(0, wallHeight / 2, 9);
    scene.add(wall2);
    const wall3 = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, 18),
      wallMaterial
    );
    wall3.position.set(-16, wallHeight / 2, 0);
    scene.add(wall3);
    const wall4 = wall3.clone();
    wall4.position.set(16, wallHeight / 2, 0);
    scene.add(wall4);

    // Roof outline
    const roofGeometry = new THREE.EdgesGeometry(
      new THREE.BoxGeometry(32, 0.1, 18)
    );
    const roofMaterial = new THREE.LineBasicMaterial({ color: 0x888888 });
    const roof = new THREE.LineSegments(roofGeometry, roofMaterial);
    roof.position.set(0, wallHeight + 0.05, 0);
    scene.add(roof);

    // Structural posts
    for (let i = 0; i < 6; i++) {
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, wallHeight + 0.2, 16),
        new THREE.MeshStandardMaterial({ color: 0x888888 })
      );
      post.position.set(-14 + i * 5.6, wallHeight / 2, -8.7);
      scene.add(post);
      const post2 = post.clone();
      post2.position.set(-14 + i * 5.6, wallHeight / 2, 8.7);
      scene.add(post2);
    }

    // Labeled zones (Receiving, Inventory, Backstock, etc.)
    function addZone(
      x: number,
      z: number,
      w: number,
      d: number,
      h: number,
      color: number,
      label: string
    ) {
      const mat = new THREE.MeshStandardMaterial({
        color,
        opacity: 0.92,
        transparent: true,
      });
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      mesh.position.set(x, h / 2, z);
      mesh.castShadow = true;
      scene.add(mesh);
      // Add label as 3D sprite
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 64;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = "bold 28px Arial";
        ctx.fillStyle = "#222";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, canvas.width / 2, canvas.height / 2);
      }
      const texture = new THREE.CanvasTexture(canvas);
      const labelMaterial = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(labelMaterial);
      sprite.position.set(x, h + 0.7, z);
      sprite.scale.set(2, 0.5, 1);
      scene.add(sprite);
    }

    // Top: Palettes, U.B. Kits
    addZone(-12, -7.5, 3, 1.2, 0.7, 0xffeb3b, "Palettes");
    addZone(12, -7.5, 3, 1.2, 0.7, 0xffeb3b, "Palettes");
    addZone(-7.5, -7.5, 2, 1.2, 0.7, 0xe91e63, "U.B. Kits");
    addZone(7.5, -7.5, 2, 1.2, 0.7, 0xe91e63, "U.B. Kits");

    // Receiving
    addZone(13, -5, 4, 2.5, 1.2, 0x1976d2, "Receiving");
    // Test Count Desk
    addZone(15, 0, 1.2, 8, 1.2, 0x00bcd4, "Test Count Desk");
    // Shipping Table
    addZone(13, 5, 2, 1.2, 0.7, 0x43a047, "Shipping Table");
    // Boxes
    addZone(13, 7, 1.2, 1.2, 0.7, 0x283593, "Boxes");

    // Main inventory area: 4 rows of racks with flow arrows
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 2; col++) {
        addZone(
          -7 + col * 8,
          -2 + row * 2.2,
          6,
          1.1,
          1.2,
          0xfbc02d,
          "Inventory"
        );
      }
    }
    // Inventory Cut
    addZone(7, -2, 6, 1.1, 1.2, 0xf06292, "Inventory Cut");

    // Backstock (bottom)
    for (let i = 0; i < 4; i++) {
      addZone(-12 + i * 8, 7.5, 6, 1.5, 1.2, 0x8d6e63, "Backstock");
    }

    // Flow arrows (as 3D extruded shapes)
    function addArrow(
      x: number,
      z: number,
      dir: "right" | "left" | "up" | "down" = "right"
    ) {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(1, 0.3);
      shape.lineTo(0.7, 0.3);
      shape.lineTo(0.7, 0.7);
      shape.lineTo(-0.7, 0.7);
      shape.lineTo(-0.7, 0.3);
      shape.lineTo(-1, 0.3);
      shape.lineTo(0, 0);
      const extrudeSettings = { depth: 0.1, bevelEnabled: false };
      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      const material = new THREE.MeshStandardMaterial({ color: 0x222222 });
      const arrow = new THREE.Mesh(geometry, material);
      arrow.position.set(x, 0.11, z);
      if (dir === "right") arrow.rotation.y = 0;
      if (dir === "left") arrow.rotation.y = Math.PI;
      if (dir === "up") arrow.rotation.y = -Math.PI / 2;
      if (dir === "down") arrow.rotation.y = Math.PI / 2;
      scene.add(arrow);
    }
    addArrow(-7, -3, "right");
    addArrow(1, -3, "right");
    addArrow(-7, -1, "right");
    addArrow(1, -1, "right");
    addArrow(7, -3, "down");
    addArrow(7, -1, "down");

    // Add a human figure (cylinder body and sphere head) inside the warehouse
    const humanBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 1.2, 24),
      new THREE.MeshStandardMaterial({ color: 0x1976d2 })
    );
    humanBody.position.set(2, 0.6, 2);
    scene.add(humanBody);
    const humanHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 24, 24),
      new THREE.MeshStandardMaterial({ color: 0xffe0b2 })
    );
    humanHead.position.set(2, 1.3, 2);
    scene.add(humanHead);

    // Add a few colored cylinders (barrels/columns) inside the warehouse
    for (let i = 0; i < 3; i++) {
      const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.4, 1, 24),
        new THREE.MeshStandardMaterial({ color: 0xff9800 })
      );
      barrel.position.set(-6 + i * 3, 0.5, -3);
      scene.add(barrel);
    }

    // Add direction arrows on the floor (after the T-shape floor)
    function createDirectionArrow(
      size: number,
      color: number,
      position: THREE.Vector3,
      rotation: number
    ) {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(size, 0);
      shape.lineTo(size * 0.8, size * 0.35); // Thicker arrow head
      shape.lineTo(size * 0.8, -size * 0.35);
      shape.lineTo(size, 0);
      // Make the shaft thicker
      shape.moveTo(0, 0.18);
      shape.lineTo(size * 0.7, 0.18);
      shape.lineTo(size * 0.7, -0.18);
      shape.lineTo(0, -0.18);
      shape.lineTo(0, 0.18);
      const extrudeSettings = { depth: 0.3, bevelEnabled: false };
      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      // Black arrow with white outline
      const group = new THREE.Group();
      const arrowMaterial = new THREE.MeshStandardMaterial({
        color: 0x000000, // Black
        metalness: 0.2,
        roughness: 0.3,
        emissive: 0x000000,
        emissiveIntensity: 0.5,
      });
      const arrow = new THREE.Mesh(geometry, arrowMaterial);
      arrow.castShadow = true;
      arrow.receiveShadow = true;
      // White outline
      const outlineMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.BackSide,
      });
      const outline = new THREE.Mesh(geometry, outlineMaterial);
      outline.scale.multiplyScalar(1.08);
      outline.position.y -= 0.01;
      group.add(outline);
      group.add(arrow);
      group.position.copy(position);
      group.position.y = 0.12;
      group.rotation.x = -Math.PI / 2;
      group.rotation.z = rotation;
      scene.add(group);
    }

    // Add compass arrows with larger size and bold black color
    const arrowSize = 5;
    const arrowColor = 0x000000; // Black
    createDirectionArrow(
      arrowSize,
      arrowColor,
      new THREE.Vector3(0, 0.1, 0),
      0
    ); // North
    createDirectionArrow(
      arrowSize,
      arrowColor,
      new THREE.Vector3(0, 0.1, 0),
      Math.PI / 2
    ); // East
    createDirectionArrow(
      arrowSize,
      arrowColor,
      new THREE.Vector3(0, 0.1, 0),
      Math.PI
    ); // South
    createDirectionArrow(
      arrowSize,
      arrowColor,
      new THREE.Vector3(0, 0.1, 0),
      -Math.PI / 2
    ); // West

    // Add compass labels with better visibility
    function addCompassLabel(text: string, position: THREE.Vector3) {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 128;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = "bold 48px Arial";
        ctx.fillStyle = "#000000";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);
      }
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 0.9,
      });
      const sprite = new THREE.Sprite(material);
      sprite.position.copy(position);
      sprite.position.y = 0.2; // Raise above arrows
      sprite.scale.set(4, 2, 1);
      scene.add(sprite);
    }

    // Add compass labels with adjusted positions
    addCompassLabel("N", new THREE.Vector3(0, 0.2, -arrowSize - 2));
    addCompassLabel("E", new THREE.Vector3(arrowSize + 2, 0.2, 0));
    addCompassLabel("S", new THREE.Vector3(0, 0.2, arrowSize + 2));
    addCompassLabel("W", new THREE.Vector3(-arrowSize - 2, 0.2, 0));

    // Add a circle around the compass
    const circleGeometry = new THREE.RingGeometry(
      arrowSize * 0.8,
      arrowSize * 1.2,
      32
    );
    const circleMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.3,
    });
    const circle = new THREE.Mesh(circleGeometry, circleMaterial);
    circle.rotation.x = -Math.PI / 2;
    circle.position.y = 0.05;
    scene.add(circle);

    // Box highlighting and tooltip
    let hoveredBox: THREE.Mesh | null = null;
    let tooltipDiv: HTMLDivElement | null = null;
    function onPointerMove(event: MouseEvent) {
      if (!renderer.domElement.contains(event.target as Node)) return;
      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      let found = false;
      for (const intersect of intersects) {
        const obj = intersect.object;
        if (obj.userData && obj.userData.boxType) {
          found = true;
          if (hoveredBox && hoveredBox !== obj) {
            hoveredBox.material.emissive?.setHex(
              hoveredBox.userData.originalEmissive || 0x000000
            );
          }
          hoveredBox = obj as THREE.Mesh;
          if (!hoveredBox.userData.originalEmissive) {
            hoveredBox.userData.originalEmissive =
              hoveredBox.material.emissive?.getHex();
          }
          hoveredBox.material.emissive?.setHex(0xffff00); // Yellow glow
          // Tooltip
          if (!tooltipDiv) {
            tooltipDiv = document.createElement("div");
            tooltipDiv.style.position = "fixed";
            tooltipDiv.style.background = "#222";
            tooltipDiv.style.color = "#fff";
            tooltipDiv.style.padding = "6px 14px";
            tooltipDiv.style.borderRadius = "6px";
            tooltipDiv.style.fontSize = "15px";
            tooltipDiv.style.fontWeight = "bold";
            tooltipDiv.style.pointerEvents = "none";
            tooltipDiv.style.zIndex = "3000";
            document.body.appendChild(tooltipDiv);
          }
          tooltipDiv.textContent = hoveredBox.userData.boxType;
          tooltipDiv.style.left = event.clientX + 12 + "px";
          tooltipDiv.style.top = event.clientY - 12 + "px";
          break;
        }
      }
      if (!found && hoveredBox) {
        hoveredBox.material.emissive?.setHex(
          hoveredBox.userData.originalEmissive || 0x000000
        );
        hoveredBox = null;
        if (tooltipDiv) {
          tooltipDiv.remove();
          tooltipDiv = null;
        }
      }
    }
    renderer.domElement.addEventListener("pointermove", onPointerMove);

    // Add inventory boxes based on detected items
    function createInventoryBox(
      type: keyof typeof INVENTORY_TYPES,
      x: number,
      z: number,
      width: number,
      depth: number,
      height: number
    ) {
      const { color } = INVENTORY_TYPES[type];
      const geometry = new THREE.BoxGeometry(width, height, depth);
      const material = new THREE.MeshStandardMaterial({
        color,
        metalness: 0.1,
        roughness: 0.7,
        transparent: true,
        opacity: 0.9,
      });
      const box = new THREE.Mesh(geometry, material);
      box.position.set(x, height / 2, z);
      box.castShadow = true;
      box.receiveShadow = true;
      box.userData.boxType = INVENTORY_TYPES[type].label;
      scene.add(box);

      // Add label
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 128;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = "bold 32px Arial";
        ctx.fillStyle = "#000000";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          INVENTORY_TYPES[type].label,
          canvas.width / 2,
          canvas.height / 2
        );
      }
      const texture = new THREE.CanvasTexture(canvas);
      const labelMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 0.9,
      });
      const label = new THREE.Sprite(labelMaterial);
      label.position.set(x, height + 0.5, z);
      label.scale.set(4, 2, 1);
      scene.add(label);
    }

    // Create inventory boxes based on detected items
    // Palettes (top left and right)
    createInventoryBox("PALLET", -12, -7.5, 3, 1.2, 0.7);
    createInventoryBox("PALLET", 12, -7.5, 3, 1.2, 0.7);

    // U.B. Kits
    createInventoryBox("UB_KITS", -7.5, -7.5, 2, 1.2, 0.7);
    createInventoryBox("UB_KITS", 7.5, -7.5, 2, 1.2, 0.7);

    // Receiving
    createInventoryBox("RECEIVING", 13, -5, 4, 2.5, 1.2);

    // Test Count Desk
    createInventoryBox("TEST_COUNT", 15, 0, 1.2, 8, 1.2);

    // Shipping Table
    createInventoryBox("SHIPPING", 13, 5, 2, 1.2, 0.7);

    // Boxes
    createInventoryBox("BOXES", 13, 7, 1.2, 1.2, 0.7);

    // Main inventory area
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 2; col++) {
        createInventoryBox(
          "INVENTORY",
          -7 + col * 8,
          -2 + row * 2.2,
          6,
          1.1,
          1.2
        );
      }
    }

    // Backstock
    for (let i = 0; i < 4; i++) {
      createInventoryBox("BACKSTOCK", -12 + i * 8, 7.5, 6, 1.5, 1.2);
    }

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const aspect =
        containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.left = -d * aspect;
      camera.right = d * aspect;
      camera.updateProjectionMatrix();
      renderer.setSize(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight
      );
    };
    window.addEventListener("resize", handleResize);

    // Add event listeners for zoom-in and zoom-out
    function handleZoomIn() {
      if (cameraRef.current) {
        cameraRef.current.zoom *= 1.2;
        cameraRef.current.updateProjectionMatrix();
        setZoomLevel(cameraRef.current.zoom);
      }
    }
    function handleZoomOut() {
      if (cameraRef.current) {
        cameraRef.current.zoom /= 1.2;
        cameraRef.current.updateProjectionMatrix();
        setZoomLevel(cameraRef.current.zoom);
      }
    }
    window.addEventListener("zoom-in", handleZoomIn);
    window.addEventListener("zoom-out", handleZoomOut);

    // Add compass overlay (HTML) in top-left corner
    const compassOverlay = document.createElement("div");
    compassOverlay.style.position = "fixed";
    compassOverlay.style.top = "24px";
    compassOverlay.style.left = "24px";
    compassOverlay.style.background = "rgba(255,255,255,0.95)";
    compassOverlay.style.border = "2px solid #3456FF";
    compassOverlay.style.borderRadius = "50%";
    compassOverlay.style.width = "64px";
    compassOverlay.style.height = "64px";
    compassOverlay.style.display = "flex";
    compassOverlay.style.flexDirection = "column";
    compassOverlay.style.alignItems = "center";
    compassOverlay.style.justifyContent = "center";
    compassOverlay.style.zIndex = "2000";
    compassOverlay.style.boxShadow = "0 2px 8px rgba(52,86,255,0.10)";
    compassOverlay.innerHTML = `<div style="font-size:18px;font-weight:700;color:#3456FF;">N</div><div style="font-size:12px;color:#888;">E S W</div>`;
    document.body.appendChild(compassOverlay);
    // Add Reset View button in top-right
    const resetBtn = document.createElement("button");
    resetBtn.innerText = "Reset View";
    resetBtn.style.position = "fixed";
    resetBtn.style.top = "24px";
    resetBtn.style.right = "24px";
    resetBtn.style.background = "#3456FF";
    resetBtn.style.color = "#fff";
    resetBtn.style.fontWeight = "bold";
    resetBtn.style.fontSize = "16px";
    resetBtn.style.border = "none";
    resetBtn.style.borderRadius = "6px";
    resetBtn.style.padding = "8px 18px";
    resetBtn.style.zIndex = "2000";
    resetBtn.style.boxShadow = "0 2px 8px rgba(52,86,255,0.10)";
    resetBtn.style.cursor = "pointer";
    resetBtn.onclick = () => {
      cameraRef.current?.position.set(20, 20, 20);
      cameraRef.current?.lookAt(0, 0, 0);
      controls.target.set(0, 0, 0);
      controls.update();
    };
    document.body.appendChild(resetBtn);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("zoom-in", handleZoomIn);
      window.removeEventListener("zoom-out", handleZoomOut);
      if (containerRef.current) {
        if (renderer.domElement) {
          containerRef.current.removeChild(renderer.domElement);
        }
        if (zoomInBtn.parentNode) {
          zoomInBtn.parentNode.removeChild(zoomInBtn);
        }
        if (zoomOutBtn.parentNode) {
          zoomOutBtn.parentNode.removeChild(zoomOutBtn);
        }
        if (legendPanel.parentNode) {
          legendPanel.parentNode.removeChild(legendPanel);
        }
      }
      if (compassOverlay.parentNode)
        compassOverlay.parentNode.removeChild(compassOverlay);
      if (resetBtn.parentNode) resetBtn.parentNode.removeChild(resetBtn);
      renderer.dispose();
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      if (tooltipDiv) tooltipDiv.remove();
    };
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      {/* 3D Visualization container only, no description panel */}
      <div
        className="relative w-full h-full"
        style={{ maxWidth: 1200, minHeight: 600 }}
      >
        <div ref={containerRef} className="w-full h-full" />
      </div>
    </div>
  );
}
