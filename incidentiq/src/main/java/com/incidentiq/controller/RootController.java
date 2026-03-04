package com.incidentiq.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
public class RootController {
    @GetMapping("/")
    public Map<String, String> index() {
        return Map.of(
            "status", "UP",
            "message", "Welcome to IncidentIQ API Platform",
            "docs", "/README.md",
            "health", "/actuator/health"
        );
    }
}
