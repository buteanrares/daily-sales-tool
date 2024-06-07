import {
  AppBar,
  Box,
  Button,
  Container,
  Toolbar,
  Typography,
} from "@mui/material";
import React from "react";
import Image from "next/image";
import via from "@/public/via.svg";
import Link from "next/link";

export default function Navbar() {
  return (
    <AppBar position="sticky" className="z-50">
      <Container maxWidth="xl">
        <Toolbar disableGutters variant="dense" className="h-3">
          <Typography className="mr-10 font-semibold">
            DAILY SALES TOOL
          </Typography>
          <Box sx={{ marginRight: 2, display: { xs: "none", md: "flex" } }}>
            <Link href={`/`}>REPORT</Link>
          </Box>
          <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
            <Link href={`/versioning`}>VERSIONING</Link>
          </Box>
          <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
            <Button sx={{ my: 2, color: "white", display: "block" }}>
              FLFO v1
            </Button>
          </Box>
          <Button sx={{ my: 2, color: "white", display: "block" }}>RB</Button>
          <Image src={via} alt="logo" />
        </Toolbar>
      </Container>
    </AppBar>
  );
}
