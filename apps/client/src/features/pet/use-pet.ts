import { Pet, type PetConfig, type PetStatus } from "@bead/pet";
import { Capacitor } from "@capacitor/core";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const unsupportedStatus: PetStatus = {
  permissionGranted: false,
  running: false,
  supported: false,
};

export function usePet() {
  const supported =
    Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
  const [status, setStatus] = useState<PetStatus>(unsupportedStatus);
  const [isBusy, setIsBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!supported) {
      setStatus(unsupportedStatus);
      return;
    }

    try {
      setStatus(await Pet.getStatus());
    } catch (error) {
      console.error("Unable to read desktop pet status", error);
    }
  }, [supported]);

  useEffect(() => {
    refresh();

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        refresh();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refresh]);

  async function start(config: PetConfig) {
    if (!supported || isBusy) {
      return;
    }

    setIsBusy(true);

    try {
      let currentStatus = await Pet.getStatus();
      const wasRunning = currentStatus.running;

      if (!currentStatus.permissionGranted) {
        const permission = await Pet.requestPermission();

        if (!permission.permissionGranted) {
          toast.info("授予悬浮窗权限后才能显示桌面宠物");
          await refresh();
          return;
        }
      }

      currentStatus = await Pet.start({ config });
      setStatus(currentStatus);
      toast.success(wasRunning ? "桌面宠物已更新" : "桌面宠物已启动");
    } catch (error) {
      console.error("Unable to start desktop pet", error);
      toast.error("桌面宠物启动失败");
      await refresh();
    } finally {
      setIsBusy(false);
    }
  }

  async function stop() {
    if (!supported || isBusy) {
      return;
    }

    setIsBusy(true);

    try {
      setStatus(await Pet.stop());
      toast.success("桌面宠物已停止");
    } catch (error) {
      console.error("Unable to stop desktop pet", error);
      toast.error("桌面宠物停止失败");
      await refresh();
    } finally {
      setIsBusy(false);
    }
  }

  return {
    isBusy,
    isRunning: status.running,
    start,
    stop,
    supported,
  };
}
