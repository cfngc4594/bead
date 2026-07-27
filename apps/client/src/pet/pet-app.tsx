import type { PetConfig } from "@bead/pet";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PauseIcon, PlayIcon, PowerIcon, XIcon } from "lucide-react";
import { type RefObject, useEffect, useMemo, useRef, useState } from "react";
import type * as THREE from "three";
import { BeadInstancedMesh } from "@/features/bead/components/bead-instanced-mesh";
import { PressedSurfaceMesh } from "@/features/bead/components/pressed-surface-mesh";
import { getModelCameraDistance } from "@/features/bead/lib/bead-model-layout";
import {
  defaultModelPreviewSettings,
  getPressedModelPreviewConfig,
} from "@/features/bead/lib/model-preview-config";

declare global {
  interface Window {
    BeadPetAndroid?: {
      closeMenu?: () => void;
      getConfig: () => string;
      stopPet?: () => void;
    };
  }
}

const cameraFov = 32;
const pomodoroDurationMs = 25 * 60 * 1000;
const completeFlashDurationMs = 900;

type PomodoroState =
  | { status: "idle" }
  | { startedAt: number; status: "running" }
  | { elapsedMs: number; status: "paused" }
  | { status: "complete" };

export function PetApp() {
  const [config, setConfig] = useState(readInitialConfig);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pomodoroState, setPomodoroState] = useState<PomodoroState>({
    status: "idle",
  });
  const [pomodoroProgress, setPomodoroProgress] = useState(1);
  const [tapSignal, setTapSignal] = useState(0);

  useEffect(() => {
    function handleConfig(event: Event) {
      const nextConfig = (event as CustomEvent<unknown>).detail;

      if (isPetConfig(nextConfig)) {
        setConfig(nextConfig);
      }
    }

    function handleTap() {
      setTapSignal((value) => value + 1);
    }

    function handleLongPress() {
      setMenuOpen(true);
    }

    function handleCloseMenu() {
      setMenuOpen(false);
    }

    window.addEventListener("bead-pet-config", handleConfig);
    window.addEventListener("bead-pet-close-menu", handleCloseMenu);
    window.addEventListener("bead-pet-long-press", handleLongPress);
    window.addEventListener("bead-pet-tap", handleTap);

    return () => {
      window.removeEventListener("bead-pet-config", handleConfig);
      window.removeEventListener("bead-pet-close-menu", handleCloseMenu);
      window.removeEventListener("bead-pet-long-press", handleLongPress);
      window.removeEventListener("bead-pet-tap", handleTap);
    };
  }, []);

  useEffect(() => {
    if (pomodoroState.status === "idle" || pomodoroState.status === "complete") {
      setPomodoroProgress(1);
      return;
    }

    if (pomodoroState.status === "paused") {
      setPomodoroProgress(
        Math.min(1, pomodoroState.elapsedMs / pomodoroDurationMs),
      );
      return;
    }

    const startedAt = pomodoroState.startedAt;

    function updateRunningProgress() {
      const elapsedMs = Date.now() - startedAt;
      const nextProgress = Math.min(1, elapsedMs / pomodoroDurationMs);

      setPomodoroProgress(nextProgress);

      if (nextProgress >= 1) {
        setPomodoroState({ status: "complete" });
      }
    }

    updateRunningProgress();
    const intervalId = window.setInterval(updateRunningProgress, 1000);

    return () => window.clearInterval(intervalId);
  }, [pomodoroState]);

  // After complete flash, reset to idle
  useEffect(() => {
    if (pomodoroState.status !== "complete") {
      return;
    }

    const timerId = window.setTimeout(() => {
      setPomodoroState({ status: "idle" });
    }, completeFlashDurationMs + 600);

    return () => window.clearTimeout(timerId);
  }, [pomodoroState]);

  if (!config || config.instances.length === 0) {
    return null;
  }

  function closeMenu() {
    setMenuOpen(false);
    window.BeadPetAndroid?.closeMenu?.();
  }

  function togglePomodoro() {
    if (pomodoroState.status === "running") {
      setPomodoroState({
        elapsedMs: Date.now() - pomodoroState.startedAt,
        status: "paused",
      });
      return;
    }

    if (pomodoroState.status === "paused") {
      setPomodoroState({
        startedAt: Date.now() - pomodoroState.elapsedMs,
        status: "running",
      });
      return;
    }

    setPomodoroState({ startedAt: Date.now(), status: "running" });
    setPomodoroProgress(0);
  }

  function stopPet() {
    setMenuOpen(false);
    window.BeadPetAndroid?.stopPet?.();
  }

  const isActive = pomodoroState.status !== "idle";
  const isComplete = pomodoroState.status === "complete";
  const isPaused = pomodoroState.status === "paused";

  return (
    <div className="pet-shell" data-menu-open={menuOpen}>
      <div
        className="pet-stage"
        data-pomodoro-active={isActive && !isComplete}
        data-pomodoro-paused={isPaused}
        data-pomodoro-complete={isComplete}
        style={
          {
            "--pet-reveal-percent": `${pomodoroProgress * 100}%`,
          } as React.CSSProperties
        }
      >
        <PetScene config={config} tapSignal={tapSignal} />
      </div>
      {menuOpen ? (
        <PetMenu
          onCancelPomodoro={() => setPomodoroState({ status: "idle" })}
          onClose={closeMenu}
          onStartPomodoro={() => {
            togglePomodoro();
            closeMenu();
          }}
          onStopPet={stopPet}
          onTogglePomodoro={togglePomodoro}
          pomodoroState={pomodoroState}
        />
      ) : null}
    </div>
  );
}

function formatCountdown(pomodoroState: PomodoroState): string {
  let elapsedMs = 0;

  if (pomodoroState.status === "running") {
    elapsedMs = Date.now() - pomodoroState.startedAt;
  } else if (pomodoroState.status === "paused") {
    elapsedMs = pomodoroState.elapsedMs;
  }

  const remainingMs = Math.max(0, pomodoroDurationMs - elapsedMs);
  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function PetMenu({
  onCancelPomodoro,
  onClose,
  onStartPomodoro,
  onStopPet,
  onTogglePomodoro,
  pomodoroState,
}: {
  onCancelPomodoro: () => void;
  onClose: () => void;
  onStartPomodoro: () => void;
  onStopPet: () => void;
  onTogglePomodoro: () => void;
  pomodoroState: PomodoroState;
}) {
  function handleBackdropPointerDown(
    event: React.PointerEvent<HTMLDivElement>,
  ) {
    if (event.target !== event.currentTarget) {
      return;
    }

    onClose();
  }

  const status = pomodoroState.status;
  const isIdle = status === "idle" || status === "complete";
  const isRunning = status === "running";

  return (
    <div
      className="pet-menu"
      onPointerDown={handleBackdropPointerDown}
      role="presentation"
    >
      {!isIdle ? (
        <div className="pet-menu-status">
          <span className="pet-menu-timer">{formatCountdown(pomodoroState)}</span>
          <span className="pet-menu-status-label">
            {status === "paused" ? "已暂停" : "专注中"}
          </span>
        </div>
      ) : null}
      <div className="pet-menu-row">
        {isIdle ? (
          <>
            <PetMenuButton
              ariaLabel="开始番茄钟"
              className="pet-menu-item-primary"
              onClick={onStartPomodoro}
            >
              <PlayIcon
                aria-hidden="true"
                fill="currentColor"
                size={24}
                strokeWidth={0}
              />
            </PetMenuButton>
            <PetMenuButton
              ariaLabel="关闭桌宠"
              className="pet-menu-item-quiet"
              onClick={onStopPet}
            >
              <PowerIcon aria-hidden="true" size={20} strokeWidth={2.2} />
            </PetMenuButton>
          </>
        ) : isRunning ? (
          <>
            <PetMenuButton
              ariaLabel="暂停番茄钟"
              className="pet-menu-item-primary"
              onClick={onTogglePomodoro}
            >
              <PauseIcon
                aria-hidden="true"
                fill="currentColor"
                size={24}
                strokeWidth={0}
              />
            </PetMenuButton>
            <PetMenuButton
              ariaLabel="结束番茄钟"
              className="pet-menu-item-danger"
              onClick={onCancelPomodoro}
            >
              <XIcon aria-hidden="true" size={24} strokeWidth={2.4} />
            </PetMenuButton>
          </>
        ) : (
          <>
            <PetMenuButton
              ariaLabel="继续番茄钟"
              className="pet-menu-item-primary"
              onClick={onTogglePomodoro}
            >
              <PlayIcon
                aria-hidden="true"
                fill="currentColor"
                size={24}
                strokeWidth={0}
              />
            </PetMenuButton>
            <PetMenuButton
              ariaLabel="结束番茄钟"
              className="pet-menu-item-danger"
              onClick={onCancelPomodoro}
            >
              <XIcon aria-hidden="true" size={24} strokeWidth={2.4} />
            </PetMenuButton>
          </>
        )}
      </div>
    </div>
  );
}

function PetMenuButton({
  ariaLabel,
  children,
  className,
  onClick,
}: {
  ariaLabel: string;
  children: React.ReactNode;
  className: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={ariaLabel}
      className={`pet-menu-item ${className}`.trim()}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      onPointerDown={(event) => event.stopPropagation()}
      type="button"
    >
      {children}
    </button>
  );
}

function PetScene({
  config,
  tapSignal,
}: {
  config: PetConfig;
  tapSignal: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const layout = useMemo(
    () => getPetLayout(config.instances),
    [config.instances],
  );
  const cameraDistance = getModelCameraDistance({
    cols: layout.width,
    rows: layout.height,
    viewportHeight: 1,
    viewportWidth: 1,
    verticalFovDegrees: cameraFov,
    padding: 1.22,
  });
  const pressedConfig =
    config.mode === "beads" ? null : getPressedModelPreviewConfig(config.mode);

  return (
    <Canvas
      camera={{
        far: cameraDistance * 5,
        fov: cameraFov,
        near: 0.1,
        position: [0, 0, cameraDistance],
      }}
      dpr={[1, 1.5]}
      frameloop="demand"
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
    >
      <hemisphereLight
        color="#ffffff"
        groundColor="#d4d4d8"
        intensity={0.8 * config.settings.lightIntensity}
      />
      <directionalLight
        intensity={1.6 * config.settings.lightIntensity}
        position={[8, 10, 14]}
      />
      <directionalLight
        intensity={0.35 * config.settings.lightIntensity}
        position={[-10, -6, 8]}
      />
      <group position={[-layout.centerX, -layout.centerY, 0]} ref={groupRef}>
        {pressedConfig ? (
          <PressedSurfaceMesh
            instances={config.instances}
            normalMapUrl={resolvePetAssetUrl(pressedConfig.normalMapUrl)}
            normalScale={
              pressedConfig.normalScale * config.settings.textureStrength
            }
            patternSize={pressedConfig.patternSize}
            roughness={config.settings.roughness}
            textureScale={config.settings.textureScale}
          />
        ) : (
          <BeadInstancedMesh
            instances={config.instances}
            roughness={config.settings.roughness}
          />
        )}
      </group>
      <PetTapMotion groupRef={groupRef} signal={tapSignal} />
    </Canvas>
  );
}

function PetTapMotion({
  groupRef,
  signal,
}: {
  groupRef: RefObject<THREE.Group | null>;
  signal: number;
}) {
  const invalidate = useThree((state) => state.invalidate);
  const startedAtRef = useRef<number | null>(null);
  const activeRef = useRef(false);

  useEffect(() => {
    if (signal === 0) {
      return;
    }

    startedAtRef.current = null;
    activeRef.current = true;
    invalidate();
  }, [invalidate, signal]);

  useFrame((state) => {
    const group = groupRef.current;

    if (!activeRef.current || !group) {
      return;
    }

    startedAtRef.current ??= state.clock.elapsedTime;
    const progress = Math.min(
      1,
      (state.clock.elapsedTime - startedAtRef.current) / 0.7,
    );
    const bounce = Math.sin(progress * Math.PI);

    group.rotation.y = Math.sin(progress * Math.PI * 2) * 0.42;
    group.rotation.z = Math.sin(progress * Math.PI * 4) * 0.06;
    group.scale.setScalar(1 + bounce * 0.08);

    if (progress < 1) {
      invalidate();
      return;
    }

    group.rotation.set(0, 0, 0);
    group.scale.setScalar(1);
    activeRef.current = false;
  });

  return null;
}

function getPetLayout(instances: PetConfig["instances"]) {
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const instance of instances) {
    minX = Math.min(minX, instance.x);
    maxX = Math.max(maxX, instance.x);
    minY = Math.min(minY, instance.y);
    maxY = Math.max(maxY, instance.y);
  }

  return {
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
    height: Math.max(1, maxY - minY + 1),
    width: Math.max(1, maxX - minX + 1),
  };
}

function readInitialConfig() {
  try {
    const serializedConfig = window.BeadPetAndroid?.getConfig();

    if (!serializedConfig) {
      return createDemoConfig();
    }

    const config: unknown = JSON.parse(serializedConfig);

    return isPetConfig(config) ? config : createDemoConfig();
  } catch {
    return createDemoConfig();
  }
}

function isPetConfig(value: unknown): value is PetConfig {
  if (!value || typeof value !== "object") {
    return false;
  }

  const config = value as Partial<PetConfig>;

  return (
    Array.isArray(config.instances) &&
    typeof config.mode === "string" &&
    Boolean(config.settings) &&
    typeof config.settings?.lightIntensity === "number" &&
    typeof config.settings.roughness === "number" &&
    typeof config.settings.textureScale === "number" &&
    typeof config.settings.textureStrength === "number"
  );
}

function createDemoConfig(): PetConfig {
  const pattern = ["01110", "11111", "10101", "11111", "01110"];
  const instances = pattern.flatMap((row, rowIndex) =>
    Array.from(row).flatMap((cell, columnIndex) =>
      cell === "1"
        ? [
            {
              hex: "#fb7185",
              x: columnIndex - 2,
              y: 2 - rowIndex,
            },
          ]
        : [],
    ),
  );

  return {
    instances,
    mode: "beads",
    settings: defaultModelPreviewSettings,
  };
}

function resolvePetAssetUrl(url: string) {
  return new URL(url.replace(/^\//, ""), document.baseURI).href;
}
