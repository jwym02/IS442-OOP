package com.clinic.queue.service;

import com.clinic.queue.model.User;

public class AuthService {
    public Boolean login(String email, char[] password) {
        // TODO: implement
        return verifyPassword(password, new char[]{});
    }

    public void logout(User user) {
        // TODO: implement
    }

    private Boolean verifyPassword(char[] password, char[] hashedPassword) {
        // TODO: implement
        return false;
    }
}

