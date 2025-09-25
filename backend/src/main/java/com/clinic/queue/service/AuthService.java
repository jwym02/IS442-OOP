package com.clinic.queue.service;

import java.nio.CharBuffer;
import java.util.Arrays;

import com.clinic.queue.model.User;

public class AuthService {

    private final PasswordEncoder passwordEncoder;

    public AuthService(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }

    public Boolean login(String email, char[] password) {
        if (email == null || email.isBlank() || password == null) {
            wipe(password);
            return Boolean.FALSE;
        }

        User user = findUserByEmail(email);
        if (user == null) {
            wipe(password);
            return Boolean.FALSE;
        }

        char[] storedHash = user.getPasswordHash();
        try {
            return verifyPassword(password, storedHash);
        } finally {
            wipe(storedHash);
        }
    }

    public void logout(User user) {
        if (user != null) {
            wipe(user.getPasswordHash());
        }
    }

    private Boolean verifyPassword(char[] password, char[] hashedPassword) {
        if (password == null || hashedPassword == null || hashedPassword.length == 0) {
            wipe(password);
            return Boolean.FALSE;
        }

        try {
            CharBuffer passwordBuffer = CharBuffer.wrap(password);
            String hashed = new String(hashedPassword);
            return passwordEncoder.matches(passwordBuffer, hashed);
        } finally {
            wipe(password);
        }
    }

    protected User findUserByEmail(String email) {
        // TODO: integrate with persistence layer
        return null;
    }

    private void wipe(char[] value) {
        if (value != null) {
            Arrays.fill(value, '\0');
        }
    }
}

