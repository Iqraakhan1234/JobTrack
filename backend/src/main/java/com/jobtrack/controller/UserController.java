package com.jobtrack.controller;

import com.jobtrack.model.User;
import com.jobtrack.repo.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/users")
@CrossOrigin(origins = "*")
public class UserController {
    private final UserRepository repo;
    private final BCryptPasswordEncoder enc;

    public UserController(UserRepository repo, BCryptPasswordEncoder enc) { this.repo = repo; this.enc = enc; }

    @GetMapping
    public List<User> all() { return repo.findAll(); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public User register(@RequestBody User u) {
        if (blank(u.getName()) || blank(u.getEmail()) || blank(u.getPassword()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name, email and password are required");
        if (u.getPassword().length() < 6)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least 6 characters");
        u.setEmail(u.getEmail().trim().toLowerCase());
        if (repo.findByEmail(u.getEmail()).isPresent())
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        u.setId(null);
        u.setPassword(enc.encode(u.getPassword()));
        return repo.save(u);
    }

    @PostMapping("/login")
    public User login(@RequestBody Map<String, String> body) {
        String email = body.getOrDefault("email", "").trim().toLowerCase();
        return repo.findByEmail(email)
                .filter(u -> enc.matches(body.getOrDefault("password", ""), u.getPassword()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
    }

    @PutMapping("/{id}")
    public User update(@PathVariable Long id, @RequestBody Map<String, String> b) {
        User u = repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        String name = b.get("name");
        if (!blank(name)) u.setName(name.trim());
        String np = b.get("newPassword");
        if (!blank(np)) {
            if (np.length() < 6) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password must be at least 6 characters");
            if (!enc.matches(b.getOrDefault("currentPassword", ""), u.getPassword()))
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
            u.setPassword(enc.encode(np));
        }
        return repo.save(u);
    }

    private boolean blank(String s) { return s == null || s.isBlank(); }
}
