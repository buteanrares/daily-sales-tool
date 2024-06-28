"use client";

import { supabase } from "@/utils/supabase/client";
import React, { useEffect, useState } from "react";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
} from "@mui/material";

export default function LockedUsers() {
  const [lockedUsers, setLockedUsers] = useState([]);

  useEffect(() => {
    const getLockedUsers = async () => {
      const { data: locked_users } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_locked", true);
      setLockedUsers(locked_users);
    };
    getLockedUsers();
  }, []);

  const handleUnlock = async (id) => {
    await supabase.from("profiles").update({ is_locked: false }).eq("id", id);

    // Update the state to remove the unlocked user
    setLockedUsers((prev) => prev.filter((user) => user.id !== id));
  };

  return (
    <>
      <div className="flex items-center align-middle border-5 border-red-500">
        <Typography variant="h4" className="mt-3">
          Test
        </Typography>
      </div>
      <TableContainer component={Paper} className="w-[70%] mx-auto mt-10">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>First Name</TableCell>
              <TableCell>Last Name</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {lockedUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.first_name || "N/A"}</TableCell>
                <TableCell>{user.last_name || "N/A"}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<LockOpenIcon />}
                    onClick={() => handleUnlock(user.id)}
                  >
                    Unlock
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
