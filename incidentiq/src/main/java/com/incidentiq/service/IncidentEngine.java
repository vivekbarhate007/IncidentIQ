package com.incidentiq.service;

import com.incidentiq.model.AuditEvent;
import com.incidentiq.model.Incident;
import com.incidentiq.repository.AuditEventRepository;
import com.incidentiq.repository.IncidentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class IncidentEngine {
    private final AuditEventRepository auditEventRepository;
    private final IncidentRepository incidentRepository;

    @Scheduled(fixedRate = 60000) // Every 1 minute
    public void analyzeHealth() {
        log.info("Running Incident Detection Engine...");
        Instant now = Instant.now();
        Instant fiveMinsAgo = now.minus(5, ChronoUnit.MINUTES);
        
        List<AuditEvent> events = auditEventRepository.findByTsBetween(fiveMinsAgo, now);
        if (events.isEmpty()) return;

        long totalCount = events.size();
        long errorCount = events.stream().filter(e -> e.getStatus() >= 500).count();
        double errorRate = (double) errorCount / totalCount;

        // Rule 1: 5xx Rate > 2%
        if (errorRate > 0.02) {
            createIncident("HIGH", "ERROR_RATE", "High 5xx error rate detected: " + (errorRate * 100) + "%");
        }

        // Rule 2: P95 Latency > 400ms
        List<Long> latencies = events.stream().map(AuditEvent::getLatencyMs).sorted().toList();
        int p95Index = (int) (totalCount * 0.95);
        long p95Latency = latencies.get(Math.min(p95Index, (int)totalCount - 1));
        
        if (p95Latency > 400) {
            createIncident("MED", "LATENCY", "P95 Latency is high: " + p95Latency + "ms");
        }
    }

    private void createIncident(String severity, String type, String summary) {
        log.warn("DETECTED INCIDENT: {} - {}", severity, summary);
        Incident incident = new Incident();
        incident.setCreatedAt(Instant.now());
        incident.setSeverity(severity);
        incident.setType(type);
        incident.setStatus("OPEN");
        incident.setSummary(summary);
        incident.setDetails("Automated detection based on last 5 minutes of audit logs.");
        incidentRepository.save(incident);
    }
}
