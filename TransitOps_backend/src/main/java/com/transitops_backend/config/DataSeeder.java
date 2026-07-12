package com.transitops_backend.config;

import com.transitops_backend.entity.Role;
import com.transitops_backend.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;

    @Override
    public void run(String... args) {
        List<String[]> roles = List.of(
                new String[]{"FLEET_MANAGER", "Oversees fleet assets, maintenance, vehicle lifecycle"},
                new String[]{"DRIVER", "Creates trips, assigns vehicle/driver, monitors deliveries"},
                new String[]{"SAFETY_OFFICER", "Driver compliance, license validity, safety scores"},
                new String[]{"FINANCIAL_ANALYST", "Expenses, fuel cost, maintenance cost, profitability"}
        );

        for (String[] roleData : roles) {
            if (roleRepository.findByName(roleData[0]).isEmpty()) {
                Role role = Role.builder()
                        .name(roleData[0])
                        .description(roleData[1])
                        .build();
                roleRepository.save(role);
                log.info("Seeded role: {}", roleData[0]);
            }
        }

        log.info("Data seeding complete. {} roles in database.", roleRepository.count());
    }
}
