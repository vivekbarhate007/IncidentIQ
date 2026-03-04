package com.incidentiq.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;

@Data
@Document(collection = "incidents")
public class Incident {
    @Id
    private String id;
    private Instant createdAt;
    private String severity; // HIGH, MED, LOW
    private String type; // LATENCY, ERROR_RATE, RESERVATION_FAILURE
    private String status; // OPEN, ACK, RESOLVED
    private String summary;
    private String details;
    private String metricsSnapshot;
}
