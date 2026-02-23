import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * FinSight Auth Canvas — Three.js animated background
 * Scene: floating nodes (financial data points) connected by glowing lines,
 *        rotating slowly in 3D space over a dark starfield.
 */
export default function AuthCanvas() {
    const mountRef = useRef(null);

    useEffect(() => {
        const el = mountRef.current;
        if (!el) return;

        // ── Renderer ───────────────────────────────────────────────────────────────
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(el.clientWidth, el.clientHeight);
        renderer.setClearColor(0x000000, 0);
        el.appendChild(renderer.domElement);

        // ── Scene & Camera ─────────────────────────────────────────────────────────
        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x080c14, 0.035);

        const camera = new THREE.PerspectiveCamera(60, el.clientWidth / el.clientHeight, 0.1, 200);
        camera.position.set(0, 0, 22);

        // ── Accent colours ─────────────────────────────────────────────────────────
        const BLUE = new THREE.Color(0x3b82f6);
        const CYAN = new THREE.Color(0x06b6d4);
        const WHITE = new THREE.Color(0xffffff);

        // ── Stars (background particle field) ──────────────────────────────────────
        const starGeo = new THREE.BufferGeometry();
        const starCount = 800;
        const starPos = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount * 3; i++) starPos[i] = (Math.random() - 0.5) * 120;
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.12, transparent: true, opacity: 0.35 });
        scene.add(new THREE.Points(starGeo, starMat));

        // ── Graph nodes ────────────────────────────────────────────────────────────
        const NODE_COUNT = 40;
        const nodes = [];
        const nodeGroup = new THREE.Group();
        scene.add(nodeGroup);

        for (let i = 0; i < NODE_COUNT; i++) {
            const isMajor = i < 8;
            const radius = isMajor ? 0.18 : 0.08;
            const geo = new THREE.SphereGeometry(radius, 8, 8);
            const col = i % 3 === 0 ? CYAN : i % 3 === 1 ? BLUE : WHITE;
            const mat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: isMajor ? 0.9 : 0.55 });
            const mesh = new THREE.Mesh(geo, mat);

            const spread = 16;
            mesh.position.set(
                (Math.random() - 0.5) * spread,
                (Math.random() - 0.5) * spread,
                (Math.random() - 0.5) * spread * 0.5,
            );

            // each node drifts gently
            nodes.push({
                mesh,
                vel: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.006,
                    (Math.random() - 0.5) * 0.006,
                    (Math.random() - 0.5) * 0.003,
                ),
                phase: Math.random() * Math.PI * 2,
            });
            nodeGroup.add(mesh);
        }

        // ── Edges (glowing lines between nearby nodes) ─────────────────────────────
        const edgeGroup = new THREE.Group();
        scene.add(edgeGroup);
        const MAX_DIST = 6.5;
        const edgeLines = []; // {line, a, b}

        for (let i = 0; i < NODE_COUNT; i++) {
            for (let j = i + 1; j < NODE_COUNT; j++) {
                const dist = nodes[i].mesh.position.distanceTo(nodes[j].mesh.position);
                if (dist < MAX_DIST) {
                    const points = [nodes[i].mesh.position.clone(), nodes[j].mesh.position.clone()];
                    const geo = new THREE.BufferGeometry().setFromPoints(points);
                    const alpha = 1 - dist / MAX_DIST;
                    const mat = new THREE.LineBasicMaterial({
                        color: alpha > 0.5 ? BLUE : CYAN,
                        transparent: true,
                        opacity: alpha * 0.35,
                    });
                    const line = new THREE.Line(geo, mat);
                    edgeGroup.add(line);
                    edgeLines.push({ line, a: i, b: j });
                }
            }
        }

        // ── Floating price-chart polyline ──────────────────────────────────────────
        const chartPoints = [];
        for (let i = 0; i < 30; i++) {
            chartPoints.push(new THREE.Vector3(
                -7 + i * 0.5,
                Math.sin(i * 0.4 + 1) * 1.5 + Math.sin(i * 0.9) * 0.6 - 5,
                -4,
            ));
        }
        const chartGeo = new THREE.BufferGeometry().setFromPoints(chartPoints);
        const chartMat = new THREE.LineBasicMaterial({ color: CYAN, transparent: true, opacity: 0.45 });
        const chartLine = new THREE.Line(chartGeo, chartMat);
        scene.add(chartLine);

        // ── Resize handler ─────────────────────────────────────────────────────────
        const onResize = () => {
            camera.aspect = el.clientWidth / el.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(el.clientWidth, el.clientHeight);
        };
        window.addEventListener('resize', onResize);

        // ── Mouse parallax ─────────────────────────────────────────────────────────
        const mouse = { x: 0, y: 0 };
        const onMouse = (e) => {
            mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
            mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
        };
        window.addEventListener('mousemove', onMouse);

        // ── Animation loop ─────────────────────────────────────────────────────────
        let frameId;
        const clock = new THREE.Clock();

        const animate = () => {
            frameId = requestAnimationFrame(animate);
            const t = clock.getElapsedTime();

            // drift nodes
            nodes.forEach((n, _i) => {
                n.mesh.position.add(n.vel);
                n.mesh.position.y += Math.sin(t * 0.4 + n.phase) * 0.001;
                // soft bounce
                ['x', 'y', 'z'].forEach(ax => {
                    const lim = ax === 'z' ? 6 : 9;
                    if (Math.abs(n.mesh.position[ax]) > lim) n.vel[ax] *= -1;
                });
            });

            // update edge positions
            edgeLines.forEach(({ line, a, b }) => {
                const pos = line.geometry.attributes.position;
                pos.setXYZ(0, nodes[a].mesh.position.x, nodes[a].mesh.position.y, nodes[a].mesh.position.z);
                pos.setXYZ(1, nodes[b].mesh.position.x, nodes[b].mesh.position.y, nodes[b].mesh.position.z);
                pos.needsUpdate = true;
            });

            // slow group rotation + mouse parallax
            nodeGroup.rotation.y = t * 0.018 + mouse.x * 0.12;
            nodeGroup.rotation.x = mouse.y * 0.08;
            edgeGroup.rotation.y = nodeGroup.rotation.y;
            edgeGroup.rotation.x = nodeGroup.rotation.x;

            // float chart line
            chartLine.position.y = Math.sin(t * 0.3) * 0.4;

            renderer.render(scene, camera);
        };

        animate();

        // ── Cleanup ────────────────────────────────────────────────────────────────
        return () => {
            cancelAnimationFrame(frameId);
            window.removeEventListener('resize', onResize);
            window.removeEventListener('mousemove', onMouse);
            renderer.dispose();
            if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
        };
    }, []);

    return (
        <div
            ref={mountRef}
            style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                zIndex: 0, pointerEvents: 'none',
                overflow: 'hidden',
            }}
        />
    );
}
