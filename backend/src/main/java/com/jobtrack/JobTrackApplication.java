package com.jobtrack;

import com.jobtrack.model.JobApplication;
import com.jobtrack.model.User;
import com.jobtrack.repo.ApplicationRepository;
import com.jobtrack.repo.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.time.LocalDate;
import java.time.LocalDateTime;

@SpringBootApplication
public class JobTrackApplication {
    public static void main(String[] args) { SpringApplication.run(JobTrackApplication.class, args); }

    @Bean BCryptPasswordEncoder encoder() { return new BCryptPasswordEncoder(); }

    @Bean
    CommandLineRunner seed(ApplicationRepository apps, UserRepository users, BCryptPasswordEncoder enc,
                           @Value("${jobtrack.seed:true}") boolean seed) {
        return args -> {
            if (!seed) return;
            if (users.count() == 0) users.save(new User("Demo User", "demo@jobtrack.com", enc.encode("demo123")));
            if (apps.count() > 0) return;
            LocalDate t = LocalDate.now();
            Object[][] d = {
                {"Google", "Frontend Engineer", "Interview", "Bengaluru", "32 LPA", 4},
                {"Microsoft", "Software Engineer", "Applied", "Hyderabad", "28 LPA", 2},
                {"Amazon", "SDE I", "Offer", "Pune", "30 LPA", 21},
                {"Flipkart", "Backend Developer", "Rejected", "Bengaluru", "24 LPA", 35},
                {"Razorpay", "Full Stack Developer", "Interview", "Remote", "26 LPA", 9},
                {"Atlassian", "Java Developer", "Applied", "Remote", "35 LPA", 1},
                {"Swiggy", "React Developer", "Applied", "Mumbai", "22 LPA", 12},
                {"Zoho", "Product Engineer", "Offer", "Chennai", "18 LPA", 50},
                {"Infosys", "Systems Engineer", "Rejected", "Mumbai", "9 LPA", 65},
                {"Adobe", "Web Developer", "Applied", "Noida", "27 LPA", 80}
            };
            int k = 0;
            for (Object[] r : d) {
                JobApplication a = new JobApplication((String) r[0], (String) r[1], (String) r[2], (String) r[3],
                        (String) r[4], t.minusDays((Integer) r[5]));
                if ("Interview".equals(r[2])) {
                    a.setInterviewDate(LocalDateTime.now().plusDays(1 + 3L * k++).withHour(11).withMinute(0).withSecond(0).withNano(0));
                    a.setNotes("Prepare system design, DSA and behavioural rounds.");
                }
                apps.save(a);
            }
        };
    }
}
