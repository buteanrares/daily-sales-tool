"use client";

import via from "@/public/via.svg";
import { useReportStore } from "@/utils/state/store";
import { supabase } from "@/utils/supabase/client";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navbar() {
  const { selectedReport } = useReportStore();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("User");
  const [anchorEl, setAnchorEl] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();

      setUser(data.user);
      if (!data.user && pathname !== "/auth/signin") {
        router.push("/auth/signin");
      }
    };

    checkUser();

    // if (user) {
    //   supabase
    //     .from("profiles")
    //     .select("role")
    //     .single()
    //     .then((res) => console.log(res));
    // }
  }, [router, pathname]);

  if (!user && pathname === "/auth/signin") {
    return null;
  }

  const handleAvatarClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/signin");
    handleClose();
  };

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
          <Button onClick={handleAvatarClick} sx={{ padding: 0 }}>
            <Avatar sx={{ bgcolor: "#1976D2", marginX: 5 }}>RB</Avatar>
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
          <Image src={via} alt="logo" />
        </Toolbar>
      </Container>
    </AppBar>
  );
}
