import { useState, useCallback } from "react";

export type PermissionType = "camera" | "location";
export type PermissionStatus = "prompt" | "granted" | "denied" | "unavailable";

interface PermissionState {
  camera: PermissionStatus;
  location: PermissionStatus;
}

export const usePermissions = () => {
  const [permissions, setPermissions] = useState<PermissionState>({
    camera: "prompt",
    location: "prompt"
  });

  const requestCameraPermission = useCallback(async (): Promise<boolean> => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setPermissions((prev) => ({ ...prev, camera: "unavailable" }));
        return false;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });

      stream.getTracks().forEach((track) => track.stop());

      setPermissions((prev) => ({ ...prev, camera: "granted" }));
      return true;
    } catch (error) {
      if (error instanceof Error) {
        if (
        error.name === "NotAllowedError" ||
        error.name === "PermissionDeniedError")
        {
          setPermissions((prev) => ({ ...prev, camera: "denied" }));
        } else {
          setPermissions((prev) => ({ ...prev, camera: "unavailable" }));
        }
      }
      return false;
    }
  }, []);

  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setPermissions((prev) => ({ ...prev, location: "unavailable" }));
        resolve(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        () => {
          setPermissions((prev) => ({ ...prev, location: "granted" }));
          resolve(true);
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            setPermissions((prev) => ({ ...prev, location: "denied" }));
          } else {
            setPermissions((prev) => ({ ...prev, location: "unavailable" }));
          }
          resolve(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }, []);

  const checkPermissionStatus = useCallback(
    async (type: PermissionType): Promise<PermissionStatus> => {
      if (type === "camera") {
        try {
          const result = await navigator.permissions.query({
            name: "camera" as PermissionName
          });
          const status =
          result.state === "granted" ?
          "granted" :
          result.state === "denied" ?
          "denied" :
          "prompt";
          setPermissions((prev) => ({ ...prev, camera: status }));
          return status;
        } catch {
          return "prompt";
        }
      }

      if (type === "location") {
        try {
          const result = await navigator.permissions.query({
            name: "geolocation"
          });
          const status =
          result.state === "granted" ?
          "granted" :
          result.state === "denied" ?
          "denied" :
          "prompt";
          setPermissions((prev) => ({ ...prev, location: status }));
          return status;
        } catch {
          return "prompt";
        }
      }

      return "prompt";
    },
    []
  );

  return {
    permissions,
    requestCameraPermission,
    requestLocationPermission,
    checkPermissionStatus
  };
};