"use client";

import {
  AppBar,
  Box,
  Button,
  Container,
  Toolbar,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import via from "@/public/via.svg";
import Link from "next/link";
import { useReportStore } from "@/utils/state/store";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/utils/supabase/client";

export default function Navbar() {
  // @ts-ignore
  const { selectedReport } = useReportStore();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("User");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      // console.log("data", data);

      setUser(data.user);
      if (!data.user && pathname !== "/auth/signin") {
        router.push("/auth/signin");
      }
    };

    checkUser();

    if (user) {

      supabase
        .from("profiles")
        .select("role")
        .single()
        .then((res) => console.log(res));
    }
  }, [router, pathname]);

  if (!user && pathname === "/auth/signin") {
    return null;
  }

  return (
    <AppBar position="sticky" className="z-50">
      <Container maxWidth="xl">
        <Toolbar disableGutters variant="dense" className="h-3">
          <Typography className="mr-10 font-semibold">
            DAILY SALES TOOL
          </Typography>
          <Box sx={{ marginRight: 2, display: { xs: "none", md: "flex" } }}>
            <Link href={`/`}>HOME</Link>
          </Box>
          <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
            <Link href={`/versioning`}>VERSIONING</Link>
          </Box>
          <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
            <Button sx={{ my: 2, color: "white", display: "block" }}>
              {selectedReport}
            </Button>
          </Box>
          <Button sx={{ my: 2, color: "white", display: "block" }}>RB</Button>
          <Image src={via} alt="logo" />
        </Toolbar>
      </Container>
    </AppBar>
  );
}
