"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Container, TextField, Button, Typography, Box } from "@mui/material";
import { supabase } from "@/utils/supabase/client";
import via from "@/public/via.svg";
import Image from "next/image";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSignIn = async () => {
    setLoading(true);
    setError("");

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      router.push("/"); // Redirect to homepage or dashboard
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
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "75vh",
      }}
    >
      <Box sx={{ transform: "scale(2)", mb: 15 }}>
        <Image src={via} alt="logo" />
      </Box>
      <Box sx={{ width: "100%", textAlign: "center" }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Sign In
        </Typography>
        {error && (
          <Typography color="error" gutterBottom>
            {error}
          </Typography>
        )}
        <TextField
          label="Email"
          variant="outlined"
          fullWidth
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label="Password"
          variant="outlined"
          fullWidth
          type="password"
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
      </Box>
    </Container>
  );
};

export default SignIn;
