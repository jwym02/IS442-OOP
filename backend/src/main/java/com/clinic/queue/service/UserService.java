package com.clinic.queue.service;

import org.springframework.security.core.*;
import org.springframework.stereotype.Service;

import com.clinic.queue.entity.User;
import com.clinic.queue.repository.UserRepository;

@Service
public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    
    public void registerUser(long userId, String name, String email,
                             String contact, String passwordHash) {
        // Password hashing, validation, saving, and email sending
        User newUser = new User();
        newUser.setUserId(userId);;
        newUser.setName(name);
        newUser.setEmail(email);
        newUser.setContact(contact);
        newUser.setPassword(passwordHash);
    }


    // Move to pw hash service?

    // private String hashPassword(String password) {
    //     // Password hashing logic
    //     return "hashedPassword"; // Placeholder
    // }
}
