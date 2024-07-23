"use client";

import logo from "@/public/logo.jpg";
import { supabase } from "@/utils/supabase/client";
import {
  Box,
  Button,
  Container,
  Link,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from "@mui/material";
import { MuiOtpInput } from "mui-one-time-password-input";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const router = useRouter();
  const maxAttempts = 3;
  const steps = ["Sign In", "Verify OTP"];

  const checkAccountLock = async (email) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id,is_locked")
      .eq("email", email)
      .single();

    return profile?.is_locked;
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
        "Your account is locked due to multiple failed sign-in attempts.\nContact an Admin to unlock your account."
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
              lockUser(email);
              setError(
                "Your account has been locked due to multiple failed sign-in attempts. Contact an Admin to unlock your account."
              );
            }
          } else {
            setError(signInError.message);
          }

          return newAttempts;
        });
      } else {
        // Send OTP
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: false,
          },
        });

        if (otpError) {
          setError(otpError.message);
        } else {
          setActiveStep(1);
        }
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    setError("");

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });

      if (verifyError) {
        setError(verifyError.message);
      } else {
        router.push("/");
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setLoading(true);
    setError("");

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        }
      );

      if (resetError) {
        setError(resetError.message);
      } else {
        setResetEmailSent(true);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  console.log(otp);

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
        <Stepper activeStep={activeStep} alternativeLabel className="my-10">
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        {error && (
          <Typography color="error" gutterBottom>
            {error}
          </Typography>
        )}
        {attempts > 0 && attempts < maxAttempts && activeStep === 0 && (
          <Typography color="error" gutterBottom>
            Attempts left: {maxAttempts - attempts}
          </Typography>
        )}
        {resetEmailSent && (
          <Typography color="success" gutterBottom>
            Password reset email sent! Please check your email.
          </Typography>
        )}
        {activeStep === 0 && (
          <>
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
            <Box mt={2}>
              <Link
                component="button"
                variant="body2"
                onClick={handlePasswordReset}
                disabled={loading}
              >
                Forgot Password?
              </Link>
            </Box>
          </>
        )}
        {activeStep === 1 && (
          <>
            <Typography gutterBottom>
              An OTP has been sent to your email. Please enter the OTP below to
              complete the sign-in process.
            </Typography>
            <MuiOtpInput length={6} value={otp} onChange={(e) => setOtp(e)} />
            <Box mt={2}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={verifyOtp}
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </Button>
            </Box>
          </>
        )}
        <Box sx={{ transform: "scale(0.1)", mb: 15 }}>
          <Image src={logo} alt="logo" />
        </Box>
      </Box>
    </Container>
  );
};

export default SignIn;
