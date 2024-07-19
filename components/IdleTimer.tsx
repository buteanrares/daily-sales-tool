"use client";

import { supabase } from "@/utils/supabase/client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useIdleTimer } from "react-idle-timer";

const IdleTimerComponent = () => {
  const router = useRouter();
  const pathName = usePathname();
  const [timeoutInterval, setTimeoutInterval] = useState(15);

  useEffect(() => {
    const getTimeoutInterval = async () => {
      const { data } = await supabase
        .from("settings")
        .select("inactivity_interval")
        .single();
      setTimeoutInterval(data.inactivity_interval);
    };
    getTimeoutInterval();
  });

  const handleOnIdle = async () => {
    if (pathName !== "/auth/signin") {
      await supabase.auth.signOut();
      router.push("/auth/signin");
    }
  };

  useIdleTimer({
    timeout: timeoutInterval * 1000 * 60,
    onIdle: handleOnIdle,
    debounce: 500,
  });

  return null; // This component does not render anything
};

export default IdleTimerComponent;
