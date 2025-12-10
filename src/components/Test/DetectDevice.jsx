import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export function useDeviceType() {
  const [deviceType, setDeviceType] = useState("Loading");

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;

    if (/android/i.test(userAgent)) {
      setDeviceType("Android");
      toast.success('this is android');
    } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
      setDeviceType("iOS");
      toast.success('this is ios');
    } else {
      setDeviceType("Other");
      toast.success('this is Other');
    }
  }, []);

  return deviceType;
}