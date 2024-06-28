"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Container, TextField, Button, Typography, Box } from "@mui/material";
import { supabase } from "@/utils/supabase/client";
import logo from "@/public/logo.jpg";
import Image from "next/image";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const router = useRouter();

  const maxAttempts = 3;

  const checkAccountLock = async (email) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id,is_locked")
      .eq("email", email)
      .single();

    setIsLocked(profile.is_locked);
    return profile.is_locked;
  };

  const lockUser = async (email) => {
    await supabase
      .from("profiles")
      .update({ is_locked: true })
      .eq("email", email);
  };

  const handleSignIn = async () => {
    setLoading(true);
    setError("");

    const isLocked = await checkAccountLock(email);
    if (isLocked) {
      setError(
        "Your account is locked due to multiple failed sign-in attempts."
      );
      setLoading(false);
      return;
    }

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setAttempts((prevAttempts) => {
          const newAttempts = prevAttempts + 1;

          if (newAttempts >= maxAttempts) {
            if (email) {
              console.log("locking profile", email);

              lockUser(email);
              setIsLocked(true);
              setError(
                "Your account has been locked due to multiple failed sign-in attempts."
              );
            }
          } else {
            setError(signInError.message);
          }

          return newAttempts;
        });
      } else {
        router.push("/");
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container
      maxWidth="sm"
      sx={{
        marginY: "200px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "75vh",
      }}
    >
      <Box sx={{ width: "100%", textAlign: "center" }}>
        <Typography variant="h4" component="h1" gutterBottom>
          DAILY SALES TOOL
        </Typography>
        {error && (
          <Typography color="error" gutterBottom>
            {error}
          </Typography>
        )}
        {attempts > 0 && attempts < maxAttempts && (
          <Typography color="error" gutterBottom>
            Attempts left: {maxAttempts - attempts}
          </Typography>
        )}
        <TextField
          label="Email"
          variant="outlined"
          fullWidth
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
        <TextField
          label="Password"
          variant="outlined"
          fullWidth
          type="password"
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
        <Box mt={2}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleSignIn}
            disabled={loading}
          >
            {loading ? "Signing In..." : "Sign In"}
          </Button>
        </Box>
        <Box sx={{ transform: "scale(0.1)", mb: 15 }}>
          <Image src={logo} alt="logo" />
        </Box>
      </Box>
    </Container>
  );
};

export default SignIn;
