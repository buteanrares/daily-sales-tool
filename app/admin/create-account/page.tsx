"use client";

import { supabase } from "@/utils/supabase/client";
import {
  Box,
  Button,
  Container,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import toast from "react-hot-toast";

const CreateAccount = () => {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("User");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInviteUser = async () => {
    setLoading(true);
    setError("");

    try {
      const { data, error: inviteError } =
        await supabase.auth.admin.inviteUserByEmail(email, {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
        });

      if (inviteError) {
        throw inviteError;
      }

      // Add user profile information
      const { error: updateError } = await supabase.from("profiles").upsert({
        id: data.user.id,
        email: data.user.email,
        role,
        first_name: firstName,
        last_name: lastName,
      });

      if (updateError) {
        throw updateError;
      }

      toast.success(`Invite sent to ${email} successfully`);
      setEmail("");
      setFirstName("");
      setLastName("");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box mt={5}>
        <Typography variant="h4" component="h1" gutterBottom>
          Create Account
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
          label="First name"
          variant="outlined"
          fullWidth
          margin="normal"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <TextField
          label="Last name"
          variant="outlined"
          fullWidth
          margin="normal"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
        <TextField
          label="Role"
          variant="outlined"
          fullWidth
          select
          margin="normal"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <MenuItem value="User">User</MenuItem>
          <MenuItem value="Admin">Admin</MenuItem>
        </TextField>
        <Box mt={2}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleInviteUser}
            disabled={loading}
          >
            {loading ? "Sending Invite..." : "Send Invite"}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default CreateAccount;
