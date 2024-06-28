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
import AssessmentIcon from "@mui/icons-material/Assessment";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [role, setRole] = useState("User");
  const [initials, setInitials] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();

      setUser(data.user);
      if (!data.user && pathname !== "/auth/signin") {
        if (pathname !== "/auth/signin") router.push("/auth/signin");
      } else if (pathname !== "/auth/signin") {
        const res = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user?.id)
          .single();
        setInitials(res.data?.first_name[0] + res.data?.last_name[0]);
        setRole(res.data?.role);
      }
    };

    checkUser();
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
      <Toolbar disableGutters variant="dense" className="h-3 mx-5">
        <div className="flex">
          <AssessmentIcon />
          <Typography className="mr-20">DAILY SALES TOOL</Typography>
        </div>
        <div className="flex-grow space-x-5 ">
          <Link href={`/`}>Home</Link>
          {role === "Admin" && <Link href={`/versioning`}>Versioning</Link>}
          {role === "Admin" && (
            <Link href={`/admin/create-account`}>Admin</Link>
          )}
        </div>
        <Button onClick={handleAvatarClick} sx={{ padding: 0 }}>
          <Avatar sx={{ bgcolor: "#1976D2", marginX: 5 }}>{initials}</Avatar>
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
        >
          <MenuItem onClick={handleLogout}>Logout</MenuItem>
        </Menu>
        <Image src={via} className="scale-75" alt="logo" />
      </Toolbar>
    </AppBar>
  );
}
