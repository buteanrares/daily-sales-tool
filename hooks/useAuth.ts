import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";

export const useAuth = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      setLoading(false);
    };

    getUser();
  }, []);

  return { user, loading };
};
