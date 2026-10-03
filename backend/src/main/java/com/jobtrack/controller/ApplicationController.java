package com.jobtrack.controller;

import com.jobtrack.model.JobApplication;
import com.jobtrack.repo.ApplicationRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/applications")
@CrossOrigin(origins = "*")
public class ApplicationController {
    private static final List<String> STATUSES = List.of("Applied", "Interview", "Offer", "Rejected");
    private final ApplicationRepository repo;

    public ApplicationController(ApplicationRepository repo) { this.repo = repo; }

    /** GET /applications?q=&status=&sort=newest|oldest|company */
    @GetMapping
    public List<JobApplication> list(@RequestParam(required = false) String q,
                                     @RequestParam(required = false) String status,
                                     @RequestParam(defaultValue = "newest") String sort) {
        Comparator<JobApplication> byDate = Comparator.comparing(JobApplication::getAppliedDate,
                Comparator.nullsFirst(Comparator.<LocalDate>naturalOrder()));
        Comparator<JobApplication> cmp = switch (sort) {
            case "oldest" -> byDate;
            case "company" -> Comparator.comparing((JobApplication a) -> a.getCompany().toLowerCase());
            default -> byDate.reversed();
        };
        String needle = q == null ? "" : q.trim().toLowerCase();
        return repo.findAll().stream()
                .filter(a -> status == null || status.isBlank() || status.equalsIgnoreCase(a.getStatus()))
                .filter(a -> needle.isEmpty() || (a.getCompany() + " " + a.getPosition() + " "
                        + Objects.toString(a.getLocation(), "")).toLowerCase().contains(needle))
                .sorted(cmp).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public JobApplication get(@PathVariable Long id) { return find(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public JobApplication create(@Valid @RequestBody JobApplication a) {
        a.setId(null);
        return repo.save(normalize(a));
    }

    @PutMapping("/{id}")
    public JobApplication update(@PathVariable Long id, @Valid @RequestBody JobApplication in) {
        JobApplication a = find(id);
        normalize(in);
        a.setCompany(in.getCompany()); a.setPosition(in.getPosition()); a.setStatus(in.getStatus());
        a.setLocation(in.getLocation()); a.setSalary(in.getSalary()); a.setAppliedDate(in.getAppliedDate());
        a.setInterviewDate(in.getInterviewDate()); a.setNotes(in.getNotes());
        return repo.save(a);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        find(id);
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    /** GET /applications/stats - dashboard statistics */
    @GetMapping("/stats")
    public Map<String, Object> stats() {
        List<JobApplication> all = repo.findAll();
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("total", all.size());
        for (String s : STATUSES)
            out.put(s.toLowerCase(), all.stream().filter(a -> s.equals(a.getStatus())).count());
        long offers = all.stream().filter(a -> "Offer".equals(a.getStatus())).count();
        out.put("offerRate", all.isEmpty() ? 0 : Math.round(offers * 100.0 / all.size()));

        List<Map<String, Object>> monthly = new ArrayList<>();
        YearMonth now = YearMonth.now();
        for (int i = 5; i >= 0; i--) {
            YearMonth ym = now.minusMonths(i);
            long c = all.stream().filter(a -> a.getAppliedDate() != null
                    && YearMonth.from(a.getAppliedDate()).equals(ym)).count();
            monthly.add(Map.of("label", ym.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH), "count", c));
        }
        out.put("monthly", monthly);
        return out;
    }

    private JobApplication find(Long id) {
        return repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));
    }

    private JobApplication normalize(JobApplication a) {
        String s = a.getStatus() == null || a.getStatus().isBlank() ? "Applied" : a.getStatus();
        a.setStatus(STATUSES.stream().filter(x -> x.equalsIgnoreCase(s)).findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status must be one of " + STATUSES)));
        a.setCompany(a.getCompany().trim());
        a.setPosition(a.getPosition().trim());
        if (a.getAppliedDate() == null) a.setAppliedDate(LocalDate.now());
        return a;
    }
}
